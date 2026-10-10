const BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");
const TIMEOUT_MS = 60000; // report analysis with Gemini can take a while

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.status = status;
  }
}

async function request(path, options = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { ...options, signal: ctrl.signal });
  } catch (e) {
    throw new ApiError(e.name === "AbortError" ? "The server took too long to answer." : "Can't reach the CareLens server. Is the backend running?");
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) {
    let detail = "";
    try {
      const body = await res.json();
      detail = typeof body.detail === "string" ? body.detail : "";
    } catch { /* non-JSON error body */ }
    throw new ApiError(detail || `Request failed (${res.status})`, res.status);
  }
  return res.json();
}

/** POST /api/analyze — multipart `files`. Returns { labs, lab, date, prev_date, warnings, ... }. */
export function analyzeReports(files) {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  return request("/api/analyze", { method: "POST", body: form });
}

/** POST /api/scan — one image. Returns { items: [{ name, dose, food, slots, conf }] }. */
export function scanPrescription(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/api/scan", { method: "POST", body: form });
}

/** POST /api/chat — sends the question plus the user's medicines and latest labs as context. */
export function askAI(question, { lang = "en", meds = [], labs = [] } = {}) {
  return request("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      lang,
      meds: meds.map(({ name, dose, slots, food }) => ({ name, dose: dose || "", slots, food: food || "" })),
      labs: labs.map(({ name, unit, curr, prev, refLow, refHigh }) => ({ name, unit, curr, prev, refLow, refHigh })),
    }),
  });
}
