import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, CheckCircle2, BellRing, AlertCircle } from "lucide-react";
import Sidebar from "./Sidebar.jsx";
import ChatDock from "./ChatDock.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { state, dispatch, toast } = useApp();

  useEffect(() => {
    window.scrollTo(0, 0);
    setOpen(false);
  }, [pathname]);

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="stage">
        <div className="topbar">
          <button className="icon-btn menu-btn" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="spacer" />
          <div className="seg" role="group" aria-label="Explanation language">
            <button className={state.lang === "en" ? "on" : ""} onClick={() => dispatch({ type: "lang", lang: "en" })}>English</button>
            <button className={state.lang === "hi" ? "on" : ""} onClick={() => dispatch({ type: "lang", lang: "hi" })}>Hinglish</button>
          </div>
        </div>
        <main id="main" className="content">
          <Outlet />
          <p className="legal">CareLens explains health information and helps you prepare for visits. It never diagnoses or replaces treatment. In an emergency, call 112.</p>
        </main>
      </div>
      <ChatDock />
      {toast && (
        <div className={`toast ${toast.tone}`} role="status" key={toast.id}>
          {toast.tone === "info" ? <BellRing size={18} /> : toast.tone === "bad" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
