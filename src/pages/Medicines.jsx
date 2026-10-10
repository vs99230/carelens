import { useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, Plus, ScanLine, Trash2, Wand2 } from "lucide-react";
import { PageHeader, Ring, Switch } from "../components/ui.jsx";
import MedicineSchedule from "../components/MedicineSchedule.jsx";
import { useApp } from "../context/AppContext.jsx";
import { SLOTS } from "../data/constants.js";
import { parseRx, toTimeLabel } from "../data/helpers.js";

const EXAMPLE = "Metformin 500mg 1-0-1 after food\nAtorvastatin 10mg 0-0-1 after dinner";

export default function Medicines() {
  const { state, dispatch, notify, done, total, adherence } = useApp();
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  function build() {
    const meds = parseRx(text);
    if (!meds.length) {
      setError("No medicines found. Write each on its own line, like: Metformin 500mg 1-0-1 after food");
      return;
    }
    setError("");
    dispatch({ type: "addMeds", meds });
    setText("");
    notify(`${meds.length} ${meds.length === 1 ? "medicine" : "medicines"} added to your routine`);
  }

  return (
    <>
      <PageHeader title="Medicine routine" subtitle="Your prescription becomes a morning, afternoon and night schedule with reminders.">
        <Link to="/app/scanner" className="btn"><ScanLine size={16} /> Scan prescription</Link>
      </PageHeader>

      <div className="split wide-right">
        <div className="stack">
          <section className="card">
            <h2 className="h3">Add from your prescription</h2>
            <p className="muted small">Write one medicine per line. The three numbers mean morning-afternoon-night, so 1-0-1 is morning and night.</p>
            <textarea rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={EXAMPLE} aria-label="Prescription text" />
            {error && <p className="form-error" role="alert">{error}</p>}
            <div className="row gap">
              <button className="btn primary" onClick={build} disabled={!text.trim()}><Wand2 size={16} /> Build routine</button>
              <button className="btn ghost" onClick={() => setText(EXAMPLE)}>Use example</button>
            </div>
          </section>

          <section className="card">
            <h2 className="h3">Prescription ({state.meds.length})</h2>
            <ul className="medlist">
              {state.meds.map((m) => (
                <li key={m.id}>
                  <div>
                    <b>{m.name}</b> <span className="muted">{m.dose}</span>
                    <small>{m.slots.map((s) => SLOTS.find((x) => x.id === s)?.label).join(" + ")} · {m.food}</small>
                  </div>
                  <button className="icon-btn" aria-label={`Remove ${m.name}`} onClick={() => dispatch({ type: "removeMed", id: m.id })}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="stack">
          <section className="card today">
            <div className="today-head">
              <div>
                <h2 className="h3">Today</h2>
                <p className="muted small">Tap a medicine when you've taken it.</p>
              </div>
              <Ring value={adherence} size={72} stroke={8}><b>{done}/{total}</b></Ring>
            </div>
            <MedicineSchedule />
          </section>

          <section className="card">
            <h2 className="h3"><BellRing size={16} aria-hidden="true" /> Reminder times</h2>
            <ul className="slot-times">
              {SLOTS.map((s) => (
                <li key={s.id}>
                  <div>
                    <b>{s.label}</b>
                    <small>{toTimeLabel(state.slotTimes[s.id])}</small>
                  </div>
                  <input type="time" aria-label={`${s.label} time`} value={state.slotTimes[s.id]} onChange={(e) => e.target.value && dispatch({ type: "slotTime", slot: s.id, time: e.target.value })} />
                  <Switch label={`${s.label} reminder`} checked={state.slotReminders[s.id]} onChange={() => dispatch({ type: "slotReminder", slot: s.id })} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
