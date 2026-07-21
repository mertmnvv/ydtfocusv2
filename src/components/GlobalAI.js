"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import ReactMarkdown from "react-markdown";
import {
  saveAIMessage,
  getAIMessages,
  addUserWord,
  subscribeToUserWords,
  clearAIChat,
  getUserStats,
  getUserHeroStats,
  getUserMistakes
} from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import PremiumModal from "./PremiumModal";
import { AI_MODELS, buildFocusChatSystemPrompt, buildSpecialPassagePrompt } from "@/constants/prompts";

export default function GlobalAI() {
  const { user, isPremium } = useAuth();
  const { showNotification } = useNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageContext, setPageContext] = useState(null);
  const [words, setWords] = useState([]);
  const [userMetadata, setUserMetadata] = useState(null);
  const [mistakeIds, setMistakeIds] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) {
      setWords([]); setMessages([]); setUserMetadata(null); setMistakeIds([]);
      return;
    }
    const unsubscribe = subscribeToUserWords(user.uid, (updatedWords) => {
      setWords(updatedWords.filter(w => !/^\d{10,15}_[a-z0-9]{3,10}$/.test(w.word || "")));
    });
    const fetchData = async () => {
      const [stats, mistakes, history] = await Promise.all([
        getUserStats(user.uid), getUserMistakes(user.uid), getAIMessages(user.uid)
      ]);
      setMistakeIds(mistakes || []);
      const firstName = (user.displayName || "Arkadaşım").split(" ")[0];
      if (history.length > 0) {
        setMessages(history.map(m => ({ role: m.role, content: m.content })));
      } else {
        setMessages([{ role: "ai", content: `Merhaba **${firstName}**! Akademik İngilizce pratiğine hazır mısın?` }]);
      }
    };
    fetchData();
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const firstName = (user.displayName || "Arkadaşım").split(" ")[0];
    const mistakeWords = (mistakeIds || []).map(id => words.find(word => word.id === id)?.word).filter(Boolean);
    getUserStats(user.uid).then(stats => {
      setUserMetadata({ name: firstName, streak: stats.streak || 0, mistakes: mistakeWords, totalWords: words.length });
      setSuggestions([
        { id: "tenses", label: "Zaman Sorusu", prompt: "Bana akademik seviyede bir tense sorusu ver." },
        { id: "reading", label: "Okuma Pasajı", action: generateSpecialPassage },
        { id: "vocab", label: "Kelime Quizi", prompt: "Bana akademik kelime quizi ver." }
      ]);
    });
  }, [words, mistakeIds, user]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  async function generateSpecialPassage() {
    if (!user || !isPremium || loading) return;
    setLoading(true); setIsOpen(true);
    if (window.location.pathname !== "/reading") {
      window.location.href = "/reading?generate=special";
      return;
    }
    try {
      const sourceWords = userMetadata?.mistakes?.length > 0 ? userMetadata.mistakes : words.slice(-5).map(w => w.word);
      const { system, user: userContent } = buildSpecialPassagePrompt(sourceWords);
      const response = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
          messages: [{ role: "system", content: system }, { role: "user", content: userContent }],
          response_format: { type: "json_object" }
        }),
      });
      const data = await response.json();
      window.dispatchEvent(new CustomEvent("focus-load-passage", { detail: JSON.parse(data.choices[0].message.content) }));
      setMessages(prev => [...prev, { role: "ai", content: "Academic passage loaded." }]);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  function handleClearChat() { if (user) setShowConfirm(true); }
  async function confirmClearChat() {
    setShowConfirm(false);
    try {
      await clearAIChat(user.uid);
      setMessages([{ role: "ai", content: "Chat cleared." }]);
    } catch (e) { console.error(e); }
  }

  function handleOptionClick(opt) {
    if (showResult) return;
    setSelectedOption(opt);
    setShowResult(true);
  }

  function handleNextQuestion() {
    setActiveQuiz(null);
    sendMessage("Next question please.");
  }

  async function sendMessage(overrideText) {
    if (!isPremium) {
      setIsPremiumModalOpen(true);
      return;
    }
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim() || loading) return;
    if (typeof overrideText === 'string') setSuggestions([]);
    const userMsg = textToSend.trim();
    if (typeof overrideText !== 'string') setInput("");
    const newUserMsg = { role: "user", content: userMsg };
    setMessages(prev => [...prev, newUserMsg]);
    if (user) saveAIMessage(user.uid, newUserMsg);
    setLoading(true);

    const systemPrompt = buildFocusChatSystemPrompt({
      name: userMetadata?.name,
      totalWords: userMetadata?.totalWords,
      streak: userMetadata?.streak,
      mistakes: userMetadata?.mistakes,
    });

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, newUserMsg], systemPrompt }),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      setMessages(prev => [...prev, { role: "ai", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiContent += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const m = [...prev]; m[m.length - 1].content = aiContent; return m;
        });
      }

      // ──── Action Handlers (sağlam quiz parsing) ────
      let quizParsed = false;
      
      // Yöntem 1: Standart format
      const quizMatch = aiContent.match(/\[ACTION:\s*SHOW_QUIZ\s*(\{[\s\S]*?\})\s*\]/);
      if (quizMatch) {
        try {
          const quizData = JSON.parse(quizMatch[1]);
          if (quizData.q && quizData.a && quizData.b && quizData.c && quizData.d && quizData.correct) {
            setActiveQuiz(quizData);
            setSelectedOption(null); setShowResult(false);
            aiContent = aiContent.replace(quizMatch[0], "").trim();
            quizParsed = true;
          }
        } catch (e) { console.error("Quiz parse error (method 1):", e); }
      }

      // Yöntem 2: JSON satır sonlarıyla bozulmuşsa temizle
      if (!quizParsed) {
        const fallbackMatch = aiContent.match(/\[ACTION:\s*SHOW_QUIZ\s*([\s\S]*?)\]/);
        if (fallbackMatch) {
          try {
            const cleaned = fallbackMatch[1].replace(/[\n\r]/g, " ").replace(/\s+/g, " ").trim();
            const quizData = JSON.parse(cleaned);
            if (quizData.q && quizData.correct) {
              setActiveQuiz(quizData);
              setSelectedOption(null); setShowResult(false);
              aiContent = aiContent.replace(fallbackMatch[0], "").trim();
              quizParsed = true;
            }
          } catch (e) { console.error("Quiz parse error (method 2):", e); }
        }
      }

      // Kelime ekleme
      const wordMatches = [...aiContent.matchAll(/\[ACTION:\s*ADD_WORD\s*(\{[\s\S]*?\})\s*\]/g)];
      for (const m of wordMatches) {
        try { await addUserWord(user.uid, JSON.parse(m[1])); aiContent = aiContent.replace(m[0], ""); } catch (e) { }
      }

      const final = aiContent.trim() || (quizParsed ? "Soru hazır! Cevabını seç." : "");
      if (final) {
        setMessages(prev => {
          const m = [...prev]; m[m.length - 1].content = final; return m;
        });
        if (user) saveAIMessage(user.uid, { role: "ai", content: final });
      } else {
        // Boş mesajı kaldır
        setMessages(prev => prev.slice(0, -1));
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  return (
    <>
      <button className="global-ai-fab" onClick={() => setIsPremiumModalOpen(true)}>
        <div className="ai-glow"></div>
        <i className="fa-solid fa-wand-magic-sparkles"></i>
      </button>

      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />

      {isOpen && (
        <div className="global-ai-panel animate-slideUp">
          <div className="global-ai-header">
            <div className="ai-status-dot"></div>
            <div className="ai-header-info">
              <h4>Focus {isPremium && <i className="fa-solid fa-crown" style={{ color: "#ffd60a", fontSize: "0.8rem" }}></i>}</h4>
              <span>Academic Instructor</span>
            </div>
            <div className="ai-header-actions">
              <button onClick={handleClearChat}><i className="fa-solid fa-trash-can"></i></button>
              <button onClick={() => setIsOpen(false)}><i className="fas fa-times"></i></button>
            </div>
            {showConfirm && (
              <div className="ai-confirm-overlay">
                <div className="ai-confirm-card">
                  <p>Clear chat history?</p>
                  <div className="ai-confirm-buttons">
                    <button onClick={() => setShowConfirm(false)}>No</button>
                    <button className="btn-confirm" onClick={confirmClearChat}>Yes</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="global-ai-messages" ref={scrollRef}>
            {messages.map((m, i) => (
              <div key={i} className={`ai-bubble-wrapper ${m.role}`}>
                <div className="ai-bubble">
                  {m.role === "ai" ? <div className="markdown-content"><ReactMarkdown>{m.content}</ReactMarkdown></div> : m.content}
                </div>
              </div>
            ))}
            {suggestions.length > 0 && !loading && isPremium && !activeQuiz && (
              <div className="ai-suggestions">
                {suggestions.map(s => <button key={s.id} onClick={() => s.action ? s.action() : sendMessage(s.prompt)} className="suggestion-chip">{s.label}</button>)}
              </div>
            )}
            {loading && <div className="ai-bubble-wrapper ai"><div className="ai-bubble loading-dots"><span></span><span></span><span></span></div></div>}
          </div>

          {activeQuiz && (
            <div className="ai-quiz-panel animate-pop">
              <div className="quiz-header"><span>ACADEMIC CHALLENGE</span><button onClick={() => setActiveQuiz(null)}><i className="fa-solid fa-xmark"></i></button></div>
              <div className="quiz-content">
                <p className="quiz-question">{activeQuiz.q}</p>
                <div className="quiz-options">
                  {['a', 'b', 'c', 'd'].map(opt => {
                    const isSelected = selectedOption === opt;
                    const isCorrect = opt === activeQuiz.correct;
                    const status = isSelected ? (isCorrect ? 'correct' : 'wrong') : (showResult && isCorrect ? 'correct' : '');
                    return (
                      <button key={opt} onClick={() => handleOptionClick(opt)} className={`quiz-opt ${status}`} disabled={showResult}>
                        <span className="opt-label">{opt.toUpperCase()}</span> {activeQuiz[opt]}
                      </button>
                    );
                  })}
                </div>
                {showResult && (
                  <div className="quiz-explanation animate-slideUp">
                    <p>{activeQuiz.explanation}</p>
                    <button className="next-btn" onClick={handleNextQuestion}>Continue</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isPremium && (
            <div className="ai-premium-lock">
              <i className="fa-solid fa-lock" style={{ fontSize: "2rem", color: "#ffd60a", marginBottom: "1rem" }}></i>
              <h4>Premium Only</h4>
              <button onClick={() => window.location.href = "/premium"} className="premium-btn">Upgrade</button>
            </div>
          )}

          <div className="global-ai-input">
            <input type="text" placeholder={isPremium ? "Ask about grammar..." : "Locked"} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} disabled={!isPremium || !!activeQuiz} />
            <button onClick={sendMessage} disabled={loading || !input.trim() || !isPremium || !!activeQuiz}><i className="fa-solid fa-paper-plane"></i></button>
          </div>
        </div>
      )}

      <style jsx>{`
        .global-ai-fab { position: fixed; bottom: 24px; left: 24px; z-index: 900; width: 56px; height: 56px; border-radius: 20px; background: linear-gradient(135deg, var(--accent), #ff9f0a); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 32px rgba(226, 183, 20, 0.4); transition: all 0.2s; }
        .ai-glow { position: absolute; inset: -2px; background: linear-gradient(135deg, var(--accent), #ff9f0a); border-radius: inherit; z-index: -1; opacity: 0.5; filter: blur(8px); }
        .global-ai-panel { position: fixed; bottom: 95px; left: 24px; width: 400px; height: 580px; background: rgba(28, 28, 30, 0.95); backdrop-filter: blur(30px); border: 1px solid var(--border); border-radius: 28px; z-index: 1000; display: flex; flex-direction: column; overflow: hidden; }
        .global-ai-header { padding: 18px 20px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; gap: 12px; background: rgba(34,34,34,0.9); backdrop-filter: blur(20px); }
        .ai-status-dot { width: 10px; height: 10px; background: #30d158; border-radius: 50%; box-shadow: 0 0 10px #30d158; flex-shrink: 0; }
        .ai-header-info h4 { margin: 0; font-size: 1rem; font-weight: 800; }
        .ai-header-info span { font-size: 0.75rem; color: #888; }
        .ai-header-actions { margin-left: auto; display: flex; gap: 12px; }
        .ai-header-actions button { background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; padding: 4px; }
        .global-ai-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; }
        .ai-bubble-wrapper { display: flex; }
        .ai-bubble { max-width: 90%; padding: 14px 18px; border-radius: 20px; font-size: 0.95rem; line-height: 1.6; }
        .ai-bubble-wrapper.ai .ai-bubble { background: rgba(255,255,255,0.05); }
        .ai-bubble-wrapper.user { justify-content: flex-end; }
        .ai-bubble-wrapper.user .ai-bubble { background: var(--accent); color: #000; }
        .ai-suggestions { display: flex; flex-wrap: wrap; gap: 8px; padding: 4px 0; }
        .suggestion-chip { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: var(--text); padding: 10px 16px; border-radius: 14px; cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: 0.2s; }
        .suggestion-chip:hover { background: rgba(255,255,255,0.1); border-color: var(--accent); }
        .ai-quiz-panel { position: absolute; inset: 0; top: 70px; background: #1c1c1e; z-index: 60; display: flex; flex-direction: column; padding: 24px; overflow-y: auto; }
        .quiz-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-size: 0.7rem; font-weight: 800; color: var(--accent); letter-spacing: 1px; }
        .quiz-header button { background: none; border: none; color: #fff; cursor: pointer; padding: 8px; font-size: 1rem; }
        .quiz-question { font-size: 1.05rem; font-weight: 600; color: #fff; margin-bottom: 24px; line-height: 1.6; }
        .quiz-options { display: flex; flex-direction: column; gap: 10px; }
        .quiz-opt { background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 14px; padding: 16px; color: #fff; text-align: left; cursor: pointer; font-size: 0.95rem; transition: 0.2s; }
        .quiz-opt:hover { background: rgba(255,255,255,0.08); }
        .quiz-opt.correct { background: rgba(48, 209, 88, 0.2); border-color: #30d158; }
        .quiz-opt.wrong { background: rgba(255, 69, 58, 0.2); border-color: #ff453a; }
        .opt-label { font-weight: 800; margin-right: 8px; }
        .quiz-explanation { margin-top: 20px; padding: 16px; background: rgba(255,255,255,0.03); border-radius: 14px; border-left: 3px solid var(--accent); font-size: 0.9rem; line-height: 1.6; }
        .next-btn { width: 100%; padding: 14px; background: var(--accent); border-radius: 12px; font-weight: 800; cursor: pointer; border: none; margin-top: 12px; font-size: 0.95rem; }
        .ai-premium-lock { position: absolute; inset: 0; top: 70px; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; }
        .premium-btn { margin-top: 15px; padding: 14px 28px; background: var(--accent); border-radius: 12px; font-weight: 800; border: none; cursor: pointer; font-size: 0.95rem; }
        .global-ai-input { padding: 16px; display: flex; gap: 10px; border-top: 1px solid rgba(255,255,255,0.08); background: rgba(34,34,34,0.9); backdrop-filter: blur(20px); }
        .global-ai-input input { flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 14px 16px; color: #fff; outline: none; font-size: 0.95rem; }
        .global-ai-input input:focus { border-color: var(--accent); }
        .global-ai-input button { width: 48px; height: 48px; border-radius: 14px; background: var(--accent); border: none; cursor: pointer; flex-shrink: 0; transition: 0.2s; }
        .global-ai-input button:hover { transform: scale(1.05); }
        .ai-confirm-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .ai-confirm-card { background: #111; border: 1px solid var(--border); padding: 28px; border-radius: 20px; text-align: center; }
        .ai-confirm-buttons { display: flex; gap: 10px; margin-top: 20px; }
        .ai-confirm-buttons button { flex: 1; padding: 12px; border-radius: 12px; border: none; cursor: pointer; font-weight: 600; }
        .btn-confirm { background: #ff4444; color: #fff; }
        .loading-dots { display: flex; gap: 4px; padding: 8px 12px; }
        .loading-dots span { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: dotBlink 1.4s infinite both; }
        .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBlink { 0%, 80%, 100% { opacity: 0; } 40% { opacity: 1; } }
        .markdown-content { line-height: 1.7; }
        .markdown-content p { margin: 0 0 8px; }
        .markdown-content strong { color: var(--accent); }

        /* ─── MOBILE FULLSCREEN ─── */
        @media (max-width: 768px) {
          .global-ai-fab { bottom: 100px; left: 16px; width: 50px; height: 50px; }
          .global-ai-panel { inset: 0; width: 100%; height: 100%; border-radius: 0; bottom: 0; left: 0; border: none; z-index: 10001; }
          .global-ai-header { padding: 16px; padding-top: max(20px, env(safe-area-inset-top)); }
          .global-ai-messages { padding: 16px; padding-bottom: 100px; }
          .ai-bubble { max-width: 92%; font-size: 1rem; padding: 14px 16px; }
          .ai-quiz-panel { padding: 20px 16px; top: 65px; }
          .quiz-question { font-size: 1rem; }
          .quiz-opt { padding: 16px; font-size: 1rem; }
          .suggestion-chip { padding: 12px 16px; font-size: 0.9rem; }
          .global-ai-input { 
            padding: 16px; 
            padding-bottom: max(24px, calc(env(safe-area-inset-bottom) + 16px));
            background: rgba(28, 28, 30, 0.98);
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
          }
          .global-ai-input input { padding: 14px 16px; font-size: 1rem; }
          .global-ai-input button { width: 50px; height: 50px; }
        }
      `}</style>
    </>
  );
}
