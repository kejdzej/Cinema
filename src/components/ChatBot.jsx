import { useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../App.jsx";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "bot", text: "🎬 Cześć! Jestem asystentem CinemaAI. W czym mogę pomóc?" }
  ]);
  const { user } = useAuth();

  const sendMessage = async () => {
    if (!input.trim()) return;
    const text = input;
    setMessages(m => [...m, { from: "user", text }]);
    setInput("");

    try {
      const res = await api.post("/assistant", { message: text, userId: user?.id });
      setMessages(m => [...m, { from: "bot", text: res.data.reply }]);
    } catch {
      setMessages(m => [...m, { from: "bot", text: "😔 Błąd połączenia z asystentem." }]);
    }
  };

  return (
    <div className="chatbot-container">
      {open ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>🎥 CinemaAI</span>
            <button onClick={() => setOpen(false)}>✖</button>
          </div>
          <div className="chatbot-messages">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Napisz wiadomość..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>📨</button>
          </div>
        </div>
      ) : (
        <button className="chatbot-button" onClick={() => setOpen(true)}>💬 AI</button>
      )}
    </div>
  );
}
