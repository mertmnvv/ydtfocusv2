"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import { saveAIMessage, getAIMessages, addUserWord, subscribeToUserWords } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

export default function GlobalAI() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", content: "Selam! Ben **Focus**. YDT, YDS veya YÖKDİL sürecinde aklına takılanları bana sorabilirsin. Hem hocan hem de çalışma arkadaşın olarak buradayım! \n\n*Örneğin: 'YDT ne zaman?', 'Present Perfect vs Past Simple' gibi sorular sorabilirsin.*" }
  ]);
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState(null);
  const [words, setWords] = useState([]); // Kullanıcının bankasındaki kelimeler
  const scrollRef = useRef(null);

  // Kelime bankasını dinle (Duplicate engellemek için AI'ya vereceğiz)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserWords(user.uid, (w) => setWords(w || []));
    return () => unsubscribe();
  }, [user]);

  // Sayfa içeriği dinleyicisi
  useEffect(() => {
    const handleContext = (e) => setPageContext(e.detail);
    window.addEventListener("focus-page-context", handleContext);
    return () => window.removeEventListener("focus-page-context", handleContext);
  }, []);

  // 1. Hafıza: Geçmiş mesajları yükle
  useEffect(() => {
    if (!user) return;
    getAIMessages(user.uid).then(history => {
      if (history.length > 0) {
        const formatted = history.map(m => ({ role: m.role, content: m.content }));
        setMessages(formatted);
      }
    });
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    
    const newMessage = { role: "user", content: userMsg };
    setMessages(prev => [...prev, newMessage]);
    if (user) saveAIMessage(user.uid, newMessage);
    
    setLoading(true);

    const systemPrompt = `Selam! Senin adın Focus. YDT Focus platformunun hem uzman öğretmeni hem de en yakın çalışma arkadaşısın. 
    Kullanıcıya karşı samimi, destekleyici, motive edici ve bir dost gibi yaklaşmalısın. "Siz" yerine "Sen" dilini kullan.
    
    ÖNEMLİ BİLGİ:
    - Bu platform (YDT Focus), Mert tarafından dil öğrenme sürecini daha verimli hale getirmek amacıyla geliştirilmiştir. 
    - "Bu platformu kim yaptı?" gibi sorulara net bir şekilde "Mert tarafından geliştirildi" cevabını ver. Yanlış veya belirsiz bilgiler verme.
    
    Görevin SADECE YDT, YDS, YÖKDİL ve İngilizce dil öğrenimi konularında yardımcı olmaktır. 
    
    BİLGİ TABANI:
    - YDT: Yılda 1 kez (Haziran). 80 soru, 120 dk.
    - YDS: Yılda 2 kez + aylık e-YDS. 80 soru, 180 dk.
    - YÖKDİL: Yılda 2 kez. 80 soru, 180 dk.`;

    let finalSystemPrompt = systemPrompt;

    if (pageContext) {
      finalSystemPrompt += `\n\nŞU ANKİ SAYFA İÇERİĞİ: ${JSON.stringify(pageContext)}`;
    }

    if (words.length > 0) {
      finalSystemPrompt += `\n\nKULLANICININ KELİME BANKASI (Bu kelimeleri tekrar ekleme): ${words.map(w => w.word).join(", ")}`;
    }

    finalSystemPrompt += `\n\nYETENEKLER & KURALLAR:
    - Kelime ekleme isteği gelirse: [ACTION: ADD_WORD {"word": "ENGLISH_WORD", "meaning": "TURKISH_MEANING", "syn": "SYNONYM"}]
    - ÖNEMLİ: "word" kısmına MUTLAKA kelimenin İngilizcesini yaz. 
    - Tek bir mesajda birden fazla kelime ekleyebilirsin. Her biri için ayrı [ACTION: ADD_WORD ...] etiketi kullan.
    - Zaten bankada olan kelimeleri ekleme teklif etme.
    
    KİŞİLİK:
    - Enerjik bir hoca/arkadaş gibi konuş. Motivasyon cümleleri kur.`;

    try {
      const resp = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: finalSystemPrompt },
            ...messages.slice(-10).map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
            { role: "user", content: userMsg }
          ],
          temperature: 0.5,
        }),
      });
      const data = await resp.json();
      let aiContent = data.choices?.[0]?.message?.content || "Üzgünüm, şu an bağlantı kurulamadı.";
      
      // 2. Çoklu Tool/Action Yakalama
      const actionMatches = [...aiContent.matchAll(/\[ACTION: ADD_WORD (\{.*?\})\]/g)];
      
      if (actionMatches.length > 0 && user) {
        let addedCount = 0;
        for (const match of actionMatches) {
          try {
            const wordData = JSON.parse(match[1]);
            // Çift kontrol (Frontend tarafında da kontrol edelim)
            const exists = words.some(w => w.word?.toLowerCase() === wordData.word?.toLowerCase());
            if (!exists) {
              await addUserWord(user.uid, wordData);
              addedCount++;
            }
            aiContent = aiContent.replace(match[0], "");
          } catch (e) {
            console.error("Action parsing error:", e);
          }
        }
        if (addedCount > 0) {
          showNotification(`${addedCount} yeni kelime bankana eklendi!`, "success");
        }
        aiContent = aiContent.trim();
      }

      const aiMessage = { role: "ai", content: aiContent };
      setMessages(prev => [...prev, aiMessage]);
      if (user) saveAIMessage(user.uid, aiMessage);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Bir hata oluştu. Lütfen tekrar dene." }]);
    }
    setLoading(false);
  }

  return (
    <>
      <button 
        className={`global-ai-fab ${isOpen ? "active" : ""}`} 
        onClick={() => setIsOpen(!isOpen)}
        title="Focus AI Asistanı"
      >
        <div className="ai-glow"></div>
        {isOpen ? (
          <i className="fa-solid fa-xmark"></i>
        ) : (
          <i className="fa-solid fa-wand-magic-sparkles"></i>
        )}
      </button>

      {isOpen && (
        <div className="global-ai-panel animate-slideUp">
          <div className="global-ai-header">
            <div className="ai-status-dot"></div>
            <div className="ai-header-info">
              <h4>Focus</h4>
              <span>Senin Çalışma Arkadaşın</span>
            </div>
            <button className="close-ai" onClick={() => setIsOpen(false)}>
              <i className="fa-solid fa-chevron-down"></i>
            </button>
          </div>

          <div className="global-ai-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble-wrapper ${m.role}`}>
                <div className="ai-bubble">
                  {m.role === "ai" ? (
                    <div className="markdown-content">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-bubble-wrapper ai">
                <div className="ai-bubble loading-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
            )}
          </div>

          <div className="global-ai-input">
            <input 
              type="text" 
              placeholder="Sınavlar hakkında bir şey sor..." 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage} disabled={loading || !input.trim()}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .global-ai-fab {
          position: fixed;
          bottom: 24px;
          left: 24px;
          z-index: 900;
          width: 56px;
          height: 56px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--accent), #ff9f0a);
          border: none;
          color: #000;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(226, 183, 20, 0.4);
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .global-ai-fab:hover {
          transform: translateY(-5px) rotate(5deg);
          box-shadow: 0 12px 40px rgba(226, 183, 20, 0.6);
        }

        .global-ai-fab.active {
          transform: scale(0.9) rotate(-90deg);
          background: var(--bg-card);
          color: var(--text);
          box-shadow: none;
        }

        .ai-glow {
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, var(--accent), #ff9f0a);
          border-radius: inherit;
          z-index: -1;
          opacity: 0.5;
          filter: blur(8px);
          animation: glowPulse 2s infinite;
        }

        @keyframes glowPulse {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0.5; }
        }

        .global-ai-panel {
          position: fixed;
          bottom: 95px;
          left: 24px;
          width: 380px;
          height: 550px;
          max-height: calc(100vh - 120px);
          background: rgba(28, 28, 30, 0.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          border: 1px solid var(--border);
          border-radius: 28px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }

        .global-ai-header {
          padding: 20px;
          background: rgba(255, 255, 255, 0.03);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ai-status-dot {
          width: 10px;
          height: 10px;
          background: #30d158;
          border-radius: 50%;
          box-shadow: 0 0 10px #30d158;
        }

        .ai-header-info h4 { margin: 0; font-size: 1rem; font-weight: 800; }
        .ai-header-info span { font-size: 0.75rem; color: var(--text-muted); }

        .close-ai {
          margin-left: auto;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.2rem;
        }

        .global-ai-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ai-bubble-wrapper {
          display: flex;
          width: 100%;
        }

        .ai-bubble-wrapper.user { justify-content: flex-end; }

        .ai-bubble {
          max-width: 90%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .ai-bubble-wrapper.ai .ai-bubble {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text);
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .ai-bubble-wrapper.user .ai-bubble {
          background: var(--accent);
          color: #000;
          font-weight: 500;
          border-bottom-right-radius: 4px;
        }

        /* Markdown Styling */
        .ai-bubble :global(.markdown-content p) { margin-bottom: 12px; }
        .ai-bubble :global(.markdown-content p:last-child) { margin-bottom: 0; }
        .ai-bubble :global(.markdown-content h3), 
        .ai-bubble :global(.markdown-content strong) { 
          color: var(--accent); 
          display: inline-block;
          margin-top: 8px;
          margin-bottom: 4px;
        }
        .ai-bubble-wrapper.user :global(.markdown-content strong) { color: #000; }
        .ai-bubble :global(.markdown-content ul), 
        .ai-bubble :global(.markdown-content ol) { 
          margin-left: 20px; 
          margin-bottom: 12px; 
        }
        .ai-bubble :global(.markdown-content li) { margin-bottom: 4px; }

        .global-ai-input {
          padding: 16px;
          display: flex;
          gap: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid var(--border);
        }

        .global-ai-input input {
          flex: 1;
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px 16px;
          color: var(--text);
          outline: none;
          font-family: inherit;
        }

        .global-ai-input button {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--accent);
          border: none;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .global-ai-input button:disabled { opacity: 0.5; }

        .loading-dots { display: flex; gap: 4px; align-items: center; height: 24px; }
        .loading-dots span {
          width: 6px;
          height: 6px;
          background: var(--text-muted);
          border-radius: 50%;
          animation: dotBlink 1.4s infinite both;
        }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes dotBlink {
          0%, 80%, 100% { opacity: 0; }
          40% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .global-ai-panel {
            left: 10px;
            right: 10px;
            width: auto;
            bottom: 145px;
            height: 60vh;
          }
          .global-ai-fab {
            left: 20px;
            bottom: 90px;
          }
        }
      `}</style>
    </>
  );
}
