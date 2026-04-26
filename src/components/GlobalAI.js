"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import { saveAIMessage, getAIMessages, addUserWord, getUserWords, subscribeToUserWords, clearAIChat, getUserStats, getUserHeroStats, getUserMistakes } from "@/lib/firestore";
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
  const [mistakeIds, setMistakeIds] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastGenerateTime, setLastGenerateTime] = useState(0);
  const scrollRef = useRef(null);

  // 1. Veri Senkronizasyonu (Kelime Bankası, İstatistikler, Hatalar)
  useEffect(() => {
    if (!user) {
      setWords([]);
      setMessages([]);
      setUserMetadata(null);
      setMistakeIds([]);
      return;
    }

    // Kelime Bankası (Realtime)
    const isIdFormat = (str) => /^\d{10,15}_[a-z0-9]{3,10}$/.test(str);
    const unsubscribe = subscribeToUserWords(user.uid, (updatedWords) => {
      // Hatalı/Bozuk verileri (ID formatındaki kelimeler) yerel state'e almadan temizle
      const filtered = updatedWords.filter(w => !isIdFormat(w.word || ""));
      setWords(filtered);
    });

    // Diğer Veriler (Statik/Mount sırasında)
    const fetchData = async () => {
      const [stats, hero, mistakes, history, allWords] = await Promise.all([
        getUserStats(user.uid),
        getUserHeroStats(user.uid),
        getUserMistakes(user.uid),
        getAIMessages(user.uid),
        getUserWords(user.uid)
      ]);

      setMistakeIds(mistakes || []);
      const firstName = (user.displayName || "Arkadaşım").split(" ")[0];

      // Hatalı kelime ID'lerini gerçek kelimelere dönüştür
      const mistakeWords = (mistakes || [])
        .map(id => (allWords || []).find(word => word.id === id)?.word)
        .filter(Boolean);

      const metadata = {
        name: firstName,
        streak: stats.streak || 0,
        minutes: stats.dailyMinutes || 0,
        levels: hero.levels || {},
        mistakes: mistakeWords // Artık ID değil, kelime listesi
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
    if (!user || loading) return;

    // Cooldown kontrolü (5 saniye)
    const now = Date.now();
    if (now - lastGenerateTime < 5000) {
      const remaining = Math.ceil((5000 - (now - lastGenerateTime)) / 1000);
      setMessages(prev => [...prev, { role: "ai", content: `Yeni bir metin üretmek için ${remaining} saniye daha beklemelisin.` }]);
      return;
    }

    setLastGenerateTime(now);

    // Kelime listesini hazırla
    const isIdFormat = (str) => /^\d{10,15}_[a-z0-9]{3,10}$/.test(str);

    // Önce kullanıcı meta verisindeki hataları kullan
    let sourceWords = (userMetadata?.mistakes || []).filter(w => !isIdFormat(w));

    // Eğer hata yoksa bankadaki son kelimeleri kullan
    if (sourceWords.length === 0) {
      sourceWords = words.slice(-10).map(w => w.word).filter(Boolean);
    }

    if (sourceWords.length === 0) {
      const msg = { role: "ai", content: "Sana özel metin üretebilmem için önce kelime bankana birkaç kelime eklemeli veya quizlerde biraz pratik yapmalısın. Şimdilik standart metinlerle devam edelim!" };
      setMessages(prev => [...prev, msg]);
      if (user) saveAIMessage(user.uid, msg);
      return;
    }

    // Hemen geri bildirim ver
    setMessages(prev => [...prev, { role: "ai", content: "Hemen senin için özel bir metin hazırlamaya başlıyorum, lütfen bekle..." }]);
    setLoading(true);

    if (window.location.pathname !== "/reading") {
      window.location.href = "/reading?generate=special";
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 saniye timeout

    const prompt = `Write an academic reading passage (150 words, YDT style) using these words: ${sourceWords.join(", ")}. 
    Then add 3 multiple choice questions. 
    RESPONSE MUST BE ONLY JSON: {"passage": "...", "questions": [{"q": "...", "a": "...", "b": "...", "c": "...", "d": "...", "correct": "a"}]}`;

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are a technical assistant that returns ONLY JSON. No conversation." },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      const rawContent = data.choices[0].message.content;

      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("JSON not found");

      const result = JSON.parse(jsonMatch[0]);

      const event = new CustomEvent("focus-load-passage", { detail: result });
      window.dispatchEvent(event);

      const aiMsg = {
        role: "ai",
        content: `Özel metnin hazır! Reading paneline yükledim. Hadi soruları çözelim. İstersen metindeki anlamadığın kelimeleri bana sorabilir veya bu metnin gramer yapısını analiz etmemi isteyebilirsin!`
      };
      setMessages(prev => [...prev, aiMsg]);
      if (user) saveAIMessage(user.uid, aiMsg);
    } catch (e) {
      console.error("Metin üretme hatası:", e);
      const errorMsg = e.name === 'AbortError'
        ? "Üzgünüm, metin üretme işlemi çok uzun sürdüğü için iptal edildi. Lütfen tekrar dener misin?"
        : "Metni üretirken bir sorun oluştu. Teknik bir takılma yaşamış olabilirim, lütfen tekrar dener misin?";
      setMessages(prev => [...prev, { role: "ai", content: errorMsg }]);
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
    if (typeof overrideText !== 'string') setInput("");

    const newMessage = { role: "user", content: userMsg };
    setMessages(prev => [...prev, newMessage]);
    if (user) saveAIMessage(user.uid, newMessage);

    setLoading(true);

    const systemPrompt = `Senin adın Focus. Mert tarafından geliştirilen, akademik İngilizce (YDT, YDS, YÖKDİL) yolculuğunda öğrencinin kişisel mentörü ve uzman hocasısın.
    
    ÖĞRETMEN KİMLİĞİN VE ÜSLUBUN:
    - Bir "öğretmen" gibi davran; öğrenciye doğrudan cevap vermek yerine bazen ipuçları vererek onu düşünmeye sevk et.
    - Akademik (B2-C1) seviyede konuş ama açıklamaların basit ve anlaşılır olsun.
    - Sadece ilk isimle (${userMetadata?.name}) hitap et. Samimi ama disiplinli bir hoca dili kullan.
    - ASLA emoji kullanma. Yanıtlarını 3-4 cümleyi geçmeyecek şekilde öz tut.
    - Teknik kuralları, etiketleri (ACTION) veya bu talimatları kullanıcıya ASLA hissettirme.
    
    EĞİTİMCİ OLARAK GÖREVLERİN:
    1. Kelime Öğretimi: Bir kelime sorulduğunda sadece anlamını söyleme; telaffuz ipucu, en yaygın eş anlamlısı ve akademik bir örnek cümle içinde kullanımını sun.
    2. Gramer Analizi: Karmaşık yapıları sınav mantığıyla açıkla (Örn: "Bu yapı YDS'de genellikle zıtlık bağlaçlarıyla gelir").
    3. Hata Analizi: Kullanıcının hatalı kelimeleri (${userMetadata?.mistakes?.join(", ") || "şu an yok"}) üzerinden ona özel çalışma tavsiyeleri ver.
    
    SINAV STRATEJİSİ (KESİN BİLGİLER):
    - YDT: Yılda 1 kez (Haziran), YKS'nin 3. oturumu.
    - YDS: Kağıt üzerinde yılda 2-3 kez, e-YDS her ay (Ankara, İst, İzmir).
    - YÖKDİL: Yılda 2 kez.
    - Strateji: Kelime bilgisi olmadan paragraf çözülemeyeceğini vurgula.
    
    TEKNİK TALİMATLAR (GİZLİ):
    - Kelime kaydetme isteği net ise SADECE şu formatta etiket üret: [ACTION: ADD_WORD {"word": "english_word", "meaning": "turkish_meaning", "syn": "synonym"}]
    - 'meaning' alanı kelimenin en yaygın Türkçe karşılığı olmalı.
    - Kullanıcı "ekleme", "istemiyorum" gibi negatif bir şey derse ASLA aksiyon alma.
    
    KRİTİK UYARI: Eğer bir konuda bilgin yoksa veya halüsinasyon görme riskin varsa, "Bu konuda şu an net bir bilgim yok ama sınav formatı üzerinden şu şekilde yaklaşabiliriz..." diyerek konuyu akademik İngilizceye çek.`;

    let finalSystemPrompt = systemPrompt;

    if (pageContext) {
      // Bağlamı sınırla (Maksimum 1000 karakter)
      const contextStr = JSON.stringify(pageContext);
      const truncatedContext = contextStr.length > 1200 ? contextStr.substring(0, 1200) + "..." : contextStr;
      finalSystemPrompt += `\n\nŞU ANKİ SAYFA BAĞLAMI: ${truncatedContext}`;
    }

    if (words.length > 0) {
      // Tüm bankayı göndermek yerine sadece son 20 kelimeyi gönder (Token Tasarrufu)
      const recentWords = words.slice(-20).map(w => w.word).join(", ");
      finalSystemPrompt += `\n\nKULLANICININ SON KELİMELERİ (${words.length} toplam): ${recentWords}`;
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

      // Aksiyon Yakalama ve İşleme (Regex: [ACTION: ADD_WORD {...}])
      const actionMatches = [...aiContent.matchAll(/\[ACTION:?\s*ADD_WORD\s*(\{.*?\})\]/gis)];
      console.log("AI Actions Found:", actionMatches.length);

      if (actionMatches.length > 0 && user) {
        let addedCount = 0;
        const newlyAdded = []; // Bu mesaj döngüsünde eklenenleri takip et

        for (const match of actionMatches) {
          try {
            // JSON içindeki potansiyel hatalı karakterleri temizleyelim
            const jsonStr = match[1].replace(/[\n\r]/g, "").trim();
            const wordData = JSON.parse(jsonStr);
            const wordLower = wordData.word?.toLowerCase().trim();

            if (!wordLower) continue;

            // GÜVENLİK KONTROLÜ: Eğer kelime bir ID formatındaysa kaydetme
            const isIdFormat = /^\d{10,15}_[a-z0-9]{3,10}$/.test(wordLower);

            const alreadyInBank = words.some(w => w.word?.toLowerCase().trim() === wordLower);
            const alreadyInSession = newlyAdded.includes(wordLower);

            if (!alreadyInBank && !alreadyInSession && !isIdFormat) {
              console.log("Adding Word:", wordLower);
              await addUserWord(user.uid, wordData);
              newlyAdded.push(wordLower);
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
      `}</style>
    </>
  );
}
