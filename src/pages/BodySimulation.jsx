import { useState } from "react";
import { Siren, Trash2 } from "lucide-react";
import { PageHeader, Empty } from "../components/ui.jsx";
import BodyMap, { intensityTone } from "../components/BodyMap.jsx";
import { useApp } from "../context/AppContext.jsx";
import { symptomTypes, zoneLabel } from "../data/constants.js";
import { fmtDate } from "../data/helpers.js";

const DURATIONS = ["Just now", "Today", "Few days", "More than a week"];
const WORD = { mild: "Mild", mod: "Moderate", sev: "Severe" };

export default function BodySimulation() {
  const { state, dispatch, notify } = useApp();
  const [part, setPart] = useState(null);
  const [type, setType] = useState("Pain");
  const [intensity, setIntensity] = useState(4);
  const [duration, setDuration] = useState("Today");
  const [note, setNote] = useState("");
  const tone = intensityTone(intensity);
  const redFlag = intensity >= 8 || (part === "chest" && ["Pain", "Dizziness", "Numbness"].includes(type));

  function save(e) {
    e.preventDefault();
    if (!part) return;
    dispatch({ type: "addSymptom", symptom: { part, partLabel: zoneLabel(part), type, intensity, duration, note: note.trim() } });
    notify(`${type} on ${zoneLabel(part).toLowerCase()} logged`);
    setNote("");
  }

  return (
    <>
      <PageHeader title="Symptom map" subtitle="Tap where it hurts, rate how strong it is, and CareLens adds it to your timeline and doctor summary." />

      <div className="split map-split">
        <section className="card map-card">
          <BodyMap selected={part} onSelect={setPart} logs={state.symptoms} />
          <p className="muted small center">{part ? <>Selected: <b>{zoneLabel(part)}</b></> : "Tap a body part"}</p>
          <p className="legend"><span className="lg mild" /> mild <span className="lg mod" /> moderate <span className="lg sev" /> severe · last 14 days</p>
        </section>

        <div className="stack">
          <form className="card" onSubmit={save}>
            <h2 className="h3">Log a symptom</h2>
            <fieldset>
              <legend>What does it feel like?</legend>
              <div className="chips">
                {symptomTypes.map((t) => (
                  <button type="button" key={t} className={`chip ${type === t ? "on" : ""}`} aria-pressed={type === t} onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </fieldset>

            <label className="field">
              <span>Intensity <b className={`tone ${tone}`}>{intensity}/10 · {WORD[tone]}</b></span>
              <input type="range" min="1" max="10" value={intensity} onChange={(e) => setIntensity(+e.target.value)} className={`slider ${tone}`} />
            </label>

            <label className="field">
              <span>How long has it been going on?</span>
              <select value={duration} onChange={(e) => setDuration(e.target.value)}>
                {DURATIONS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </label>

            <label className="field">
              <span>Anything else? <small>optional</small></span>
              <input value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} placeholder="When it started, what makes it worse" />
            </label>

            {redFlag && (
              <p className="notice bad" role="alert"><Siren size={16} aria-hidden="true" /> Severe pain, or chest symptoms, should not wait for your appointment. Call 112 or go to an emergency room.</p>
            )}
            <button className="btn primary block" disabled={!part}>{part ? `Log ${type.toLowerCase()} on ${zoneLabel(part).toLowerCase()}` : "Select a body part first"}</button>
          </form>

          <section className="card">
            <h2 className="h3">Logged symptoms</h2>
            {state.symptoms.length === 0 ? (
              <Empty title="Nothing logged yet">Tap a body part and log your first symptom.</Empty>
            ) : (
              <ul className="loglist">
                {state.symptoms.map((s) => (
                  <li key={s.id}>
                    <span className={`pip ${intensityTone(s.intensity)}`}>{s.intensity}</span>
                    <div>
                      <b>{s.type}, {s.partLabel}</b>
                      <small>{fmtDate(s.at, { day: "numeric", month: "short" })} · {s.duration}{s.note ? ` · ${s.note}` : ""}</small>
                    </div>
                    <button className="icon-btn" aria-label={`Delete ${s.type} on ${s.partLabel}`} onClick={() => dispatch({ type: "removeSymptom", id: s.id })}><Trash2 size={16} /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
