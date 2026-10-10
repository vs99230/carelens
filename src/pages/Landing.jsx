import { Link } from "react-router-dom";
import {
  FileText, TrendingUp, Pill, MessageCircle, PersonStanding, History, ClipboardList, CalendarClock, ScanLine, BellRing, Users, ShieldCheck,
} from "lucide-react";
import { Ruler } from "../components/ui.jsx";

const FEATURES = [
  { icon: FileText, title: "Report analysis", text: "PDF reports, lab results and prescriptions explained in simple language." },
  { icon: TrendingUp, title: "What changed since last time", text: "Old and new reports side by side, with what improved and what moved." },
  { icon: Pill, title: "Medicine routine builder", text: "A prescription becomes a morning, afternoon and night schedule." },
  { icon: MessageCircle, title: "Chat with voice", text: "Ask in English or Hinglish, by typing or speaking." },
  { icon: PersonStanding, title: "Symptom map", text: "Tap a body part and log pain, swelling or headache with how strong it is." },
  { icon: History, title: "Health timeline", text: "Reports, medicines, symptoms and visits in date order." },
  { icon: ClipboardList, title: "Doctor visit summary", text: "A one-page summary with results, medicines, symptoms and your questions." },
  { icon: CalendarClock, title: "Appointment countdown", text: "See what is left to prepare before you walk into the clinic." },
  { icon: ScanLine, title: "Prescription scanner", text: "Reads name, dose and timing from a photo, and flags unclear text for you to check." },
  { icon: BellRing, title: "Smart reminders", text: "Medicines, appointments, follow-up tests and doctor visits." },
  { icon: Users, title: "Family mode", text: "Send the summary and today's medicines to someone you trust." },
  { icon: ShieldCheck, title: "Safe by design", text: "CareLens explains and prepares. It never diagnoses or replaces treatment." },
];

export default function Landing() {
  return (
    <div className="land">
      <header className="land-nav">
        <Link to="/" className="brand-inline"><img src="/logo.svg" alt="" width="28" height="28" /> CareLens</Link>
        <Link to="/app" className="btn primary">Open dashboard</Link>
      </header>

      <section className="land-hero">
        <div className="hero-copy">
          <h1>Understand your health reports, then walk into the clinic ready.</h1>
          <p>
            Upload a report or photograph a prescription. CareLens explains every value in plain words, builds your medicine routine
            and prepares a one-page summary for your doctor, in English or Hinglish.
          </p>
          <div className="row gap wrap">
            <Link to="/app" className="btn primary lg">Open CareLens</Link>
            <Link to="/app/reports" className="btn lg">See a sample report</Link>
          </div>
          <p className="muted small">Not an AI doctor. An AI companion for understanding and preparing.</p>
        </div>

        <div className="hero-sample" aria-label="Sample result">
          <div className="sample-card">
            <div className="sample-head"><b>Hemoglobin</b><span className="badge warn">Below range</span></div>
            <div className="sample-val">12.8 <small>g/dL</small></div>
            <Ruler value={12.8} prev={11.2} min={8} max={18} low={13} high={17} unit="g/dL" />
            <p>Carries oxygen in your blood. Slightly under the 13–17 range, and up from 11.2 last time.</p>
          </div>
          <div className="sample-chat">
            <p className="q">Mera hemoglobin kaisa hai?</p>
            <p className="a">Thoda kam hai, lekin pichhli baar se behtar. Doctor se iron ke baare mein poochiye.</p>
          </div>
        </div>
      </section>

      <section className="land-features">
        <h2>Everything between the report and the doctor</h2>
        <ul>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
              <div><b>{title}</b><p>{text}</p></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="land-cta">
        <h2>Bring your reports. Leave with better questions.</h2>
        <Link to="/app" className="btn primary lg">Open CareLens</Link>
      </section>

      <footer className="land-foot">CareLens AI · Team DevSphare · Hackbase Hackathon. For information only, not medical advice.</footer>
    </div>
  );
}
