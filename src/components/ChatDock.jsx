import { MessageCircle, X } from "lucide-react";
import AIChat from "./AIChat.jsx";
import { useApp } from "../context/AppContext.jsx";

/* The panel stays mounted when closed so the conversation is kept. */
export default function ChatDock() {
  const { chat, openChat, closeChat } = useApp();
  return (
    <>
      <section className={`dock ${chat.open ? "open" : ""}`} aria-label="Ask CareLens" aria-hidden={!chat.open}>
        <header>
          <div>
            <b>Ask CareLens</b>
            <small>Text or voice, English or Hinglish</small>
          </div>
          <button className="icon-btn" onClick={closeChat} aria-label="Close chat"><X size={18} /></button>
        </header>
        <AIChat />
      </section>
      {!chat.open && (
        <button className="fab" onClick={() => openChat()} aria-label="Ask CareLens">
          <MessageCircle size={20} /> <span>Ask CareLens</span>
        </button>
      )}
    </>
  );
}
