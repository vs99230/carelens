import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Camera, Check, Loader2, TriangleAlert } from "lucide-react";
import { PageHeader, Badge } from "../components/ui.jsx";
import { scanPrescription } from "../services/api.js";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/helpers.js";

const OK = ["image/png", "image/jpeg", "image/webp"];
const THRESHOLD = 0.8;

export default function Scanner() {
  const { dispatch, notify } = useApp();
  const input = useRef(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  async function scan(file) {
    if (!OK.includes(file.type) || file.size > 10 * 1048576) {
      setError("Use a PNG, JPG or WebP photo under 10 MB.");
      return;
    }
    setError("");
    setAdded(false);
    setItems(null);
    setPreview(URL.createObjectURL(file));
    setBusy(true);
    try {
      const res = await scanPrescription(file);
      if (!res.items.length) setError("No medicines were found in this photo. Retake it in better light with the whole prescription in frame.");
      else setItems(res.items.map((x) => ({ ...x, id: uid(), verified: x.conf >= THRESHOLD })));
    } catch (e) {
      setError(e.message || "The scan didn't finish. Retake the photo in better light and try again.");
    } finally {
      setBusy(false);
    }
  }

  const edit = (id, patch) => setItems((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const unclear = items?.filter((x) => !x.verified) ?? [];
  const ready = items?.filter((x) => x.verified) ?? [];

  function addToRoutine() {
    dispatch({ type: "addMeds", meds: ready.map((x) => ({ name: x.name, dose: x.dose, slots: x.slots, food: x.food })) });
    setAdded(true);
    notify(`${ready.length} medicines added to your routine`);
  }

  return (
    <>
      <PageHeader title="Medicine scanner" subtitle="Photograph a prescription or medicine strip. CareLens reads the name, dose and timing." />

      <div className="split">
        <section className="card scan-card">
          <div className="preview">
            {preview ? <img src={preview} alt="Your uploaded prescription" /> : (
              <div className="preview-empty">
                <Camera size={30} strokeWidth={1.5} aria-hidden="true" />
                <p>Your photo appears here</p>
              </div>
            )}
            {busy && <div className="scanning" aria-live="polite"><Loader2 className="spin" size={20} /> Reading handwriting and print…</div>}
          </div>
          <div className="row gap">
            <button className="btn primary" disabled={busy} onClick={() => input.current?.click()}><Camera size={16} /> Take or choose photo</button>
            <input ref={input} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { if (e.target.files[0]) scan(e.target.files[0]); e.target.value = ""; }} />
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <p className="muted small">Tip: flat surface, good light, and the whole prescription in frame.</p>
        </section>

        <section className="card">
          <h2 className="h3">What CareLens read</h2>
          {!items && !busy && <p className="muted">Scan a photo to see each medicine with its dose and timing here.</p>}
          {items && (
            <>
              {unclear.length > 0 && (
                <p className="callout-inline"><TriangleAlert size={16} aria-hidden="true" /> {unclear.length} {unclear.length === 1 ? "line needs" : "lines need"} your check before it goes in your routine.</p>
              )}
              <ul className="extract">
                {items.map((x) => (
                  <li key={x.id} className={x.verified ? "" : "unclear"}>
                    <div className="extract-top">
                      <input aria-label="Medicine name" value={x.name} onChange={(e) => edit(x.id, { name: e.target.value })} />
                      {x.verified ? <Badge tone="ok">{x.conf >= THRESHOLD ? `${Math.round(x.conf * 100)}% sure` : "Checked by you"}</Badge> : <Badge tone="warn">Unclear, {Math.round(x.conf * 100)}%</Badge>}
                    </div>
                    <div className="extract-fields">
                      <input aria-label="Dose" value={x.dose} onChange={(e) => edit(x.id, { dose: e.target.value })} />
                      <input aria-label="Timing" value={x.food} onChange={(e) => edit(x.id, { food: e.target.value })} />
                    </div>
                    {!x.verified && (
                      <button className="btn sm" onClick={() => edit(x.id, { verified: true })}><Check size={14} /> This is correct</button>
                    )}
                  </li>
                ))}
              </ul>
              {added ? (
                <p className="callout-inline ok"><Check size={16} /> Added. <Link to="/app/medicines">See your routine</Link></p>
              ) : (
                <button className="btn primary block" disabled={!ready.length} onClick={addToRoutine}>
                  Add {ready.length} {ready.length === 1 ? "medicine" : "medicines"} to my routine
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
