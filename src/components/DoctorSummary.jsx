import { useApp } from "../context/AppContext.jsx";
import { SLOTS } from "../data/constants.js";
import { fmtDate, fmtTime, statusOf, trendOf } from "../data/helpers.js";
import { STATUS_LABEL } from "./ui.jsx";

const TREND_TEXT = { new: "first reading", improved: "improving", worse: "moving away from range", stable: "about the same", steady: "steady" };

/** Plain-text version used for sharing. */
export function summaryText(state) {
  const a = state.appointment;
  const attention = state.labs.filter((l) => statusOf(l.curr, l.refLow, l.refHigh) !== "normal");
  const lines = [
    `CareLens doctor visit summary${state.profile.name ? ` — ${state.profile.name}` : ""}`,
    ...(a?.at ? [`Visit: ${a.doctor || "Doctor"}, ${fmtDate(a.at)} ${fmtTime(a.at)}`] : []),
    "",
    "Report points:",
    ...attention.map((l) => `- ${l.name}: ${l.curr} ${l.unit} (${STATUS_LABEL[statusOf(l.curr, l.refLow, l.refHigh)].toLowerCase()}, ${TREND_TEXT[trendOf(l)]})`),
    "",
    "Medicines:",
    ...state.meds.map((m) => `- ${m.name} ${m.dose} (${m.slots.join(", ")})`),
    "",
    "Symptoms:",
    ...(state.symptoms.length ? state.symptoms.slice(0, 6).map((s) => `- ${s.type}, ${s.partLabel}, ${s.intensity}/10`) : ["- None logged"]),
    "",
    "Questions for the doctor:",
    ...state.questions.map((q, i) => `${i + 1}. ${q}`),
  ];
  return lines.join("\n");
}

/** One-page summary. Styled as a sheet so print / save-as-PDF looks right. */
export default function DoctorSummary() {
  const { state } = useApp();
  const a = state.appointment;
  const labValues = state.labs;
  const attention = labValues.filter((l) => statusOf(l.curr, l.refLow, l.refHigh) !== "normal");
  const normal = labValues.length - attention.length;
  const symptoms = state.symptoms.filter((s) => Date.now() - new Date(s.at).getTime() < 60 * 864e5);

  return (
    <article className="paper" aria-label="Doctor visit summary">
      <header>
        <div>
          <h2>Doctor visit summary</h2>
          <p>{state.profile.name}</p>
        </div>
        <div className="paper-meta">
          {a?.at && (<>
            <b>{a.doctor}</b>
            <span>{fmtDate(a.at, { day: "numeric", month: "short", year: "numeric" })}, {fmtTime(a.at)}</span>
          </>)}
          <span>Prepared {fmtDate(new Date())}</span>
        </div>
      </header>

      <section>
        <h3>Report points <small>{normal} of {labValues.length} values in range</small></h3>
        <table>
          <thead><tr><th>Test</th><th>Latest</th><th>Previous</th><th>Reference</th><th>Status</th></tr></thead>
          <tbody>
            {labValues.length === 0 && <tr><td colSpan="5" className="muted">No report added yet.</td></tr>}
            {attention.map((l) => (
              <tr key={l.id}>
                <td>{l.name}</td>
                <td><b>{l.curr}</b> {l.unit}</td>
                <td>{l.prev ?? "—"}</td>
                <td>{l.refLow ?? "up to"}{l.refLow != null && l.refHigh != null ? "–" : " "}{l.refHigh ?? ""}</td>
                <td>{STATUS_LABEL[statusOf(l.curr, l.refLow, l.refHigh)]}, {TREND_TEXT[trendOf(l)]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="paper-cols">
        <section>
          <h3>Current medicines</h3>
          <ul>
            {state.meds.map((m) => (
              <li key={m.id}><b>{m.name}</b> {m.dose}<span>{m.slots.map((s) => SLOTS.find((x) => x.id === s)?.label).join(" + ")}</span></li>
            ))}
          </ul>
        </section>
        <section>
          <h3>Symptoms (last 60 days)</h3>
          {symptoms.length ? (
            <ul>
              {symptoms.map((s) => (
                <li key={s.id}><b>{s.type}</b>, {s.partLabel}<span>{s.intensity}/10 · {fmtDate(s.at, { day: "numeric", month: "short" })}</span></li>
              ))}
            </ul>
          ) : <p className="muted small">None logged.</p>}
        </section>
      </div>

      <section>
        <h3>Questions to ask</h3>
        {state.questions.length ? (
          <ol>{state.questions.map((q) => <li key={q}>{q}</li>)}</ol>
        ) : <p className="muted small">Add questions on the left and they appear here.</p>}
      </section>

      <footer>Prepared with CareLens to help the conversation with your doctor. It is not a diagnosis.</footer>
    </article>
  );
}
