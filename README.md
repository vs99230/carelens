# CareLens Backend

FastAPI API for CareLens. It reads medical reports, scans prescriptions, and answers patient questions through a safety-first Gemini integration with rule-based fallbacks.

## Quick Start On Windows

From this folder:

```powershell
.\start_backend.cmd
```

The starter uses `.venv\Scripts\python.exe -m uvicorn`, which avoids stale `uvicorn.exe` launcher errors after the project is moved between folders or Windows users.

Reload mode is optional:

```powershell
.\start_backend.cmd 8000 --reload
```

If port `8000` is busy:

```powershell
.\start_backend.cmd 8001
```

The frontend defaults to `http://localhost:8000`. If you use another port, set `VITE_API_URL` in `frontend\.env`.

## Manual Run

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
python -m pip install -r requirements.txt
copy .env.example .env
python run_backend.py --port 8000
```

Use `python run_backend.py ...` or `python -m uvicorn ...` instead of plain `uvicorn ...` when you see:

```text
Fatal error in launcher: Unable to create process using ...
```

That error means Windows found an old console-script launcher that still points to a previous absolute Python path.

If `--reload` reloads while you are editing files, you may see shutdown/restart logs. If it causes a Windows `WinError 5`, `KeyboardInterrupt`, or multiprocessing traceback, run without reload:

```powershell
python run_backend.py --port 8000
```

API docs are available at `http://localhost:8000/docs` after the server starts.

## Environment

Create `.env` from `.env.example`.

```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_S=90
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173
MAX_UPLOAD_MB=10
```

Leaving `GEMINI_API_KEY` empty keeps the backend in offline mode: chat uses rules, text PDFs can still be parsed, and prescription image scanning returns `503` because it needs Gemini vision.

## API

| Method | Path | Body | Response |
| --- | --- | --- | --- |
| GET | `/health` and `/api/health` | none | `{ status, gemini, model }` |
| POST | `/api/analyze` | multipart `files` with 1-5 PDF/PNG/JPG/WebP files, max 10 MB each by default | normalized labs, report dates, summaries, warnings, and source |
| POST | `/api/scan` | multipart `file` image | medicine items with dose, food timing, slots, and confidence |
| POST | `/api/chat` | `{ question, lang, meds, labs }` | `{ reply, source }` |

## System Design

`app.main` owns the FastAPI app, CORS, upload validation, MIME sniffing, and routing. It lazily creates one `GeminiClient` when `GEMINI_API_KEY` is present.

`app.analyze` handles report analysis. With Gemini it sends PDFs or images for structured extraction. Without Gemini it parses text-based PDFs for known lab values through `labs_kb`. Multiple uploads are ordered by report date when available so the newest report gets `curr` values and older reports fill `prev`.

`app.scan` handles prescription and medicine-strip images. It requires Gemini vision, normalizes slot names, derives `morning`, `afternoon`, and `night` from patterns like `1-0-1`, and clamps confidence between `0` and `1`.

`app.chat` answers health questions. It checks red-flag phrases first, then asks Gemini with the user's medicines and labs as context. If Gemini is unavailable, it falls back to deterministic rules.

`app.safety` centralizes urgent-care detection, Hinglish detection, emergency text, and the standard non-diagnosis disclaimer.

`app.schemas` defines the frontend contract with Pydantic models. The frontend reads the same fields directly for report cards, comparison views, scanner results, and chat.

## Safety And Privacy

CareLens explains and prepares; it does not diagnose, prescribe, or change doses. Emergency phrases return a fixed "call 112 / go to the ER" response before any model call. Uploaded files are read in memory, checked by content signature, and not stored by the server.

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```
