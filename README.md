# 🩺 CareLens AI — Your AI-Powered Healthcare Companion

**Understand your health. Track your progress. Make informed decisions.**

CareLens AI is an AI-powered healthcare companion designed to help users understand medical reports, compare health parameters over time, organize medicine schedules, track symptoms, and prepare for doctor consultations.

Powered by Google's Gemini AI, CareLens transforms complex medical information into simple, understandable insights, with support for English and Hinglish.

> **Our mission:** Make healthcare information easier to understand and help people become more informed participants in their healthcare journey.

---

## 🚨 The Problem

Medical reports often contain complicated terminology, laboratory values, and reference ranges that are difficult for ordinary users to understand.

Patients may struggle to:

* Understand medical reports without searching multiple websites.
* Compare previous and current reports to track changes.
* Remember medicine schedules and dosage instructions.
* Organize symptoms and health information.
* Prepare relevant information before visiting a doctor.

## 💡 Our Solution

CareLens AI provides a centralized platform that helps users understand their medical reports and organize their health information.

Instead of simply explaining individual values, CareLens helps users compare reports, monitor changes, organize medicine routines, and prepare a health summary for doctor consultations.

**CareLens supports healthcare awareness and organization; it does not replace professional medical advice.**

---

## ✨ Key Features

### 📄 1. AI Medical Report Analysis

* Upload medical reports in PDF or image format.
* Extract recognizable test names, values, units, and reference ranges.
* Explain medical terminology in simple language.
* Highlight values that may be outside the provided reference range.

### 📊 2. Before-and-After Report Comparison

* Compare previous and recent medical reports.
* Identify changes in matching test values.
* Present health parameters in a structured format.
* Help users prepare questions for their doctor.

### 💬 3. AI Health Assistant

* Ask questions about medical reports and general health information.
* Receive explanations in English or Hinglish.
* Use relevant report and medicine context when available.
* Get safety-oriented responses for recognized emergency warning signs.

### 💊 4. Prescription & Medicine Scanner

* Scan prescription or medicine images.
* Extract recognizable medicine names and written instructions.
* Organize extracted information into a readable format.
* Allow users to verify unclear details against the original prescription.

### ⏰ 5. Medicine Routine Organizer

* Organize medicine schedules into morning, afternoon, and night.
* Display medicine names and recorded instructions.
* Set reminders where supported by the browser.

### 🩻 6. Symptom Tracking

* Record symptoms using the available body-map interface.
* Maintain an organized view of recorded symptoms.
* Help users prepare relevant information for medical consultations.

### 📋 7. Doctor Visit Summary

* Organize relevant health information into a concise summary.
* Review important report findings and recorded symptoms.
* Print or save the summary as a PDF for discussion with a healthcare professional.

### 🌐 8. English & Hinglish Support

* Make healthcare information easier to understand.
* Improve accessibility for users who prefer Hindi written in Roman script.

---

## 🧠 What Makes CareLens Different?

General-purpose AI assistants can answer health-related questions. CareLens focuses on organizing healthcare tasks into a dedicated workflow.

| Capability                             | General-purpose AI                    | CareLens AI                   |
| -------------------------------------- | ------------------------------------- | ----------------------------- |
| General health questions               | ✅                                     | ✅                             |
| Medical report explanation             | ✅                                     | ✅                             |
| Previous vs. current report comparison | Requires suitable input and prompting | Dedicated comparison workflow |
| Medicine schedule organization         | Requires suitable prompting           | Dedicated routine interface   |
| Symptom organization                   | General conversation                  | Structured symptom tracking   |
| Doctor visit summary                   | Requires suitable prompting           | Dedicated summary workflow    |
| Healthcare-focused interface           | ❌ Not its primary purpose             | ✅                             |
| English and Hinglish support           | Depends on the model                  | Designed to support both      |

**Our approach:** Combine AI-generated explanations with healthcare-specific workflows so users can analyze, compare, and organize information in one place.

---

## ⚙️ Technology Stack

| Component            | Technology         |
| -------------------- | ------------------ |
| Frontend             | React 18           |
| Frontend Tooling     | Vite               |
| Navigation           | React Router       |
| Icons                | Lucide React       |
| Backend              | Python, FastAPI    |
| AI Integration       | Google Gemini API  |
| Data Validation      | Pydantic           |
| PDF Text Extraction  | pypdf              |
| Browser-Side Storage | LocalStorage       |
| API Documentation    | FastAPI Swagger UI |

---

## 🏗️ Project Architecture

```text
CareLens AI
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── index.html
│   └── package.json
│
└── backend/
    ├── app/
    │   ├── main.py
    │   ├── analyze.py
    │   ├── chat.py
    │   ├── scan.py
    │   ├── gemini.py
    │   ├── labs_kb.py
    │   ├── safety.py
    │   ├── schemas.py
    │   └── config.py
    ├── tests/
    ├── .env.example
    └── requirements.txt
```

### Backend Responsibilities

* `main.py` — FastAPI application and API routes.
* `analyze.py` — Medical report analysis and comparison.
* `chat.py` — AI health chat and fallback responses.
* `scan.py` — Prescription and medicine image scanning.
* `gemini.py` — Gemini AI integration.
* `labs_kb.py` — Laboratory test knowledge and explanations.
* `safety.py` — Emergency phrase checks and safety helpers.
* `schemas.py` — API request and response validation.
* `config.py` — Environment-based configuration.

---

## 🔄 How CareLens Works

1. **Upload:** The user uploads a medical report or prescription image, or enters a health-related question.
2. **Validation:** The FastAPI backend validates the supported file type and upload size.
3. **AI Processing:** Gemini processes the relevant document, image, or question when configured.
4. **Extraction:** The backend extracts recognizable medical information and structures the result.
5. **Comparison:** When previous and recent reports are supplied, matching health parameters can be compared.
6. **Presentation:** The React frontend displays report explanations, comparisons, medicine information, or AI responses.
7. **Organization:** Users can organize health information through the available tracking and summary features.

---

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

* Python 3.10 or newer
* Node.js and npm
* A Google Gemini API key

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd carelens-connected
```

Replace `<your-repository-url>` with your actual GitHub repository URL.

### 2. Start the Backend

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment.

**Windows PowerShell:**

```powershell
.\.venv\Scripts\Activate.ps1
```

**macOS/Linux:**

```bash
source .venv/bin/activate
```

Install the dependencies:

```bash
python -m pip install -r requirements.txt
```

Create your environment file.

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Add your Gemini API key to `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_UPLOAD_MB=10
```

Use a Gemini model available to your API account and supported by your installed SDK.

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend should now be available at:

* **API:** `http://localhost:8000`
* **API Documentation:** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/health`

### 3. Start the Frontend

Open a second terminal in the project root:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed by Vite, usually:

`http://localhost:5173`

### 4. Build for Production

From the `frontend` directory:

```bash
npm run build
```

Vite generates the production build in:

```text
frontend/dist/
```

---

## 🔌 API Endpoints

| Method | Endpoint       | Description                                   |
| ------ | -------------- | --------------------------------------------- |
| GET    | `/health`      | Check backend health and Gemini configuration |
| GET    | `/api/health`  | Health-check alias                            |
| POST   | `/api/analyze` | Analyze medical report files                  |
| POST   | `/api/scan`    | Scan prescription or medicine images          |
| POST   | `/api/chat`    | Ask a health-related question                 |

### Example Chat Request

```json
{
  "question": "What does my hemoglobin value mean?",
  "lang": "en",
  "meds": [],
  "labs": []
}
```

The `lang` field supports `en` or `hi`. Medicine and laboratory context can be supplied through the corresponding fields.

### Supported File Types

**Medical report analysis:**

* PDF
* PNG
* JPEG
* WebP

**Prescription scanning:**

* PNG
* JPEG
* WebP

Report analysis supports 1–5 files per request. The default upload limit is 10 MB per file.

Actual extraction quality depends on document readability and the availability of the configured AI service.

---

## 🔐 Privacy & Security

CareLens is designed with a local-first approach for several frontend features.

* Health entries such as symptoms and reminders may be stored in browser LocalStorage.
* The backend processes uploaded report content for the request rather than intentionally saving uploaded files as permanent medical records.
* AI features send relevant user-provided content to the configured Gemini service for processing.
* API keys must be stored in environment variables and must never be committed to the repository.
* Real patient reports and personal medical information should not be included in public repositories or demonstration screenshots.
* Production deployment requires appropriate HTTPS, CORS restrictions, access controls, privacy notices, and data-retention policies.

**Important:** Browser LocalStorage is not a secure medical-record database. Review the implementation and the third-party AI provider's applicable privacy terms before processing real patient information.

---

## 🧪 Testing

From the `backend` directory, activate your virtual environment and run:

```bash
pytest -q
```

Ensure that the required dependencies and test configuration are installed before running the tests.

---

## ⚠️ Medical Disclaimer

CareLens AI is an informational and organizational tool. It is not a substitute for a qualified doctor, pharmacist, or other healthcare professional.

* AI-generated explanations may contain errors.
* Laboratory reference ranges can vary between laboratories.
* Prescription handwriting and medicine details can be misread.
* Always verify extracted information against the original document.
* Never start, stop, or change medication based solely on an AI-generated response.
* Seek professional medical advice for diagnosis and treatment.
* In a medical emergency in India, contact emergency services at **112**.

---

## 🚧 Current Limitations

* AI features depend on Gemini API availability and configuration.
* Scanned documents may require AI vision processing.
* The fallback report parser supports only a limited range of recognizable tests.
* Medicine reminders may depend on browser permissions and whether the app is open.
* Browser-local storage does not automatically provide cloud synchronization or multi-device access.
* CareLens does not independently verify medical diagnoses or guarantee clinical accuracy.

---

## 🔮 Future Enhancements

* Secure database integration for persistent health records.
* Optional user accounts and authenticated access.
* Secure cloud synchronization across devices.
* Improved medical report extraction and trend visualization.
* More comprehensive multilingual support.
* Configurable notification and reminder services.
* Enhanced privacy controls and audit logging.
* Integration with authorized healthcare systems where appropriate.

---

## 👥 Team

**Team DevSphare**
Project: CareLens AI
Event: Hackbase Hackathon

---

## 📄 License

No license has been specified yet. Add a `LICENSE` file before distributing or reusing the project publicly.

---

### ❤️ Built to Make Healthcare Information Easier to Understand

**CareLens AI — Understand Better. Track Smarter. Stay Informed.**
