"""Small lab knowledge base used for offline parsing and for normalising Gemini output."""
import re
from dataclasses import dataclass


@dataclass(frozen=True)
class LabDef:
    id: str
    name: str
    unit: str
    ref_low: float | None
    ref_high: float | None
    min: float
    max: float
    aliases: tuple
    what_en: str
    what_hi: str


LABS: tuple[LabDef, ...] = (
    LabDef("hb", "Hemoglobin", "g/dL", 13, 17, 5, 20, ("hemoglobin", "haemoglobin", "hb"),
           "Hemoglobin carries oxygen in your blood.", "Hemoglobin khoon mein oxygen le jaata hai."),
    LabDef("vitd", "Vitamin D (25-OH)", "ng/mL", 30, 100, 0, 100, ("vitamin d", "25-oh", "25 oh vitamin d", "vit d"),
           "Vitamin D keeps bones and muscles strong.", "Vitamin D haddiyon aur muscles ke liye zaroori hai."),
    LabDef("glu", "Fasting glucose", "mg/dL", 70, 99, 40, 300, ("fasting glucose", "fasting blood sugar", "glucose fasting", "fbs", "glucose", "blood sugar", "sugar"),
           "This is your blood sugar after an overnight fast.", "Yeh raat bhar ke fast ke baad ka blood sugar hai."),
    LabDef("a1c", "HbA1c", "%", None, 5.6, 3, 12, ("hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c"),
           "HbA1c is your average blood sugar over about 3 months.", "HbA1c pichhle 3 mahine ka average sugar batata hai."),
    LabDef("chol", "Total cholesterol", "mg/dL", None, 199, 80, 350, ("total cholesterol", "cholesterol total", "cholesterol"),
           "Cholesterol is a fat in your blood.", "Cholesterol khoon mein ek tarah ki fat hai."),
    LabDef("tsh", "TSH", "uIU/mL", 0.4, 4.0, 0, 10, ("tsh", "thyroid stimulating hormone"),
           "TSH shows how your thyroid is working.", "TSH thyroid ka kaam dikhata hai."),
    LabDef("crea", "Creatinine", "mg/dL", 0.7, 1.3, 0, 3, ("creatinine", "serum creatinine"),
           "Creatinine reflects how well your kidneys filter.", "Creatinine batata hai ki kidney kitni achhi tarah filter kar rahi hai."),
)

BY_ID = {l.id: l for l in LABS}


def find_def(name: str) -> LabDef | None:
    n = re.sub(r"[^a-z0-9 ]", " ", name.lower())
    n = re.sub(r"\s+", " ", n).strip()
    for l in LABS:
        for a in sorted(l.aliases, key=len, reverse=True):
            if re.search(rf"\b{re.escape(a)}\b", n):
                return l
    return None


def match_line(line: str):
    """Find a known test at the start of a report line. Returns (LabDef, index after the name) or None."""
    low = re.sub(r"\s+", " ", line.lower())
    best = None
    for l in LABS:
        for a in l.aliases:
            m = re.search(rf"\b{re.escape(a)}\b", low)
            if m and m.start() < 30 and (best is None or len(a) > best[2]):
                best = (l, m.end(), len(a))
    return (best[0], best[1]) if best else None


def status(curr: float, low: float | None, high: float | None) -> str:
    if low is not None and curr < low:
        return "low"
    if high is not None and curr > high:
        return "high"
    return "normal"


def explain(l: LabDef, curr: float, prev: float | None, low, high, unit: str) -> tuple[str, str]:
    """Plain-language, non-diagnostic explanation in English and Hinglish."""
    rng = f"{low:g}-{high:g}" if low is not None and high is not None else (f"up to {high:g}" if high is not None else f"{low:g}+")
    st = status(curr, low, high)
    pos_en = {"low": f"{curr:g} is below the usual {rng} range.", "high": f"{curr:g} is above the usual {rng} range.", "normal": f"{curr:g} is inside the {rng} range."}[st]
    pos_hi = {"low": f"{curr:g}, normal range ({rng}) se kam hai.", "high": f"{curr:g}, normal range ({rng}) se upar hai.", "normal": f"{curr:g}, {rng} range ke andar hai."}[st]
    tr_en = tr_hi = ""
    if prev is not None:
        d = round(curr - prev, 2)
        if d == 0:
            tr_en, tr_hi = f" It is unchanged from {prev:g} last time.", f" Pichhli baar bhi {prev:g} tha."
        else:
            better = _moved_better(curr, prev, low, high)
            tr_en = f" It is {'up' if d > 0 else 'down'} from {prev:g} last time" + (", moving toward the range." if better else ".")
            tr_hi = f" Pichhli baar {prev:g} tha" + (", yaani sudhaar hua hai." if better else ".")
    return f"{l.what_en} {pos_en}{tr_en}", f"{l.what_hi} {pos_hi}{tr_hi}"


def _dist(v, low, high):
    if low is not None and v < low:
        return low - v
    if high is not None and v > high:
        return v - high
    return 0.0


def _moved_better(curr, prev, low, high) -> bool:
    return _dist(curr, low, high) < _dist(prev, low, high)
