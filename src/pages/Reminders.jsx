import { useMemo, useState } from "react";
import { BellRing, CalendarCheck, FlaskConical, Pill, Plus, Stethoscope, Trash2 } from "lucide-react";
import { PageHeader, Switch, Empty } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";
import { dateKey, fmtDate, toTimeLabel } from "../data/helpers.js";

const TYPES = {
  medicine: { label: "Medicine", icon: Pill },
  appointment: { label: "Appointment prep", icon: CalendarCheck },
  test: { label: "Follow-up test", icon: FlaskConical },
  visit: { label: "Doctor visit", icon: Stethoscope },
};

const whenText = (r) => `${r.repeat === "Daily" ? "Every day" : r.date ? fmtDate(r.date, { weekday: "short", day: "numeric", month: "short" }) : "Once"} · ${toTimeLabel(r.time)}`;

export default function Reminders() {
  const { state, dispatch, notify } = useApp();
  const [form, setForm] = useState({ title: "", type: "test", date: dateKey(), time: "09:00", repeat: "" });
  const [perm, setPerm] = useState(typeof Notification !== "undefined" ? Notification.permission : "unsupported");

  const sorted = useMemo(() => {
    const key = (r) => (r.repeat === "Daily" ? "0000" : r.date || "9999") + r.time;
    return [...state.reminders].sort((a, b) => key(a).localeCompare(key(b)));
  }, [state.reminders]);

  async function enable() {
    if (typeof Notification === "undefined") return notify("This browser can't show notifications.", "bad");
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      notify("Notifications are on");
      try { new Notification("CareLens", { body: "Reminders will appear like this." }); } catch { /* ignore */ }
    } else notify("Notifications are blocked. Allow them in your browser settings.", "bad");
  }

  function add(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    dispatch({ type: "addReminder", reminder: { title: form.title.trim(), type: form.type, time: form.time, repeat: form.repeat || null, date: form.repeat ? null : form.date } });
    notify("Reminder added");
    setForm({ ...form, title: "" });
  }

  return (
    <>
      <PageHeader title="Reminders" subtitle="Medicine, appointment, test and doctor-visit alerts." />

      <section className="card perm">
        <BellRing size={20} aria-hidden="true" />
        <div>
          <b>{perm === "granted" ? "Browser notifications are on" : "Get alerts outside this tab"}</b>
          <p className="muted small">Alerts show while CareLens is open. Phone push alerts arrive once the app is installed with the backend.</p>
        </div>
        {perm !== "granted" && <button className="btn primary" onClick={enable} disabled={perm === "unsupported"}>Turn on notifications</button>}
      </section>

      <div className="split wide-left">
        <section className="card flush">
          {sorted.length === 0 ? (
            <Empty icon={BellRing} title="No reminders yet">Add your first one on the right.</Empty>
          ) : (
            <ul className="rem">
              {sorted.map((r) => {
                const Icon = TYPES[r.type]?.icon || BellRing;
                return (
                  <li key={r.id} className={r.on ? "" : "off"}>
                    <span className={`rem-ico ${r.type}`}><Icon size={17} aria-hidden="true" /></span>
                    <div>
                      <b>{r.title}</b>
                      <small>{TYPES[r.type]?.label} · {whenText(r)}</small>
                    </div>
                    <Switch label={`${r.title} reminder`} checked={r.on} onChange={() => dispatch({ type: "toggleReminder", id: r.id })} />
                    <button className="icon-btn" aria-label={`Delete ${r.title}`} onClick={() => dispatch({ type: "removeReminder", id: r.id })}><Trash2 size={16} /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <form className="card" onSubmit={add}>
          <h2 className="h3">New reminder</h2>
          <label className="field"><span>What should we remind you about?</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Lipid profile test" />
          </label>
          <label className="field"><span>Type</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
          <label className="field"><span>Repeat</span>
            <select value={form.repeat} onChange={(e) => setForm({ ...form, repeat: e.target.value })}>
              <option value="">Once</option>
              <option value="Daily">Every day</option>
            </select>
          </label>
          <div className="two">
            {!form.repeat && <label className="field"><span>Date</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></label>}
            <label className="field"><span>Time</span><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></label>
          </div>
          <button className="btn primary block" disabled={!form.title.trim()}><Plus size={16} /> Add reminder</button>
        </form>
      </div>
    </>
  );
}
