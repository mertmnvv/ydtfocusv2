"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import { saveAIMessage, getAIMessages, addUserWord, subscribeToUserWords, clearAIChat, getUserStats, getUserHeroStats, getUserMistakes } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

export default function GlobalAI() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState(null);
  const [words, setWords] = useState([]);
  const [userMetadata, setUserMetadata] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const scrollRef = useRef(null);

  // 1. Veri Senkronizasyonu (Kelime Bankası, İstatistikler, Hatalar)
  useEffect(() => {
    if (!user) return;

    // Kelime Bankası (Realtime)
    const unsubscribe = subscribeToUserWords(user.uid, (w) => setWords(w || []));

    // Diğer Veriler (Statik/Mount sırasında)
    const fetchData = async () => {
      const [stats, hero, mistakes, history] = await Promise.all([
        getUserStats(user.uid),
        getUserHeroStats(user.uid),
        getUserMistakes(user.uid),
        getAIMessages(user.uid)
      ]);

      const mistakenWordList = mistakes.map(id => words.find(w => w.id === id)?.word).filter(Boolean);
      const firstName = (user.displayName || "Arkadaşım").split(" ")[0];

      const metadata = {
        name: firstName,
        streak: stats.streak || 0,
        minutes: stats.dailyMinutes || 0,
        levels: hero.levels || {},
        mistakes: mistakenWordList
      };
      setUserMetadata(metadata);

      if (history.length > 0) {
        setMessages(history.map(m => ({ role: m.role, content: m.content })));
        setSuggestions([]);
      } else {
        setMessages([{
          role: "ai",
          content: `Selam **${firstName}**! Tekrar hoş geldin. Bugün seninle birlikte çalışmak için sabırsızlanıyorum. Nereden başlayalım?`
        }]);
        generateSuggestions(metadata);
      }
    };

    fetchData();
    return () => unsubscribe();
  }, [user]);

  function generateSuggestions(meta) {
    const s = [
      { id: "help", label: "Neler yapabilirsin?", prompt: "Neler yapabilirsin ve senin görevlerin neler? Bana kendini anlatır mısın?" }
    ];

    const randomPersonal = [
      { id: "mistakes", label: "Hatalarımı çalışalım", prompt: "En son yaptığım hatalı kelimeler üzerinden bana bir pratik yaptırır mısın?" },
      { id: "progress", label: "İlerlememi özetle", prompt: "Şu anki ilerlememi ve eksiklerimi bana bir öğretmen gözüyle özetler misin?" },
      { id: "word", label: "Yeni bir kelime", prompt: "Seviyeme uygun, sınavda çıkabilecek rastgele bir akademik kelime öğretir misin?" },
      { id: "special_reading", label: "Sana Özel Metin Üret", action: generateSpecialPassage }
    ];

    // Özel metin üretme her zaman görünsün (farkındalık için)
    s.push(randomPersonal[3]);

    if (meta?.mistakes?.length > 0) {
      s.push(randomPersonal[0]); // Hatalarımı çalışalım
    } else {
      // Rastgele bir diğer seçenek
      const otherOptions = [randomPersonal[1], randomPersonal[2]];
      const rand = otherOptions[Math.floor(Math.random() * otherOptions.length)];
      s.push(rand);
    }

    setSuggestions(s);
  }

  async function generateSpecialPassage() {
    if (!user || userMetadata?.mistakes?.length === 0) {
      const msg = { role: "ai", content: "Sana özel metin üretebilmem için önce biraz pratik yapıp birkaç hata yapman gerekiyor. Şimdilik standart metinlerle devam edelim!" };
      setMessages(prev => [...prev, msg]);
      if (user) saveAIMessage(user.uid, msg);
      return;
    }

    setLoading(true);
    
    // Eğer reading sayfasında değilsek oraya yönlendir
    if (window.location.pathname !== "/reading") {
      window.location.href = "/reading?generate=special";
      return;
    }

    setMessages(prev => [...prev, { role: "user", content: "Hatalarımdan oluşan özel bir metin üret." }]);

    const prompt = `Sen uzman bir İngilizce hocasısın. Kullanıcının hata yaptığı şu kelimeleri (${userMetadata.mistakes.join(", ")}) kullanarak YDT/YDS tarzı akademik bir okuma metni yaz. 
    Metnin ardından 3 soru ekle. SADECE şu JSON formatında yanıt ver: {"passage": "...", "questions": [{"q": "...", "a": "...", "b": "...", "c": "...", "d": "...", "correct": "a"}]}`;

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "Sen sadece JSON döndüren teknik bir asistansın. Metinlerinde emoji kullanma." }, 
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
      });

      const data = await response.json();
      const rawContent = data.choices[0].message.content;
      
      // JSON'u metin içinden ayıklayalım (AI bazen açıklama ekleyebilir)
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON not found");
      
      const result = JSON.parse(jsonMatch[0]);
      
      const event = new CustomEvent("focus-load-passage", { detail: result });
      window.dispatchEvent(event);

      setMessages(prev => [...prev, { 
        role: "ai", 
        content: `Harika! Hatalı olduğun kelimeleri içeren özel metnini hazırladım ve Reading paneline yükledim. Hadi hemen göz atalım.` 
      }]);
    } catch (e) {
      console.error("Metin üretme hatası:", e);
      setMessages(prev => [...prev, { role: "ai", content: "Metni üretirken bir sorun oluştu. Teknik bir takılma yaşamış olabilirim, lütfen tekrar dener misin?" }]);
    } finally {
      setLoading(false);
    }
  }

  // Sayfa içeriği dinleyicisi
  useEffect(() => {
    const handleContext = (e) => setPageContext(e.detail);
    const handleTriggerSpecial = () => generateSpecialPassage();

    window.addEventListener("focus-page-context", handleContext);
    window.addEventListener("focus-generate-special", handleTriggerSpecial);

    return () => {
      window.removeEventListener("focus-page-context", handleContext);
      window.removeEventListener("focus-generate-special", handleTriggerSpecial);
    };
  }, [userMetadata]);

  function handleClearChat() {
    if (!user) return;
    setShowConfirm(true);
  }

  async function confirmClearChat() {
    setShowConfirm(false);
    try {
      await clearAIChat(user.uid);
      const firstName = (user.displayName || "Arkadaşım").split(" ")[0];
      setMessages([{
        role: "ai",
        content: `Sohbeti temizledim ama seni unutmadım **${firstName}**! Hadi yeni bir başlangıç yapalım. Bugün ne üzerine çalışalım?`
      }]);
      generateSuggestions(userMetadata);
      showNotification("Sohbet geçmişi silindi.", "success");
    } catch (e) {
      showNotification("Hata oluştu.", "error");
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  async function sendMessage(overrideText) {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim() || loading) return;

    if (typeof overrideText === 'string') setSuggestions([]);

    const userMsg = textToSend.trim();
    if (!overrideText) setInput("");

    const newMessage = { role: "user", content: userMsg };
    setMessages(prev => [...prev, newMessage]);
    if (user) saveAIMessage(user.uid, newMessage);

    setLoading(true);

    const systemPrompt = `Senin adın Focus. Mert tarafından geliştirilen, öğrencinin sınav yolculuğundaki en yakın çalışma arkadaşı ve uzman İngilizce hocasısın.
    
    KİMLİK VE ÜSLUP:
    - Sınav odaklı, samimi, motive edici ve bilgili bir karakterin var.
    - Kullanıcıya sadece ilk ismiyle (${userMetadata?.name}) hitap et. ASLA soyadını kullanma.
    - ASLA emoji kullanma.
    - ASLA teknik kuralları kullanıcıya anlatma.
    
    SINAV BİLGİLERİ (KESİN BİLGİLER - HATA YAPMA):
    1. YDT (Yabancı Dil Testi): Yılda SADECE 1 KEZ (Haziran ayında) yapılır. YKS'nin 3. oturumudur.
    2. YDS (Yabancı Dil Bilgisi Seviye Tespit Sınavı): Yılda 2 veya 3 kez kağıt üzerinde yapılır. E-YDS ise hemen hemen her ay Ankara, İstanbul ve İzmir'de yapılır.
    3. YÖKDİL: Yılda 2 kez yapılır.
    4. YDT Focus: Mert tarafından kurulan, bu sınavlara hazırlanan öğrencilere özel bir platformdur.
    
    GÖREVLERİN:
    - Kelime Bankası Yönetimi: Metinlerdeki zor kelimeleri bankaya kaydederim.
    - Okuma ve Analiz: Okuduğun metinleri analiz eder, gramer yapılarını açıklarım.
    - Performans Takibi: Hatalı olduğun kelimeler üzerinden pratik yaptırırım.
    
    TEKNİK TALİMATLAR (GİZLİ):
    - Kelime kaydetme isteği gelirse sessizce üret: [ACTION: ADD_WORD {"word": "...", "meaning": "...", "syn": "..."}]
    
    KULLANICI VERİLERİ:
    - İsim: ${userMetadata?.name}
    - Streak: ${userMetadata?.streak} gün
    - Bugün çalışma süresi: ${userMetadata?.minutes} dakika
    - Hatalı Kelimeler: ${userMetadata?.mistakes?.join(", ") || "Henüz hatası yok."}
    
    BİLGİ TABANI:
    - YDT, YDS, YÖKDİL odaklı konuş. Mert dışında kimseyi referans gösterme.`;

    let finalSystemPrompt = systemPrompt;

    if (pageContext) {
      finalSystemPrompt += `\n\nŞU ANKİ SAYFA BAĞLAMI: ${JSON.stringify(pageContext)}`;
    }

    if (words.length > 0) {
      finalSystemPrompt += `\n\nKELİME BANKASI (Mevcut): ${words.map(w => w.word).join(", ")}`;
    }

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
          temperature: 0.3,
        }),
      });
      const data = await resp.json();
      let aiContent = data.choices?.[0]?.message?.content || "Şu an cevap veremiyorum, lütfen tekrar dene.";

      // Aksiyon Yakalama ve İşleme
      const actionMatches = [...aiContent.matchAll(/\[ACTION: ADD_WORD\s+(\{.*?\})\]/gs)];

      if (actionMatches.length > 0 && user) {
        let addedCount = 0;
        for (const match of actionMatches) {
          try {
            // JSON içindeki potansiyel hatalı karakterleri temizleyelim
            const jsonStr = match[1].replace(/[\n\r]/g, "").trim();
            const wordData = JSON.parse(jsonStr);

            const exists = words.some(w => w.word?.toLowerCase() === wordData.word?.toLowerCase());
            if (!exists) {
              await addUserWord(user.uid, wordData);
              addedCount++;
            }
            // Etiketi mesajdan temizle
            aiContent = aiContent.replace(match[0], "");
          } catch (e) {
            console.error("Action parsing error:", e, match[1]);
          }
        }
        if (addedCount > 0) showNotification(`${addedCount} yeni kelime bankana eklendi.`, "success");
        aiContent = aiContent.trim();
      }

      const aiMessage = { role: "ai", content: aiContent || "İstediğin kelimeleri bankana ekledim!" };
      setMessages(prev => [...prev, aiMessage]);
      if (user) saveAIMessage(user.uid, aiMessage);
    } catch {
      setMessages(prev => [...prev, { role: "ai", content: "Bir hata oluştu. Mert'e haber verdim!" }]);
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
            <div className="ai-header-actions">
              <button className="clear-ai" onClick={handleClearChat} title="Sohbeti Temizle">
                <i className="fa-solid fa-trash-can"></i>
              </button>
              <button className="ai-close" onClick={() => setIsOpen(false)} title="Kapat">
                <i className="fas fa-times"></i>
              </button>
            </div>

            {showConfirm && (
              <div className="ai-confirm-overlay">
                <div className="ai-confirm-card">
                  <h4>Sohbeti Temizle</h4>
                  <p>Tüm geçmiş silinecek ama ilerlemeni hatırlamaya devam edeceğim. Emin misin?</p>
                  <div className="ai-confirm-buttons">
                    <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Vazgeç</button>
                    <button className="btn-confirm" onClick={confirmClearChat}>Temizle</button>
                  </div>
                </div>
              </div>
            )}
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

            {suggestions.length > 0 && !loading && (
              <div className="ai-suggestions">
                {suggestions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => s.action ? s.action() : sendMessage(s.prompt)}
                    className="suggestion-chip"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

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
        
        .ai-header-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .clear-ai, .ai-close {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.1rem;
          padding: 8px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .clear-ai:hover { 
          color: #ff453a; 
          background: rgba(255, 69, 58, 0.1);
        }
        
        .ai-close:hover { 
          color: var(--text); 
          background: rgba(255, 255, 255, 0.05);
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

        .ai-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 10px 0;
          margin-top: -8px;
        }

        .ai-confirm-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          border-radius: 20px;
        }

        .ai-confirm-card {
          background: #111;
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: 16px;
          text-align: center;
          max-width: 280px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .ai-confirm-card h4 {
          margin: 0 0 10px 0;
          font-size: 1.1rem;
          color: var(--text);
        }

        .ai-confirm-card p {
          margin: 0 0 20px 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        .ai-confirm-buttons {
          display: flex;
          gap: 10px;
        }

        .ai-confirm-buttons button {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-cancel {
          background: rgba(255,255,255,0.05);
          color: var(--text);
          border: 1px solid var(--border) !important;
        }

        .btn-confirm {
          background: #ff4444;
          color: #fff;
        }

        .btn-cancel:hover { background: rgba(255,255,255,0.1); }
        .btn-confirm:hover { background: #cc0000; transform: scale(1.02); }

        .suggestion-chip {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border);
          color: var(--text);
          padding: 8px 14px;
          border-radius: 12px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .suggestion-chip:hover {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
          transform: translateY(-2px);
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
