import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, FileText, ScanLine, Pill, PersonStanding, History, BellRing, ClipboardList, Users, ShieldCheck, X,
} from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { initials } from "../data/helpers.js";

export const NAV_GROUPS = [
  { label: "Overview", items: [{ to: "/app", label: "Dashboard", icon: LayoutDashboard, end: true }] },
  {
    label: "Understand",
    items: [
      { to: "/app/reports", label: "Reports", icon: FileText },
      { to: "/app/scanner", label: "Medicine scanner", icon: ScanLine },
    ],
  },
  {
    label: "Track",
    items: [
      { to: "/app/medicines", label: "Medicine routine", icon: Pill },
      { to: "/app/symptoms", label: "Symptom map", icon: PersonStanding },
      { to: "/app/timeline", label: "Health timeline", icon: History },
      { to: "/app/reminders", label: "Reminders", icon: BellRing },
    ],
  },
  {
    label: "Prepare",
    items: [
      { to: "/app/summary", label: "Doctor summary", icon: ClipboardList },
      { to: "/app/family", label: "Family and caregivers", icon: Users },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  const { state, dispatch } = useApp();
  const name = state.profile.name;
  return (
    <>
      <div className={`scrim ${open ? "show" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
        <div className="brand">
          <img src="/logo.svg" alt="" width="30" height="30" />
          <span>CareLens</span>
          <button className="icon-btn close-nav" onClick={onClose} aria-label="Close menu"><X size={18} /></button>
        </div>

        <nav>
          {NAV_GROUPS.map((g) => (
            <div className="nav-group" key={g.label}>
              <div className="nav-label">{g.label}</div>
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="side-foot">
          <div className="safe-note">
            <ShieldCheck size={16} aria-hidden="true" />
            <p>CareLens helps you understand and prepare. It does not diagnose or replace your doctor.</p>
          </div>
          <div className="side-user">
            <span className="avatar">{initials(name)}</span>
            <div>
              <input
                className="name-input"
                aria-label="Your name"
                placeholder="Your name"
                value={name}
                maxLength={40}
                onChange={(e) => dispatch({ type: "profile", patch: { name: e.target.value } })}
              />
              <small>Patient</small>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
