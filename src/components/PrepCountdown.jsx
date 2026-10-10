import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Check, ChevronRight, Stethoscope } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { fmtDate, fmtTime, timeLeft } from "../data/helpers.js";
import { Ring } from "./ui.jsx";

export function usePrep() {
  const { state } = useApp();
  const items = [
    { id: "report", label: "Upload your latest report", done: state.labs.length > 0, to: "/app/reports" },
    { id: "symptoms", label: "Log symptoms since the last visit", done: state.symptoms.length > 0, to: "/app/symptoms" },
    { id: "questions", label: "Write at least 3 questions", done: state.questions.length >= 3, to: "/app/summary" },
    { id: "meds", label: "Check your medicine list is current", done: state.prep.meds, to: "/app/medicines", manual: "meds" },
    { id: "share", label: "Share the summary with family", done: state.prep.share, to: "/app/family", manual: "share" },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length };
}

export default function PrepCountdown({ compact = false }) {
  const { state, dispatch } = useApp();
  const { items, done, total } = usePrep();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 30000); return () => clearInterval(id); }, []);

  const a = state.appointment;
  if (!a?.at) {
    return (
      <section className="card prep">
        <div className="prep-who">
          <span className="badge-ico"><Stethoscope size={18} aria-hidden="true" /></span>
          <div>
            <b>No appointment set</b>
            <small>Add the doctor and date to start your prep countdown.</small>
          </div>
        </div>
        <Link to="/app/summary" className="btn primary">Add appointment</Link>
      </section>
    );
  }
  const t = timeLeft(a.at);

  return (
    <section className="card prep">
      <div className="prep-top">
        <div className="prep-who">
          <span className="badge-ico"><Stethoscope size={18} aria-hidden="true" /></span>
          <div>
            <b>{a.doctor || "Doctor visit"}</b>
            <small>{[a.specialty, a.place].filter(Boolean).join(" · ")}</small>
          </div>
        </div>
        <div className="count" aria-live="polite" aria-label={t.past ? "Appointment has passed" : `${t.days} days ${t.hours} hours left`}>
          {t.past ? (
            <span className="past">Appointment time has passed</span>
          ) : (
            <>
              <div><b>{t.days}</b><small>days</small></div>
              <div><b>{t.hours}</b><small>hours</small></div>
              <div><b>{t.mins}</b><small>min</small></div>
            </>
          )}
        </div>
      </div>
      <p className="when"><CalendarClock size={15} aria-hidden="true" /> {fmtDate(a.at, { weekday: "long", day: "numeric", month: "long" })} at {fmtTime(a.at)}</p>

      <div className="prep-body">
        {!compact && (
          <Ring value={done / total} size={84}>
            <b>{done}/{total}</b>
          </Ring>
        )}
        <ul className="checklist">
          {items.map((i) => (
            <li key={i.id} className={i.done ? "done" : ""}>
              <button
                className="tick"
                aria-label={i.manual ? `Mark "${i.label}" ${i.done ? "not done" : "done"}` : i.label}
                aria-pressed={i.done}
                disabled={!i.manual}
                onClick={() => i.manual && dispatch({ type: "prep", key: i.manual, value: !i.done })}
              >
                {i.done && <Check size={13} strokeWidth={3} />}
              </button>
              <span>{i.label}</span>
              {!i.done && <Link to={i.to} className="go" aria-label={`Go: ${i.label}`}><ChevronRight size={16} /></Link>}
            </li>
          ))}
        </ul>
      </div>
      {compact && <p className="muted small">{done} of {total} ready</p>}
    </section>
  );
}
