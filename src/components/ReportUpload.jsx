import { useRef, useState } from "react";
import { UploadCloud, Check, Loader2 } from "lucide-react";
import { analyzeReports } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/helpers.js";

const MAX_MB = 10;
const OK = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
const STEPS = ["Reading the document", "Pulling out values and units", "Writing a simple explanation"];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function ReportUpload({ onDone }) {
  const { dispatch, notify } = useApp();
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [stage, setStage] = useState(-1);
  const [error, setError] = useState("");
  const busy = stage >= 0 && stage < STEPS.length;

  async function run(list) {
    const files = Array.from(list);
    if (!files.length) return;
    const bad = files.find((f) => !OK.includes(f.type) || f.size > MAX_MB * 1048576);
    if (bad) {
      setError(`${bad.name} can't be read. Use a PDF, PNG or JPG under ${MAX_MB} MB.`);
      return;
    }
    setError("");
    const ticker = (async () => {
      for (let i = 0; i < STEPS.length; i++) { setStage(i); await sleep(800); }
    })();
    try {
      const [res] = await Promise.all([analyzeReports(files), ticker]);
      if (!res.labs.length) {
        setStage(-1);
        setError(res.warnings?.[0] || "No lab values could be read from this file. Try a clearer scan or a text PDF.");
        return;
      }
      files.forEach((f) => dispatch({ type: "upload", upload: { id: uid(), name: f.name, size: f.size, at: new Date().toISOString() } }));
      dispatch({ type: "analysis", result: res });
      setStage(STEPS.length);
      notify(`Report analyzed: ${res.labs.length} values read`);
      setTimeout(() => { setStage(-1); onDone?.(); }, 700);
    } catch (e) {
      setStage(-1);
      setError(e.message || "The analysis didn't finish. Check your connection and try again.");
    }
  }

  return (
    <section className="card upload">
      {stage < 0 ? (
        <div
          className={`drop ${over ? "over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); run(e.dataTransfer.files); }}
        >
          <UploadCloud size={30} strokeWidth={1.5} aria-hidden="true" />
          <h3>Drop a report or prescription here</h3>
          <p>PDF, PNG or JPG, up to {MAX_MB} MB</p>
          <button className="btn primary" onClick={() => input.current?.click()}>Choose files</button>
          <input ref={input} type="file" hidden multiple accept=".pdf,image/*" onChange={(e) => { run(e.target.files); e.target.value = ""; }} />
        </div>
      ) : (
        <ol className="steps" aria-live="polite">
          {STEPS.map((s, i) => (
            <li key={s} className={i < stage || stage === STEPS.length ? "done" : i === stage ? "now" : ""}>
              <span>{i < stage || stage === STEPS.length ? <Check size={14} /> : i === stage ? <Loader2 size={14} className="spin" /> : null}</span>
              {s}
            </li>
          ))}
        </ol>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      {busy && <p className="muted small">This usually takes a few seconds.</p>}
    </section>
  );
}
