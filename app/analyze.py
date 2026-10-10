"""Report analysis: Gemini (PDF / image, structured JSON) with an offline text-PDF fallback."""
import io
import logging
import re

from pydantic import BaseModel

from . import labs_kb
from .gemini import GeminiClient, GeminiUnavailable
from .schemas import AnalyzeResponse, LabValue

log = logging.getLogger("carelens.analyze")

PROMPT = """You are reading a medical lab report for a patient-facing companion app.
Extract EVERY numeric lab test you can read. For each one return:
- name (as printed), unit, curr (the patient's value as a number)
- refLow / refHigh: the reference range PRINTED on the report (null if open-ended or absent)
- en: 1-2 plain sentences for a non-medical reader: what the test measures and whether the value is inside, below or above the range.
- hi: the same in simple Hinglish (Hindi in Roman script).
Also return the lab name and the report date (YYYY-MM-DD) if printed, plus a 2-sentence overall summary in en and hi.
Rules: never diagnose, never name a disease as the cause, never recommend starting/stopping/changing medicine.
Say 'worth discussing with your doctor' for out-of-range values. Do not invent values you cannot read."""


class _GLab(BaseModel):
    name: str
    unit: str = ""
    curr: float
    refLow: float | None = None
    refHigh: float | None = None
    en: str = ""
    hi: str = ""


class _GReport(BaseModel):
    lab: str = ""
    date: str = ""
    summary_en: str = ""
    summary_hi: str = ""
    labs: list[_GLab] = []


def _slug(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_") or "test"


def _bounds(curr, low, high, d: "labs_kb.LabDef | None"):
    """Ruler range for the UI that always contains the value and the reference band."""
    pts = [curr] + [x for x in (low, high) if x is not None]
    lo, hi = min(pts), max(pts)
    span = (hi - lo) or abs(hi) or 1
    mn, mx = lo - span * 0.5, hi + span * 0.5
    if d:
        mn, mx = min(d.min, mn), max(d.max, mx)
    if mn >= 0 > lo - span:  # don't go negative for values that can't be
        mn = max(0.0, mn)
    return round(mn, 2), round(mx, 2)


def _to_lab(g: _GLab, used: set) -> LabValue:
    d = labs_kb.find_def(g.name)
    low = g.refLow if (g.refLow is not None or g.refHigh is not None) else (d.ref_low if d else None)
    high = g.refHigh if (g.refLow is not None or g.refHigh is not None) else (d.ref_high if d else None)
    unit = g.unit or (d.unit if d else "")
    lid = d.id if d else _slug(g.name)
    base, n = lid, 2
    while lid in used:
        lid, n = f"{base}_{n}", n + 1
    used.add(lid)
    en, hi = g.en, g.hi
    if (not en or not hi) and d:
        e2, h2 = labs_kb.explain(d, g.curr, None, low, high, unit)
        en, hi = en or e2, hi or h2
    mn, mx = _bounds(g.curr, low, high, d)
    return LabValue(id=lid, name=d.name if d else g.name, unit=unit, curr=g.curr, refLow=low, refHigh=high,
                    min=mn, max=mx, en=en or g.name, hi=hi or g.name)


# ---------- offline fallback (text PDFs only) ----------

def _pdf_text(data: bytes) -> str:
    from pypdf import PdfReader
    return "\n".join((p.extract_text() or "") for p in PdfReader(io.BytesIO(data)).pages)


_NUM = r"(\d+(?:\.\d+)?)"


def parse_text(text: str) -> list[_GLab]:
    """Find 'Test name  value unit  low-high' lines for the tests in the knowledge base."""
    out: list[_GLab] = []
    seen = set()
    for line in text.splitlines():
        line = line.strip()
        hit = labs_kb.match_line(line)
        if not hit or hit[0].id in seen:
            continue
        d = hit[0]
        rest = re.sub(r"\s+", " ", line.lower())[hit[1]:]
        nums = re.findall(_NUM, rest)
        if not nums:
            continue
        rng = re.search(rf"{_NUM}\s*[-\u2013\u2014]\s*{_NUM}", rest)
        low, high = (float(rng.group(1)), float(rng.group(2))) if rng else (None, None)
        seen.add(d.id)
        out.append(_GLab(name=d.name, unit=d.unit, curr=float(nums[0]), refLow=low, refHigh=high))
    return out


async def _read_one(client: GeminiClient | None, name: str, mime: str, data: bytes):
    """Returns (_GReport, source, warning|None)."""
    if client:
        try:
            rep = await client.generate_json(_GReport, PROMPT, data, mime)
            if rep.labs:
                return rep, "gemini", None
            return rep, "gemini", f"{name}: no lab values could be read."
        except GeminiUnavailable as e:
            log.warning("Gemini failed for %s: %s", name, e)
            warn = f"{name}: AI reading failed, used basic text parsing."
    else:
        warn = None
    if mime == "application/pdf":
        try:
            text = _pdf_text(data)
            labs = parse_text(text)
        except Exception:  # corrupt / encrypted pdf
            text, labs = "", []
        if labs:
            dm = re.search(r"(20\d{2}-\d{2}-\d{2})", text)
            return _GReport(date=dm.group(1) if dm else "", labs=labs), "rules", warn or f"{name}: offline mode (no Gemini key), values parsed from PDF text."
    return _GReport(), "rules", warn or f"{name}: could not be read without a Gemini API key (images and scanned PDFs need it)."


async def analyze_files(client: GeminiClient | None, files: list[tuple[str, str, bytes]]) -> AnalyzeResponse:
    reports, warnings, sources = [], [], set()
    for name, mime, data in files:
        rep, src, warn = await _read_one(client, name, mime, data)
        sources.add(src)
        if warn:
            warnings.append(warn)
        if rep.labs:
            reports.append((name, rep))
    if not reports:
        return AnalyzeResponse(labs=[], files=[f[0] for f in files], source="gemini" if "gemini" in sources else "rules", warnings=warnings)

    # Newest report = current. Reports without a date keep upload order (later = newer).
    order = sorted(range(len(reports)), key=lambda i: (reports[i][1].date or "", i))
    chain = [reports[i][1] for i in order]
    newest = chain[-1]

    used: set = set()
    labs: list[LabValue] = []
    prev_date = ""
    for g in newest.labs:
        lab = _to_lab(g, used)
        prev = None
        for older in reversed(chain[:-1]):
            for og in older.labs:
                a, b = labs_kb.find_def(og.name), labs_kb.find_def(g.name)
                if (a and b and a.id == b.id) or og.name.strip().lower() == g.name.strip().lower():
                    prev = og.curr
                    prev_date = prev_date or older.date
                    break
            if prev is not None:
                break
        if prev is not None:
            lab.prev = prev
            lab.min, lab.max = min(lab.min, prev), max(lab.max, prev)
            d = labs_kb.find_def(g.name)
            if d:
                lab.en, lab.hi = labs_kb.explain(d, g.curr, prev, lab.refLow, lab.refHigh, lab.unit) if not g.en else (
                    g.en + _trend_en(g.curr, prev), (g.hi or g.en) + _trend_hi(g.curr, prev))
            else:
                lab.en += _trend_en(g.curr, prev)
                lab.hi += _trend_hi(g.curr, prev)
        labs.append(lab)

    return AnalyzeResponse(
        labs=labs, lab=newest.lab, date=newest.date, prev_date=prev_date, summary_en=newest.summary_en, summary_hi=newest.summary_hi,
        files=[f[0] for f in files], source="gemini" if "gemini" in sources else "rules", warnings=warnings,
    )


def _trend_en(curr, prev):
    return f" Last time it was {prev:g}." if curr != prev else f" Unchanged from {prev:g} last time."


def _trend_hi(curr, prev):
    return f" Pichhli baar {prev:g} tha." if curr != prev else f" Pichhli baar bhi {prev:g} tha."
