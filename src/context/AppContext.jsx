import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { seed } from "../data/constants.js";
import { dateKey, dosesToday, pad, uid } from "../data/helpers.js";

const KEY = "carelens.v3";
const Ctx = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...seed(), ...JSON.parse(raw) };
  } catch { /* storage blocked or corrupt: start fresh */ }
  return seed();
}

function reducer(s, a) {
  switch (a.type) {
    case "lang":
      return { ...s, lang: a.lang };
    case "take": {
      const k = dateKey();
      const day = { ...(s.taken[k] || {}) };
      if (day[a.key]) delete day[a.key]; else day[a.key] = true;
      return { ...s, taken: { ...s.taken, [k]: day } };
    }
    case "slotTime":
      return { ...s, slotTimes: { ...s.slotTimes, [a.slot]: a.time } };
    case "slotReminder":
      return { ...s, slotReminders: { ...s.slotReminders, [a.slot]: !s.slotReminders[a.slot] } };
    case "addMeds": {
      const have = new Set(s.meds.map((m) => m.name.toLowerCase()));
      const fresh = a.meds.filter((m) => !have.has(m.name.toLowerCase())).map((m) => ({ id: uid(), ...m }));
      return { ...s, meds: [...s.meds, ...fresh], prep: { ...s.prep, meds: false } };
    }
    case "removeMed":
      return { ...s, meds: s.meds.filter((m) => m.id !== a.id) };
    case "addSymptom":
      return { ...s, symptoms: [{ id: uid(), at: new Date().toISOString(), ...a.symptom }, ...s.symptoms] };
    case "removeSymptom":
      return { ...s, symptoms: s.symptoms.filter((x) => x.id !== a.id) };
    case "addQ": {
      const q = a.text.trim();
      if (!q || s.questions.some((x) => x.toLowerCase() === q.toLowerCase())) return s;
      return { ...s, questions: [...s.questions, q] };
    }
    case "removeQ":
      return { ...s, questions: s.questions.filter((_, i) => i !== a.index) };
    case "toggleReminder":
      return { ...s, reminders: s.reminders.map((r) => (r.id === a.id ? { ...r, on: !r.on } : r)) };
    case "addReminder":
      return { ...s, reminders: [...s.reminders, { id: uid(), on: true, ...a.reminder }] };
    case "removeReminder":
      return { ...s, reminders: s.reminders.filter((r) => r.id !== a.id) };
    case "appt":
      return { ...s, appointment: { doctor: "", specialty: "", place: "", at: null, ...s.appointment, ...a.patch } };
    case "profile":
      return { ...s, profile: { ...s.profile, ...a.patch } };
    case "analysis": {
      // Backend result. If we already hold labs, the old reading becomes "previous" for matching tests.
      const { labs, date, lab, prev_date: prevDate } = a.result;
      if (!labs.length) return s;
      const old = new Map(s.labs.map((l) => [l.id, l]));
      const merged = labs.map((l) => {
        const o = old.get(l.id);
        if (l.prev != null || !o) return l;
        return { ...l, prev: o.curr, min: Math.min(l.min, o.curr), max: Math.max(l.max, o.curr) };
      });
      const hadPrev = merged.some((l) => l.prev != null);
      return { ...s, labs: merged, labMeta: { date: date || new Date().toISOString().slice(0, 10), lab: lab || "", prevDate: prevDate || (hadPrev ? s.labMeta.date : "") } };
    }
    case "prep":
      return { ...s, prep: { ...s.prep, [a.key]: a.value } };
    case "upload":
      return { ...s, uploads: [a.upload, ...s.uploads] };
    case "memberShare":
      return { ...s, members: s.members.map((m) => (m.id === a.id ? { ...m, share: { ...m.share, [a.field]: !m.share[a.field] } } : m)) };
    case "memberMissed":
      return { ...s, members: s.members.map((m) => (m.id === a.id ? { ...m, missedAlert: !m.missedAlert } : m)) };
    case "addMember":
      return { ...s, members: [...s.members, { id: uid(), share: { summary: true, reminders: true }, missedAlert: false, ...a.member }] };
    case "removeMember":
      return { ...s, members: s.members.filter((m) => m.id !== a.id) };
    case "reset":
      return seed();
    default:
      return s;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const [toast, setToast] = useState(null);
  const [chat, setChat] = useState({ open: false, nonce: 0, draft: "" });
  const toastTimer = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const notify = useCallback((message, tone = "ok") => {
    setToast({ message, tone, id: uid() });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3800);
  }, []);

  const openChat = useCallback((draft = "") => setChat((c) => ({ open: true, nonce: draft ? c.nonce + 1 : c.nonce, draft })), []);
  const closeChat = useCallback(() => setChat((c) => ({ ...c, open: false })), []);

  /* Reminder engine: fires while CareLens is open. */
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    let last = "";
    const tick = () => {
      const now = new Date();
      const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const stamp = `${dateKey(now)} ${hhmm}`;
      if (stamp === last) return;
      last = stamp;
      stateRef.current.reminders.forEach((r) => {
        if (!r.on || r.time !== hhmm) return;
        const due = r.repeat === "Daily" || r.date === dateKey(now);
        if (!due) return;
        notify(`Reminder: ${r.title}`, "info");
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification("CareLens", { body: r.title });
        } catch { /* ignore */ }
      });
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
  }, [notify]);

  const derived = useMemo(() => {
    const doses = dosesToday(state.meds);
    const takenToday = state.taken[dateKey()] || {};
    const done = doses.filter((d) => takenToday[d.key]).length;
    return { doses, takenToday, done, total: doses.length, adherence: doses.length ? done / doses.length : 0 };
  }, [state.meds, state.taken]);

  const value = useMemo(
    () => ({ state, dispatch, notify, toast, chat, openChat, closeChat, ...derived }),
    [state, notify, toast, chat, openChat, closeChat, derived]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
};
