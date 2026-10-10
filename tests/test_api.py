import io

import pytest
from fastapi.testclient import TestClient

from app import main
from app.gemini import GeminiUnavailable

PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 64


class FakeGemini:
    def __init__(self, json_out=None, text="Hemoglobin carries oxygen.", fail=False):
        self.json_out, self.text, self.fail = json_out, text, fail

    async def generate_json(self, schema, prompt, data=None, mime=None):
        if self.fail:
            raise GeminiUnavailable("boom")
        return schema.model_validate(self.json_out)

    async def generate_text(self, system, prompt):
        if self.fail:
            raise GeminiUnavailable("boom")
        return self.text


@pytest.fixture
def api(monkeypatch):
    def use(client):
        monkeypatch.setattr(main, "get_client", lambda: client)
        return TestClient(main.app)
    return use


def pdf_bytes(lines):
    from reportlab.pdfgen import canvas  # type: ignore
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    y = 800
    for l in lines:
        c.drawString(50, y, l)
        y -= 20
    c.save()
    return buf.getvalue()


def test_health(api):
    assert api(None).get("/health").json()["status"] == "ok"


def test_chat_red_flag_never_hits_model(api):
    r = api(FakeGemini(fail=True)).post("/api/chat", json={"question": "I have chest pain", "lang": "en"})
    assert r.status_code == 200 and "112" in r.json()["reply"]


def test_chat_gemini_adds_safety_line(api):
    r = api(FakeGemini()).post("/api/chat", json={"question": "What is hemoglobin?"}).json()
    assert r["source"] == "gemini" and "not a diagnosis" in r["reply"]


def test_chat_falls_back_to_rules(api):
    r = api(FakeGemini(fail=True)).post("/api/chat", json={"question": "Mera hemoglobin kaisa hai?", "lang": "hi"}).json()
    assert r["source"] == "rules" and "Hemoglobin" in r["reply"]


def test_chat_offline_schedule(api):
    body = {"question": "what medicines today", "meds": [{"name": "Metformin", "dose": "500 mg", "slots": ["morning", "night"]}]}
    assert "Morning: Metformin" in api(None).post("/api/chat", json=body).json()["reply"]


def test_chat_validation(api):
    assert api(None).post("/api/chat", json={"question": ""}).status_code == 422


def test_scan_requires_key(api):
    assert api(None).post("/api/scan", files={"file": ("a.png", PNG, "image/png")}).status_code == 503


def test_scan_ok_and_slot_derivation(api):
    out = {"items": [{"name": "Metformin", "dose": "500 mg", "food": "1-0-1, after food", "slots": [], "conf": 0.97},
                     {"name": "Vit D3?", "dose": "?", "food": "weekly?", "slots": ["morning"], "conf": 0.5}]}
    r = api(FakeGemini(out)).post("/api/scan", files={"file": ("a.png", PNG, "image/png")}).json()
    assert r["items"][0]["slots"] == ["morning", "night"] and r["items"][1]["conf"] == 0.5


def test_scan_gemini_failure_502(api):
    assert api(FakeGemini(fail=True)).post("/api/scan", files={"file": ("a.png", PNG, "image/png")}).status_code == 502


def test_upload_rejects_fake_type(api):
    r = api(None).post("/api/scan", files={"file": ("a.png", b"not an image", "image/png")})
    assert r.status_code in (415, 503)
    r = api(FakeGemini({"items": []})).post("/api/scan", files={"file": ("a.png", b"not an image", "image/png")})
    assert r.status_code == 415


def test_analyze_two_reports_gives_prev(api):
    prev = {"date": "2026-04-12", "labs": [{"name": "Hemoglobin", "unit": "g/dL", "curr": 11.2, "refLow": 13, "refHigh": 17}]}
    curr = {"date": "2026-10-02", "lab": "PathLab", "labs": [{"name": "Haemoglobin", "unit": "g/dL", "curr": 12.8, "refLow": 13, "refHigh": 17, "en": "Hb carries oxygen.", "hi": "Hb oxygen le jaata hai."}]}
    seq = iter([prev, curr])

    class Multi(FakeGemini):
        async def generate_json(self, schema, prompt, data=None, mime=None):
            return schema.model_validate(next(seq))

    r = api(Multi()).post("/api/analyze", files=[("files", ("a.png", PNG, "image/png")), ("files", ("b.png", PNG, "image/png"))]).json()
    lab = r["labs"][0]
    assert lab["id"] == "hb" and lab["curr"] == 12.8 and lab["prev"] == 11.2
    assert lab["min"] <= 11.2 and lab["max"] >= 17 and r["date"] == "2026-10-02" and r["prev_date"] == "2026-04-12"
    # frontend contract: every lab has the fields ValueCard / Ruler read
    for k in ("id", "name", "unit", "curr", "refLow", "refHigh", "min", "max", "en", "hi"):
        assert k in lab


def test_analyze_offline_text_pdf(api):
    pytest.importorskip("reportlab")
    data = pdf_bytes(["Hemoglobin 12.8 g/dL 13.0 - 17.0", "HbA1c 6.0 % 4.0 - 5.6", "Creatinine 0.9 mg/dL 0.7 - 1.3"])
    r = api(None).post("/api/analyze", files={"files": ("r.pdf", data, "application/pdf")}).json()
    assert r["source"] == "rules" and {l["id"] for l in r["labs"]} == {"hb", "a1c", "crea"}
    hb = next(l for l in r["labs"] if l["id"] == "hb")
    assert hb["curr"] == 12.8 and hb["refLow"] == 13.0 and "below" in hb["en"]


def test_analyze_unreadable_returns_warning_not_error(api):
    r = api(None).post("/api/analyze", files={"files": ("a.png", PNG, "image/png")})
    assert r.status_code == 200 and r.json()["labs"] == [] and r.json()["warnings"]
