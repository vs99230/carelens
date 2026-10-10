import { Link } from "react-router-dom";
import { Check, Pill, Sunrise, Sun, Moon } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { SLOTS } from "../data/constants.js";
import { toTimeLabel } from "../data/helpers.js";

const ICON = { morning: Sunrise, afternoon: Sun, night: Moon };

/** Today's doses grouped by time of day. `compact` is the dashboard version. */
export default function MedicineSchedule({ compact = false }) {
  const { state, dispatch, doses, takenToday, done, total } = useApp();

  if (!total) {
    return (
      <div className="empty">
        <Pill size={26} strokeWidth={1.6} aria-hidden="true" />
        <b>No medicines yet</b>
        <p>Add a prescription and CareLens builds your daily routine.</p>
        <Link className="btn primary" to="/app/medicines">Add medicines</Link>
      </div>
    );
  }

  return (
    <div className={`slots ${compact ? "compact" : ""}`}>
      {SLOTS.map((s) => {
        const list = doses.filter((d) => d.slot === s.id);
        if (compact && !list.length) return null;
        const Icon = ICON[s.id];
        const allDone = list.length > 0 && list.every((d) => takenToday[d.key]);
        return (
          <div className={`slot ${allDone ? "all" : ""}`} key={s.id}>
            <div className="slot-head">
              <Icon size={18} aria-hidden="true" />
              <b>{s.label}</b>
              <small>{toTimeLabel(state.slotTimes[s.id])}</small>
            </div>
            {list.length === 0 && <p className="muted small">Nothing scheduled</p>}
            {list.map(({ key, med }) => {
              const taken = !!takenToday[key];
              return (
                <button key={key} className={`dose ${taken ? "taken" : ""}`} aria-pressed={taken} onClick={() => dispatch({ type: "take", key })}>
                  <span className="tick">{taken && <Check size={14} strokeWidth={3} />}</span>
                  <span className="dose-text">
                    <b>{med.name}</b>
                    <small>{med.dose} · {med.food}</small>
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
      {!compact && <p className="muted small slots-foot">{done} of {total} doses taken today</p>}
    </div>
  );
}
