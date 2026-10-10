import logging

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from . import analyze as analyze_mod
from . import chat as chat_mod
from . import scan as scan_mod
from .config import get_settings
from .gemini import GeminiClient, GeminiUnavailable
from .schemas import AnalyzeResponse, ChatRequest, ChatResponse, ScanResponse

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("carelens")

settings = get_settings()
app = FastAPI(title="CareLens AI API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_client: GeminiClient | None = None


def get_client() -> GeminiClient | None:
    """Lazily created; None means offline mode (no API key)."""
    global _client
    if _client is None and settings.gemini_api_key:
        _client = GeminiClient(settings.gemini_api_key, settings.gemini_model, timeout_s=settings.gemini_timeout_s)
    return _client


IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp"}
REPORT_TYPES = IMAGE_TYPES | {"application/pdf"}
MAGIC = {  # content sniffing: don't trust the client-supplied content-type alone
    b"%PDF": "application/pdf",
    b"\x89PNG": "image/png",
    b"\xff\xd8\xff": "image/jpeg",
}


def sniff(data: bytes, declared: str | None) -> str | None:
    for sig, mime in MAGIC.items():
        if data.startswith(sig):
            return mime
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    return None


async def read_upload(f: UploadFile, allowed: set[str]) -> tuple[str, str, bytes]:
    data = await f.read(settings.max_upload_bytes + 1)
    name = f.filename or "upload"
    if len(data) > settings.max_upload_bytes:
        raise HTTPException(413, f"{name} is larger than {settings.max_upload_mb} MB.")
    if not data:
        raise HTTPException(400, f"{name} is empty.")
    mime = sniff(data, f.content_type)
    if mime not in allowed:
        raise HTTPException(415, f"{name} is not a supported file type.")
    return name, mime, data


@app.get("/health")
@app.get("/api/health")
def health():
    return {"status": "ok", "gemini": bool(settings.gemini_api_key), "model": settings.gemini_model}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(files: list[UploadFile] = File(...)):
    if not files or len(files) > 5:
        raise HTTPException(400, "Send between 1 and 5 files.")
    loaded = [await read_upload(f, REPORT_TYPES) for f in files]
    return await analyze_mod.analyze_files(get_client(), loaded)


@app.post("/api/scan", response_model=ScanResponse)
async def scan(file: UploadFile = File(...)):
    client = get_client()
    if client is None:
        raise HTTPException(503, "Prescription scanning needs a Gemini API key. Set GEMINI_API_KEY in backend/.env.")
    _, mime, data = await read_upload(file, IMAGE_TYPES)
    try:
        return await scan_mod.scan_image(client, data, mime)
    except GeminiUnavailable as e:
        log.warning("scan failed: %s", e)
        raise HTTPException(502, "The scan didn't finish. Try again with a clearer photo.")


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    return await chat_mod.answer(get_client(), req)
