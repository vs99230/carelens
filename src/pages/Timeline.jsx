import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Pill, PersonStanding, Stethoscope, CalendarClock } from "lucide-react";
import { PageHeader, Empty } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fmtDate, fmtTime } from "../data/helpers.js";

const TYPES = {
  report: { label: "Reports", icon: FileText },
  medicine: { label: "Medicines", icon: Pill },
  symptom: { label: "Symptoms", icon: PersonStanding },
  visit: { label: "Doctor visits", icon: Stethoscope },
};

export default function Timeline() {
  const { state } = useApp();
  const [filter, setFilter] = useState("all");

  const events = useMemo(() => {
    const dynamic = [
      ...state.symptoms.map((s) => ({ id: s.id, type: "symptom", at: s.at, title: `${s.type}, ${s.partLabel}`, detail: `Intensity ${s.intensity}/10${s.note ? ` · ${s.note}` : ""}` })),
      ...state.uploads.map((u) => ({ id: u.id, type: "report", at: u.at, title: `Added ${u.name}`, detail: "Uploaded to CareLens" })),
    ];
    return [...dynamic].sort((a, b) => new Date(b.at) - new Date(a.at));
  }, [state.symptoms, state.uploads]);

  const counts = Object.fromEntries(Object.keys(TYPES).map((k) => [k, events.filter((e) => e.type === k).length]));
  const shown = filter === "all" ? events : events.filter((e) => e.type === filter);
  const groups = shown.reduce((acc, e) => {
    const k = fmtDate(e.at, { month: "long", year: "numeric" });
    (acc[k] ||= []).push(e);
    return acc;
  }, {});
  const upcoming = !!state.appointment?.at && new Date(state.appointment.at) > new Date();

  return (
    <>
      <PageHeader title="Health timeline" subtitle="Reports, medicines, symptoms and doctor visits in date order." />

      <div className="chips filters" role="group" aria-label="Filter timeline">
        <button className={`chip ${filter === "all" ? "on" : ""}`} aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All {events.length}</button>
        {Object.entries(TYPES).map(([k, v]) => (
          <button key={k} className={`chip ${filter === k ? "on" : ""}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>{v.label} {counts[k]}</button>
        ))}
      </div>

      {upcoming && (filter === "all" || filter === "visit") && (
        <Link to="/app/summary" className="upnext">
          <CalendarClock size={20} aria-hidden="true" />
          <div>
            <b>Coming up: {state.appointment.doctor}</b>
            <small>{fmtDate(state.appointment.at, { weekday: "long", day: "numeric", month: "long" })} at {fmtTime(state.appointment.at)}</small>
          </div>
          <span>Prepare</span>
        </Link>
      )}

      {shown.length === 0 ? (
        <Empty title="Nothing here yet">Events appear as you add reports, medicines and symptoms.</Empty>
      ) : (
        Object.entries(groups).map(([month, list]) => (
          <section className="tl-month" key={month}>
            <h2>{month}</h2>
            <ol className="tl">
              {list.map((e) => {
                const Icon = TYPES[e.type].icon;
                return (
                  <li key={e.id} className={`tl-${e.type}`}>
                    <span className="tl-ico"><Icon size={16} aria-hidden="true" /></span>
                    <div className="tl-body">
                      <time dateTime={e.at}>{fmtDate(e.at, { day: "numeric", month: "short" })}</time>
                      <b>{e.title}</b>
                      <p>{e.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </>
  );
}
