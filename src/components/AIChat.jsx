import { useEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { askAI } from "../services/api.js";
import VoiceInput from "./VoiceInput.jsx";
import { useApp } from "../context/AppContext.jsx";

const HELLO = {
  en: "Hi, I'm CareLens. Ask me about your reports, medicines or symptoms, by typing or speaking. I explain and help you prepare — I don't diagnose.",
  hi: "Namaste! Main CareLens hoon. Apni reports, dawaiyon ya symptoms ke baare mein poochiye — likh kar ya bol kar. Main samjhata hoon, diagnosis nahi karta.",
};
const CHIPS = {
  en: ["What does my hemoglobin mean?", "What medicines do I take today?", "Explain my sugar results"],
  hi: ["Mera hemoglobin kaisa hai?", "Aaj kaun si dawai leni hai?", "Mere sugar ka matlab samjhao"],
};

export default function AIChat() {
  const { state, chat } = useApp();
  const lang = state.lang;
  const [msgs, setMsgs] = useState([{ role: "bot", text: HELLO[lang] }]);
  const [text, setText] = useState("");
  const [interim, setInterim] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const seen = useRef(chat.nonce);
  const ctx = useRef({});
  ctx.current = { lang, meds: state.meds, labs: state.labs };

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [msgs, busy]);

  async function send(q) {
    const question = (q ?? text).trim();
    if (!question || busy) return;
    setMsgs((m) => [...m, { role: "user", text: question }]);
    setText("");
    setInterim("");
    setBusy(true);
    try {
      const { reply } = await askAI(question, ctx.current);
      setMsgs((m) => [...m, { role: "bot", text: reply }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "I couldn't answer that just now. Please try again.", error: true }]);
    } finally {
      setBusy(false);
    }
  }

  // Questions pushed from other pages ("Ask CareLens" buttons).
  useEffect(() => {
    if (chat.nonce !== seen.current && chat.draft) {
      seen.current = chat.nonce;
      send(chat.draft);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.nonce]);

  return (
    <div className="chat">
      <div className="msgs" aria-live="polite">
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role} ${m.error ? "err" : ""}`}>{m.text}</div>
        ))}
        {busy && <div className="msg bot typing" aria-label="CareLens is typing"><i /><i /><i /></div>}
        <div ref={endRef} />
      </div>
      {msgs.length < 2 && (
        <div className="chips">
          {CHIPS[lang].map((c) => <button key={c} className="chip" onClick={() => send(c)}>{c}</button>)}
        </div>
      )}
      <form className="composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <input
          value={interim || text}
          onChange={(e) => { setInterim(""); setText(e.target.value); }}
          placeholder={lang === "hi" ? "Yahan likhiye ya mic dabaiye…" : "Type or tap the mic…"}
          aria-label="Your question"
        />
        <VoiceInput onInterim={setInterim} onText={(t) => { setInterim(""); setText(t); send(t); }} />
        <button className="send" disabled={busy || !(text.trim() || interim)} aria-label="Send"><SendHorizontal size={18} /></button>
      </form>
    </div>
  );
}
