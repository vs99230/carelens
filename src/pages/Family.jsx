import { useState } from "react";
import { Copy, MessageCircle, Plus, Trash2, UserRound } from "lucide-react";
import { PageHeader, Switch } from "../components/ui.jsx";
import { useApp } from "../context/AppContext.jsx";
import { summaryText } from "../components/DoctorSummary.jsx";
import { SLOTS } from "../data/constants.js";
import { dosesToday, toTimeLabel } from "../data/helpers.js";

function reminderText(state) {
  const today = dosesToday(state.meds);
  const lines = SLOTS.map((s) => {
    const names = today.filter((d) => d.slot === s.id).map((d) => `${d.med.name} ${d.med.dose}`);
    return names.length ? `${s.label} (${toTimeLabel(state.slotTimes[s.id])}): ${names.join(", ")}` : null;
  }).filter(Boolean);
  return `Medicine reminders for today — ${state.profile.name || "me"}\n${lines.join("\n")}`;
}

export default function Family() {
  const { state, dispatch, notify } = useApp();
  const [form, setForm] = useState({ name: "", relation: "" });

  async function share(kind, member) {
    const text = kind === "summary" ? summaryText(state) : reminderText(state);
    dispatch({ type: "prep", key: "share", value: true });
    // Prefer the native share sheet on phones; fall back to WhatsApp.
    if (navigator.share) {
      try { await navigator.share({ title: "CareLens", text }); return; } catch (err) { if (err?.name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    notify(`Choose ${member.name.split(" ")[0]} in WhatsApp to send`, "info");
  }

  async function copy(kind) {
    const text = kind === "summary" ? summaryText(state) : reminderText(state);
    try {
      await navigator.clipboard.writeText(text);
      notify("Copied to clipboard");
    } catch {
      notify("Couldn't copy. Select the text and copy it manually.", "bad");
    }
  }

  function add(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    dispatch({ type: "addMember", member: { name: form.name.trim(), relation: form.relation.trim() || "Family" } });
    setForm({ name: "", relation: "" });
    notify("Person added");
  }

  const people = state.members.filter((m) => m.id !== "me");

  return (
    <>
      <PageHeader title="Family and caregivers" subtitle="Choose who sees your doctor summary and medicine reminders. Nothing is shared until you send it." />

      <div className="split wide-left">
        <div className="stack">
          {people.length === 0 && <section className="card"><p className="muted">Add a family member to share with.</p></section>}
          {people.map((m) => (
            <section className="card person" key={m.id}>
              <div className="person-top">
                <span className="avatar lg"><UserRound size={20} aria-hidden="true" /></span>
                <div>
                  <h2 className="h3">{m.name}</h2>
                  <p className="muted small">{m.relation}</p>
                </div>
                <button className="icon-btn" aria-label={`Remove ${m.name}`} onClick={() => dispatch({ type: "removeMember", id: m.id })}><Trash2 size={16} /></button>
              </div>

              <ul className="perms">
                <li><div><b>Doctor summary</b><small>Report points, medicines, symptoms, questions</small></div><Switch label={`Share doctor summary with ${m.name}`} checked={m.share.summary} onChange={() => dispatch({ type: "memberShare", id: m.id, field: "summary" })} /></li>
                <li><div><b>Medicine reminders</b><small>Today's schedule by time of day</small></div><Switch label={`Share medicine reminders with ${m.name}`} checked={m.share.reminders} onChange={() => dispatch({ type: "memberShare", id: m.id, field: "reminders" })} /></li>
                <li><div><b>Tell them if I miss a dose</b><small>Needs the backend to send alerts</small></div><Switch label={`Missed dose alert for ${m.name}`} checked={m.missedAlert} onChange={() => dispatch({ type: "memberMissed", id: m.id })} /></li>
              </ul>

              <div className="row gap wrap">
                {m.share.summary && <button className="btn primary" onClick={() => share("summary", m)}><MessageCircle size={16} /> Send summary</button>}
                {m.share.reminders && <button className="btn" onClick={() => share("reminders", m)}><MessageCircle size={16} /> Send today's medicines</button>}
                {(m.share.summary || m.share.reminders) && <button className="btn ghost" onClick={() => copy(m.share.summary ? "summary" : "reminders")}><Copy size={16} /> Copy text</button>}
                {!m.share.summary && !m.share.reminders && <p className="muted small">Turn on a switch to share with {m.name.split(" ")[0]}.</p>}
              </div>
            </section>
          ))}
        </div>

        <form className="card" onSubmit={add}>
          <h2 className="h3">Add a person</h2>
          <label className="field"><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" /></label>
          <label className="field"><span>Relation</span><input value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} placeholder="Father, wife, friend…" /></label>
          <button className="btn primary block" disabled={!form.name.trim()}><Plus size={16} /> Add person</button>
          <p className="muted small">Sending opens WhatsApp or your phone's share sheet, so you pick the contact yourself.</p>
        </form>
      </div>
    </>
  );
}
