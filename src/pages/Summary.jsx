import { useState } from "react";
import { Plus, Printer, Share2, X } from "lucide-react";
import { PageHeader } from "../components/ui.jsx";
import DoctorSummary, { summaryText } from "../components/DoctorSummary.jsx";
import PrepCountdown from "../components/PrepCountdown.jsx";
import { useApp } from "../context/AppContext.jsx";
import { suggestedQuestions } from "../data/constants.js";
import { toLocalInput } from "../data/helpers.js";

export default function Summary() {
  const { state, dispatch, notify } = useApp();
  const [q, setQ] = useState("");
  const suggestions = suggestedQuestions.filter((s) => !state.questions.includes(s));

  function addQ(text) {
    if (!text.trim()) return;
    dispatch({ type: "addQ", text });
    setQ("");
  }

  async function share() {
    const text = summaryText(state);
    dispatch({ type: "prep", key: "share", value: true });
    if (navigator.share) {
      try { await navigator.share({ title: "Doctor visit summary", text }); return; } catch (e) { if (e?.name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    notify("Pick a contact in WhatsApp to send it", "info");
  }

  return (
    <>
      <div className="no-print">
        <PageHeader title="Doctor summary" subtitle="One page for your visit: key results, medicines, symptoms and your questions.">
          <button className="btn" onClick={share}><Share2 size={16} /> Share</button>
          <button className="btn primary" onClick={() => window.print()}><Printer size={16} /> Print or save PDF</button>
        </PageHeader>
      </div>

      <div className="split summary-split">
        <div className="stack no-print">
          <PrepCountdown />

          <section className="card">
            <h2 className="h3">Appointment</h2>
            <div className="two">
              <label className="field"><span>Doctor</span><input value={state.appointment?.doctor ?? ""} onChange={(e) => dispatch({ type: "appt", patch: { doctor: e.target.value } })} /></label>
              <label className="field"><span>Date and time</span>
                <input type="datetime-local" value={state.appointment?.at ? toLocalInput(state.appointment.at) : ""} onChange={(e) => e.target.value && dispatch({ type: "appt", patch: { at: new Date(e.target.value).toISOString() } })} />
              </label>
            </div>
          </section>

          <section className="card">
            <h2 className="h3">Questions for the doctor</h2>
            <ul className="qlist">
              {state.questions.map((x, i) => (
                <li key={x}>
                  <span>{x}</span>
                  <button className="icon-btn" aria-label={`Remove question ${i + 1}`} onClick={() => dispatch({ type: "removeQ", index: i })}><X size={15} /></button>
                </li>
              ))}
            </ul>
            <form className="inline-add" onSubmit={(e) => { e.preventDefault(); addQ(q); }}>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Write your own question" aria-label="New question" />
              <button className="btn primary" disabled={!q.trim()}><Plus size={16} /> Add</button>
            </form>
            {suggestions.length > 0 && (
              <div className="chips">
                {suggestions.map((s) => <button key={s} className="chip" onClick={() => addQ(s)}><Plus size={13} /> {s}</button>)}
              </div>
            )}
          </section>
        </div>

        <DoctorSummary />
      </div>
    </>
  );
}
