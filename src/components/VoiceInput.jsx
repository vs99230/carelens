import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";

/** Speech-to-text. Hinglish mode listens in Hindi (hi-IN), which also picks up English words. */
export default function VoiceInput({ onText, onInterim }) {
  const { state, notify } = useApp();
  const [live, setLive] = useState(false);
  const recRef = useRef(null);
  const Speech = typeof window !== "undefined" ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

  useEffect(() => () => recRef.current?.abort?.(), []);

  function toggle() {
    if (!Speech) {
      notify("Voice input needs Chrome or Edge. You can type your question instead.", "bad");
      return;
    }
    if (live) {
      recRef.current?.stop();
      return;
    }
    const rec = new Speech();
    rec.lang = state.lang === "hi" ? "hi-IN" : "en-IN";
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      if (e.results[e.results.length - 1].isFinal) onText(text.trim());
      else onInterim?.(text);
    };
    rec.onerror = (e) => {
      setLive(false);
      if (e.error === "not-allowed") notify("Microphone access is blocked. Allow it in your browser settings.", "bad");
    };
    rec.onend = () => setLive(false);
    recRef.current = rec;
    try {
      rec.start();
      setLive(true);
    } catch {
      setLive(false);
    }
  }

  return (
    <button type="button" className={`mic ${live ? "live" : ""}`} onClick={toggle} aria-pressed={live} aria-label={live ? "Stop listening" : "Speak your question"} title={live ? "Stop" : "Speak"}>
      {live ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
    </button>
  );
}
