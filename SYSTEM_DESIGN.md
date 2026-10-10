# CareLens System Design

## Product Boundary

CareLens is a patient companion for understanding medical reports, medicine routines, symptoms, and doctor-visit preparation. It is intentionally not a diagnostic or prescribing system. The application explains user-provided information, flags urgent symptoms, and helps the user prepare better questions for a clinician.

## High-Level Architecture

```text
React + Vite frontend
  - Pages, reusable components, localStorage app state
  - Calls the backend through src/services/api.js

FastAPI backend
  - Upload validation and API routing
  - Safety checks before model calls
  - Gemini wrapper for text, PDF, and image understanding
  - Rule-based fallback for offline or failed AI calls

Google Gemini
  - Structured report extraction
  - Prescription and medicine image reading
  - Context-aware chat responses
```

## Frontend

The frontend lives in `frontend/` and is a React 18 + Vite app. Routes are defined from `src/App.jsx`, shared state is managed by `src/context/AppContext.jsx`, and API calls are centralized in `src/services/api.js`.

State that belongs to the user session, such as medicines, reminders, symptoms, family contacts, and taken doses, is stored in browser `localStorage`. Report analysis, scan results, and chat responses come from the backend instead of demo data.

Main user areas:

| Area | Route or component | Responsibility |
| --- | --- | --- |
| Dashboard | `/app` | Snapshot of reports, medicines, reminders, and preparation |
| Reports | `/app/reports` | Upload reports, display lab values, compare previous and current values |
| Scanner | `/app/scanner` | Upload prescription or medicine images and review extracted medicines |
| Medicines | `/app/medicines` | Build and track medicine schedules |
| Symptoms | `/app/symptoms` | Body map and symptom notes |
| Timeline | `/app/timeline` | Longitudinal health events |
| Summary | `/app/summary` | Doctor-visit summary, print, save, and share |
| AI chat | floating dock | Ask questions using optional medicines and latest labs as context |

## Backend

The backend lives in `backend/` and exposes a small FastAPI API.

| Module | Responsibility |
| --- | --- |
| `app.main` | FastAPI app, CORS, upload size checks, MIME sniffing, API routes |
| `app.config` | Environment-driven settings |
| `app.gemini` | Thin async wrapper around `google-genai` |
| `app.analyze` | Report extraction, text-PDF fallback, lab normalization, previous-value comparison |
| `app.scan` | Prescription image extraction and dose-slot normalization |
| `app.chat` | Red-flag checks, Gemini chat, rule-based fallback |
| `app.safety` | Emergency detection, language detection, standard safety line |
| `app.labs_kb` | Known lab definitions, aliases, ranges, explanations |
| `app.schemas` | Pydantic request and response contracts |

## Data Flow

Report analysis:

```text
User uploads 1-5 report files
  -> frontend sends multipart files to POST /api/analyze
  -> backend checks size and file signature
  -> Gemini extracts structured labs when available
  -> text PDFs fall back to local parsing if Gemini is absent or fails
  -> backend normalizes lab names, ranges, explanations, and trends
  -> frontend renders lab cards and comparison views
```

Prescription scan:

```text
User uploads an image
  -> frontend sends multipart file to POST /api/scan
  -> backend validates image bytes
  -> Gemini vision extracts medicines, doses, food timing, and confidence
  -> backend derives slots from patterns such as 1-0-1
  -> frontend highlights uncertain entries for user review
```

Chat:

```text
User asks a question
  -> frontend sends question, language, medicines, and labs to POST /api/chat
  -> backend checks emergency phrases first
  -> Gemini answers with patient context when available
  -> rule fallback answers known lab and schedule questions if Gemini fails
  -> every non-emergency answer includes a non-diagnosis reminder
```

## Safety Model

Safety is handled before and after model calls.

Red-flag symptoms such as chest pain, trouble breathing, stroke signs, severe bleeding, poisoning, overdose, and self-harm language return a fixed emergency message and do not reach Gemini.

Prompts forbid diagnosis, disease-cause claims, prescribing, and dose changes. The backend appends a standard reminder that the response is not a diagnosis unless an equivalent line is already present.

## Privacy Model

The backend reads uploads in memory and does not persist files. The frontend keeps user-entered state in localStorage. There is no database in the current design.

## Failure Modes

| Failure | Behavior |
| --- | --- |
| Missing Gemini key | Rule-based chat and text-PDF parsing still work; image scanning returns `503` |
| Gemini timeout or bad output | Backend returns rule fallback where possible or a clear warning |
| Unsupported upload type | Backend returns `415` after content sniffing |
| Upload too large | Backend returns `413` |
| Backend unreachable | Frontend shows a connection error instead of fake data |

## Local Development

Backend:

```powershell
cd backend
.\start_backend.cmd
```

Optional reload mode:

```powershell
.\start_backend.cmd 8000 --reload
```

Manual stable runner:

```powershell
python run_backend.py --port 8000
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

Verification:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q

cd ..\frontend
npm run build
```
