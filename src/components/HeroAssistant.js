"use client";

import { useState, useRef, useEffect } from "react";

export default function HeroAssistant({ lessonContext, level }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Selam! Ben Focus AI. Bu dersle ilgili anlamadığın bir yer olursa bana sorabilirsin." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    // Bağlamı sınırla (Token tasarrufu için)
    const truncatedContext = lessonContext?.length > 1500 ? lessonContext.substring(0, 1500) + "..." : lessonContext;

    const prompt = `You are Focus AI, an English teaching assistant. 
    CURRENT LESSON CONTEXT: "${truncatedContext}"
    USER LEVEL: ${level}
    TASK: Answer the user's question about this English lesson. Keep it helpful, simple, and encouraging.
    USER QUESTION: ${userMsg}`;

    try {
      const resp = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
        }),
      });
      const data = await resp.json();
      const aiContent = data.choices?.[0]?.message?.content || "Üzgünüm, şu an yanıt veremiyorum.";
      setMessages(prev => [...prev, { role: "ai", content: aiContent }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Şu an API bağlantısı kurulamadı. Ama merak etme, bu cümlede 'ventured' kelimesi 'cesaret edip girmek' anlamına geliyor!" }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button className="hero-assistant-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <i className="fa-solid fa-xmark"></i> : <i className="fa-solid fa-comment-dots"></i>}
      </button>

      {isOpen && (
        <div className="hero-assistant-panel">
          <div className="hero-assistant-header">
            <h4>Focus AI — {level} Yardımcı</h4>
            <button onClick={() => setIsOpen(false)} style={{background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer'}}>✕</button>
          </div>
          
          <div className="hero-assistant-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`hero-msg hero-msg-${m.role}`}>
                {m.content}
              </div>
            ))}
            {loading && <div className="hero-msg hero-msg-ai">Düşünüyorum...</div>}
          </div>

          <div className="hero-assistant-input">
            <input 
              type="text" 
              placeholder="Soru sor..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} className="btn-primary" style={{padding:'8px 12px'}}>Gönder</button>
          </div>
        </div>
      )}
    </>
  );
}
