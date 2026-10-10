import { Link } from "react-router-dom";
import { ArrowRight, FileText, PersonStanding, Plus, ScanLine } from "lucide-react";
import { Badge, Ring, Ruler, STATUS_TONE } from "../components/ui.jsx";
import PrepCountdown from "../components/PrepCountdown.jsx";
import MedicineSchedule from "../components/MedicineSchedule.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fmtDate, greeting, statusOf, trendOf, toTimeLabel } from "../data/helpers.js";

export default function Dashboard() {
  const { state, done, total, adherence, openChat } = useApp();
  const labValues = state.labs;
  const first = state.profile.name.trim().split(/\s+/)[0];
  const watch = labValues.filter((l) => statusOf(l.curr, l.refLow, l.refHigh) !== "normal");
  const improved = labValues.filter((l) => trendOf(l) === "improved").length;
  const upcoming = state.reminders
    .filter((r) => r.on && r.date && new Date(`${r.date}T${r.time}`) > new Date())
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    .slice(0, 3);

  return (
    <>
      <header className="greet">
        <div>
          <h1>{greeting()}{first ? `, ${first}` : ""}</h1>
          <p>{fmtDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}. {total - done > 0 ? `${total - done} ${total - done === 1 ? "dose" : "doses"} left today.` : "All of today's doses are done."}</p>
        </div>
        <div className="row gap wrap">
          <Link to="/app/scanner" className="btn"><ScanLine size={16} /> Scan medicine</Link>
          <Link to="/app/reports" className="btn primary"><Plus size={16} /> Add report</Link>
        </div>
      </header>

      <div className="dash">
        <div className="dash-main">
          <PrepCountdown compact />

          <section className="card">
            <div className="card-head">
              <div>
                <h2 className="h3">Results to watch</h2>
                <p className="muted small">{labValues.length ? (state.labMeta.prevDate ? `${improved} of ${labValues.length} values improved since ${fmtDate(state.labMeta.prevDate, { day: "numeric", month: "short" })}` : `${labValues.length} values read from your latest report`) : "Upload a report to see your results here."}</p>
              </div>
              <Link to="/app/reports" className="link">All results <ArrowRight size={15} /></Link>
            </div>
            {labValues.length > 0 && watch.length === 0 && <p className="muted small">Everything we could read is in range.</p>}
            <ul className="watch">
              {watch.map((l) => {
                const st = statusOf(l.curr, l.refLow, l.refHigh);
                return (
                  <li key={l.id}>
                    <div className="watch-name">
                      <b>{l.name}</b>
                      <small>{l.curr} {l.unit}</small>
                    </div>
                    <Ruler value={l.curr} prev={l.prev} min={l.min} max={l.max} low={l.refLow} high={l.refHigh} unit={l.unit} />
                    <Badge tone={STATUS_TONE[st]}>{st === "low" ? "Below" : "Above"}</Badge>
                  </li>
                );
              })}
            </ul>
            {labValues.length > 0 && <button className="link" onClick={() => openChat("Explain my results in simple words")}>Explain these in simple words</button>}
          </section>
        </div>

        <div className="dash-side">
          <section className="card">
            <div className="card-head">
              <h2 className="h3">Today's medicines</h2>
              <Ring value={adherence} size={58} stroke={7}><b className="small">{done}/{total}</b></Ring>
            </div>
            <MedicineSchedule compact />
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="h3">Coming up</h2>
              <Link to="/app/reminders" className="link">Reminders</Link>
            </div>
            {upcoming.length === 0 ? <p className="muted small">No dated reminders ahead.</p> : (
              <ul className="mini">
                {upcoming.map((r) => (
                  <li key={r.id}><b>{r.title}</b><small>{fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" })} · {toTimeLabel(r.time)}</small></li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h2 className="h3">Recent symptoms</h2>
              <Link to="/app/symptoms" className="link"><PersonStanding size={15} /> Log</Link>
            </div>
            {state.symptoms.length === 0 ? <p className="muted small">None logged.</p> : (
              <ul className="mini">
                {state.symptoms.slice(0, 3).map((s) => (
                  <li key={s.id}><b>{s.type}, {s.partLabel}</b><small>{s.intensity}/10 · {fmtDate(s.at, { day: "numeric", month: "short" })}</small></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
