export const SLOTS = [
  { id: "morning", label: "Morning", hint: "Wake-up to breakfast" },
  { id: "afternoon", label: "Afternoon", hint: "Around lunch" },
  { id: "night", label: "Night", hint: "Dinner to bedtime" },
];

export const symptomTypes = ["Pain", "Swelling", "Headache", "Dizziness", "Numbness", "Burning", "Stiffness", "Fatigue", "Nausea", "Itching"];

/* Body zones for the symptom map. viewBox 0 0 240 520. cx,cy = marker position. */
export const zones = [
  { id: "head", label: "Head", cx: 120, cy: 46, shapes: [["ellipse", { cx: 120, cy: 46, rx: 27, ry: 31 }]] },
  { id: "neck", label: "Neck", cx: 120, cy: 87, shapes: [["rect", { x: 108, y: 78, width: 24, height: 18, rx: 8 }]] },
  { id: "chest", label: "Chest", cx: 120, cy: 131, shapes: [["rect", { x: 78, y: 98, width: 84, height: 66, rx: 20 }]] },
  { id: "abdomen", label: "Abdomen", cx: 120, cy: 198, shapes: [["rect", { x: 84, y: 168, width: 72, height: 60, rx: 18 }]] },
  { id: "hips", label: "Hips", cx: 120, cy: 249, shapes: [["rect", { x: 82, y: 232, width: 76, height: 34, rx: 16 }]] },
  { id: "r_arm", label: "Right arm", cx: 56, cy: 185, shapes: [["rect", { x: 46, y: 100, width: 26, height: 80, rx: 13 }], ["rect", { x: 40, y: 184, width: 24, height: 84, rx: 12 }]] },
  { id: "l_arm", label: "Left arm", cx: 184, cy: 185, shapes: [["rect", { x: 168, y: 100, width: 26, height: 80, rx: 13 }], ["rect", { x: 176, y: 184, width: 24, height: 84, rx: 12 }]] },
  { id: "r_leg", label: "Right thigh", cx: 101, cy: 323, shapes: [["rect", { x: 84, y: 270, width: 34, height: 106, rx: 16 }]] },
  { id: "l_leg", label: "Left thigh", cx: 139, cy: 323, shapes: [["rect", { x: 122, y: 270, width: 34, height: 106, rx: 16 }]] },
  { id: "r_knee", label: "Right knee", cx: 101, cy: 386, shapes: [["ellipse", { cx: 101, cy: 386, rx: 15, ry: 12 }]] },
  { id: "l_knee", label: "Left knee", cx: 139, cy: 386, shapes: [["ellipse", { cx: 139, cy: 386, rx: 15, ry: 12 }]] },
  { id: "r_shin", label: "Right lower leg", cx: 101, cy: 442, shapes: [["rect", { x: 86, y: 402, width: 30, height: 82, rx: 14 }]] },
  { id: "l_shin", label: "Left lower leg", cx: 139, cy: 442, shapes: [["rect", { x: 124, y: 402, width: 30, height: 82, rx: 14 }]] },
  { id: "r_foot", label: "Right foot", cx: 100, cy: 498, shapes: [["rect", { x: 80, y: 488, width: 40, height: 18, rx: 9 }]] },
  { id: "l_foot", label: "Left foot", cx: 140, cy: 498, shapes: [["rect", { x: 120, y: 488, width: 40, height: 18, rx: 9 }]] },
];

export const zoneLabel = (id) => zones.find((z) => z.id === id)?.label ?? id;

export const suggestedQuestions = [
  "What do my results mean for my daily routine?",
  "Do I need any new tests before the next visit?",
  "Are my current medicines still the right ones?",
  "Which symptoms should make me call you sooner?",
];

/* Fresh, empty state. Real data comes from the backend (reports, scans) and from the user. */
export function seed() {
  return {
    lang: "en",
    profile: { name: "" },
    appointment: null,
    meds: [],
    slotTimes: { morning: "08:00", afternoon: "14:00", night: "21:00" },
    slotReminders: { morning: true, afternoon: true, night: true },
    taken: {},
    symptoms: [],
    questions: [],
    uploads: [],
    labs: [],
    labMeta: { date: "", lab: "", prevDate: "" },
    prep: { meds: false, share: false },
    reminders: [
      { id: "r-morning", title: "Morning medicines", type: "medicine", time: "08:00", repeat: "Daily", date: null, on: true },
      { id: "r-afternoon", title: "Afternoon medicines", type: "medicine", time: "14:00", repeat: "Daily", date: null, on: true },
      { id: "r-night", title: "Night medicines", type: "medicine", time: "21:00", repeat: "Daily", date: null, on: true },
    ],
    members: [{ id: "me", name: "You", relation: "You", share: { summary: true, reminders: true }, missedAlert: false }],
  };
}
