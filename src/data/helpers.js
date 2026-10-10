export const initials = (name = "") => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
export const pad = (n) => String(n).padStart(2, "0");
export const uid = () => Math.random().toString(36).slice(2, 9);

export const dateKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

const DEFAULT_DATE = { day: "numeric", month: "short", year: "numeric" };
export const fmtDate = (d, opts = DEFAULT_DATE) => new Date(d).toLocaleDateString("en-IN", opts);
export const fmtTime = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const toTimeLabel = (hhmm = "08:00") => {
  const [h, m] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

export const timeLeft = (iso) => {
  const ms = new Date(iso).getTime() - Date.now();
  const a = Math.abs(ms);
  return { past: ms < 0, days: Math.floor(a / 864e5), hours: Math.floor((a % 864e5) / 36e5), mins: Math.floor((a % 36e5) / 6e4) };
};

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

/** Convert an ISO string to the value format of <input type="datetime-local"> */
export const toLocalInput = (iso) => {
  const d = new Date(iso);
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Lab status against a reference range. Either bound may be null. */
export const statusOf = (v, low, high) => {
  if (low != null && v < low) return "low";
  if (high != null && v > high) return "high";
  return "normal";
};

/** How far outside the reference range a value is (0 when inside), scaled by range width. */
export const deviation = (v, low, high, min, max) => {
  const w = (high ?? max) - (low ?? min) || 1;
  if (low != null && v < low) return (low - v) / w;
  if (high != null && v > high) return (v - high) / w;
  return 0;
};

/** improved | worse | stable | steady (both in range) | new (no previous reading) */
export const trendOf = (lab) => {
  if (lab.prev == null) return "new";
  const d0 = deviation(lab.prev, lab.refLow, lab.refHigh, lab.min, lab.max);
  const d1 = deviation(lab.curr, lab.refLow, lab.refHigh, lab.min, lab.max);
  if (d0 === 0 && d1 === 0) return "steady";
  const diff = d1 - d0;
  if (Math.abs(diff) < 0.03) return "stable";
  return diff < 0 ? "improved" : "worse";
};

export const SLOT_ORDER = ["morning", "afternoon", "night"];

/** Parse lines like "Metformin 500mg 1-0-1 after food" into medicine objects. */
export function parseRx(text) {
  const out = [];
  for (const raw of text.split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^(.*?)(\d+(?:[.,]\d+)?\s?(?:mg|mcg|g|iu|ml))\b\s*(\d)\s*-\s*(\d)\s*-\s*(\d)\s*(.*)$/i);
    if (!m) continue;
    const slots = [m[3], m[4], m[5]].map((n) => Number(n) > 0);
    const picked = SLOT_ORDER.filter((_, i) => slots[i]);
    const name = m[1].replace(/[-–,:]+$/, "").trim();
    if (!name || !picked.length) continue;
    out.push({ name, dose: m[2].replace(/\s+/g, " ").toUpperCase().replace("MG", " mg").replace(/\s+/g, " ").trim(), slots: picked, food: m[6].trim() || "As directed" });
  }
  return out;
}

export const dosesToday = (meds, day = new Date().getDay()) => {
  const out = [];
  meds.forEach((m) => {
    if (m.weekday != null && m.weekday !== day) return;
    m.slots.forEach((slot) => out.push({ key: `${m.id}:${slot}`, med: m, slot }));
  });
  return out;
};
