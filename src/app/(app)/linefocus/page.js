"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";

export default function LinefocusPage() {
  const { user, loading: authLoading, setAuthModalOpen } = useAuth();
  const { showNotification } = useNotification();
  const [phase, setPhase] = useState("setup"); // setup | typing | result
  const [isMobile, setIsMobile] = useState(false);
  const [sentences, setSentences] = useState([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Tablet ve altını engelle
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [sIdx, setSIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [wrongKeys, setWrongKeys] = useState(0);
  const [typedChars, setTypedChars] = useState([]); // [{char, correct}]
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [readerData, setReaderData] = useState(null);
  const [isEndless, setIsEndless] = useState(false);
  const sessionRef = useRef(null);
  const processingRef = useRef(false);

  // Load history from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("lf_history_blocks") || "[]");
    setHistory(saved);
  }, []);

  function saveHistory(newHistory) {
    setHistory(newHistory);
    localStorage.setItem("lf_history_blocks", JSON.stringify(newHistory));
  }

  // Kategori ile başlat
  async function startFlow(topic) {
    setLoading(true);
    const seed = Math.floor(Math.random() * 10000);
    const prompt = `Task: Write a UNIQUE 4-sentence connected story about ${topic}. Seed: ${seed}. Level: A2-B1.
CRITICAL TURKISH TRANSLATION RULES:
1. Translate for MEANING, not word-for-word. Use natural Turkish SOV order.
2. Never start Turkish with a conjunction like "Ve" or "Ama" — restructure the sentence.
3. Relative clauses (who/which/that) should become Turkish participle forms (-en/-an/-dığı).
4. Avoid devrik (inverted) sentences. Use standard spoken Turkish.
5. Each Turkish sentence must be independently understandable.
Return ONLY a JSON array: [{"en": "english sentence", "tr": "natural Turkish"}]`;

    try {
      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("JSON bulunamadı");
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.length > 0) {
        setSentences(parsed);
        setSIdx(0);
        setCharIdx(0);
        setTotalKeys(0);
        setWrongKeys(0);
        setTypedChars([]);
        sessionRef.current = Date.now();
        processingRef.current = false;
        setIsEndless(false);
        setPhase("typing");
      }
    } catch {
      showNotification("Bağlantı hatası. Lütfen tekrar deneyin.", "error");
    }
    setLoading(false);
  }

  // Endless Book Mode
  async function startEndlessBook() {
    setLoading(true);
    const chapter = parseInt(localStorage.getItem("ai_book_chapter") || "1");
    const bookHistory = localStorage.getItem("ai_book_history") || "In a dark and silent futuristic city, a young coder named Kael finds a strange, ancient machine.";

    const prompt = `### ROLE: Expert Linguistics Professor and Sci-Fi/Mystery Author for YDT preparation.
### TASK: Generate EXACTLY 4 connected sentences for Chapter ${chapter} of an ongoing A2+ level story.
STORY HISTORY: "${bookHistory}"
### LINGUISTIC CONSTRAINTS: CEFR A2-B1 transition. Include at least 2 Academic Keywords.
### STORY RULES: Maintain Sci-Fi Mystery atmosphere. Continue from where history left off.
### TURKISH TRANSLATION RULES:
1. Use natural, spoken Turkish with SOV order. No devrik (inverted) sentences.
2. Relative clauses (who/which/that) → Turkish participle forms (-en/-an/-dığı).
3. Never start Turkish with "Ve", "Ama", or "Fakat" — restructure instead.
4. Each Turkish sentence must be clearly understandable on its own.
### OUTPUT: Return ONLY raw JSON array.
[{"en": "Sentence 1", "tr": "Doğal Türkçe 1"},{"en": "Sentence 2", "tr": "Doğal Türkçe 2"},{"en": "Sentence 3", "tr": "Doğal Türkçe 3"},{"en": "Sentence 4", "tr": "Doğal Türkçe 4"}]`;

    try {
      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.55, max_tokens: 800,
        }),
      });
      const data = await resp.json();
      const raw = (data.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("JSON bozuk");
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.length > 0) {
        setSentences(parsed);
        setSIdx(0);
        setCharIdx(0);
        setTotalKeys(0);
        setWrongKeys(0);
        setTypedChars([]);
        sessionRef.current = "endless_ai_book";
        processingRef.current = false;
        setIsEndless(true);
        setPhase("typing");
      }
    } catch {
      showNotification("AI bağlantı hatası. Tekrar deneyin.", "error");
    }
    setLoading(false);
  }

  // Mekanik Ses Üreteci (Web Audio API)
  const playClick = useCallback((isError = false) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = isError ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(isError ? 150 : 800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isError ? 50 : 400, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }, []);

  // Klavye dinleme
  const handleKeyDown = useCallback((e) => {
    if (phase !== "typing" || !sentences[sIdx] || processingRef.current) return;

    // Sistem tuşlarını engelleme
    if (e.key === " " || e.code === "Space") e.preventDefault();
    if (e.key === "Tab") { e.preventDefault(); return; }
    if (e.ctrlKey || e.altKey || e.metaKey) return;

    const target = sentences[sIdx].en.trim();

    // Backspace
    if (e.key === "Backspace" && charIdx > 0) {
      playClick();
      setCharIdx(prev => prev - 1);
      setTypedChars(prev => prev.slice(0, -1));
      return;
    }

    // Karakter Girişi
    if (e.key.length === 1 && charIdx < target.length) {
      setTotalKeys(prev => prev + 1);
      const isCorrect = e.key.toLowerCase() === target[charIdx].toLowerCase();
      
      if (!isCorrect) {
        setWrongKeys(prev => prev + 1);
        playClick(true); // Hata sesi
      } else {
        playClick(false); // Normal tık
      }

      setTypedChars(prev => [...prev, { char: e.key, correct: isCorrect }]);
      const newCharIdx = charIdx + 1;
      setCharIdx(newCharIdx);

      // Cümle bitti mi?
      if (newCharIdx >= target.length) {
        processingRef.current = true;
        const currentEn = sentences[sIdx].en.trim();
        const currentTr = sentences[sIdx].tr?.trim() || "";
        const histArr = JSON.parse(localStorage.getItem("lf_history_blocks") || "[]");
        let sessionObj = histArr.find(h => h.id === sessionRef.current);
        
        if (!sessionObj) {
          sessionObj = { id: sessionRef.current, en: currentEn, tr: currentTr, isBook: isEndless };
          histArr.unshift(sessionObj);
        } else {
          sessionObj.en += " " + currentEn;
          sessionObj.tr += " " + currentTr;
        }
        localStorage.setItem("lf_history_blocks", JSON.stringify(histArr));
        setHistory([...histArr]);

        if (isEndless) {
          const old = localStorage.getItem("ai_book_history") || "";
          localStorage.setItem("ai_book_history", (old + " " + currentEn).trim().slice(-1000));
        }

        setTimeout(() => {
          const nextIdx = sIdx + 1;
          if (nextIdx < sentences.length) {
            setSIdx(nextIdx);
            setCharIdx(0);
            setTypedChars([]);
            processingRef.current = false;
          } else {
            if (isEndless) {
              const ch = parseInt(localStorage.getItem("ai_book_chapter") || "1");
              localStorage.setItem("ai_book_chapter", String(ch + 1));
            }
            sessionRef.current = null;
            setPhase("result");
          }
        }, 300); // 400ms'den 300ms'e düşürdüm (daha hızlı akış)
      }
    }
  }, [phase, sentences, sIdx, charIdx, isEndless, playClick]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  function resetToSetup() {
    setPhase("setup");
    setSentences([]);
    setSIdx(0);
    setCharIdx(0);
    setTypedChars([]);
    processingRef.current = false;
  }

  function clearHistory() {
    if (!confirm("Tüm okuma geçmişini silmek istediğine emin misin?")) return;
    localStorage.removeItem("lf_history_blocks");
    localStorage.removeItem("ai_book_chapter");
    localStorage.removeItem("ai_book_history");
    setHistory([]);
  }

  // Render
  const categories = [
    "music", "movies & tv", "sports", "travel", "coffee", "gaming",
    "anime", "manga", "comics", "daily life", "science & nature", "history",
    "psychology", "technology", "health", "space", "science of words",
    "fantasy & rpg", "echoes of history", "future & ai"
  ];

  // TYPING SCREEN
  if (phase === "typing" && sentences[sIdx]) {
    const target = sentences[sIdx].en.trim();
    const words = target.split(" ");
    const trText = sentences[sIdx].tr?.trim() || "";
    const trWords = trText.split(" ");
    const ratio = target.length > 0 ? charIdx / target.length : 0;
    const highlightCount = Math.ceil(ratio * trWords.length);

    // Map charIdx to letter spans
    let globalIdx = 0;
    return (
      <div className="lf-standalone">
        {/* Sidebar Toggle */}
        <button className={`lf-sidebar-toggle ${sidebarOpen ? "shifted" : ""}`}
          onClick={() => setSidebarOpen(!sidebarOpen)}>
          <span className="lf-toggle-icon">{sidebarOpen ? "--" : "::"}</span>
          {sidebarOpen ? "close" : "history"}
        </button>

        {/* Sidebar */}
        <div className={`lf-sidebar ${sidebarOpen ? "is-open" : ""}`}>
          <div className="lf-sidebar-inner">
            <h3 className="lf-sidebar-label">completed sentences</h3>
            <button className="lf-clear-btn" onClick={clearHistory}>gecmisi temizle</button>
            <div className="lf-history-list">
              {history.map((item, i) => (
                <div key={i} className="lf-history-item" onClick={() => setReaderData(item)}>
                  <div className="lf-story-meta">
                    {item.isBook ? "ai endless book" : new Date().toLocaleDateString() + " - general flow"}
                  </div>
                  <div className="lf-history-en">{item.en?.substring(0, 120)}...</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Bar */}
        <div className="lf-top-bar">
          <button className="lf-exit-btn" onClick={resetToSetup}>
            <i className="fas fa-chevron-left"></i> back
          </button>
          <div className="lf-logo">linefocus</div>
        </div>

        {/* Main */}
        <div className="lf-main">
          <div className="lf-controls">
            <button className="lf-select-btn" onClick={resetToSetup}>
              <i className="fas fa-th-large"></i> select category
            </button>
            <div className="lf-keystroke">
              <span className="lf-counter-label">total impulses:</span>
              <span className="lf-counter-value">{totalKeys}</span>
            </div>
          </div>

          <div className="lf-header">
            <span className="lf-progress">{sIdx + 1} / {sentences.length}</span>
          </div>

          <div className="lf-flow-container">
            {/* English text */}
            <div className="lf-text-box">
              {words.map((word, wi) => {
                const startGlobal = globalIdx;
                const letterSpans = [];
                for (let ci = 0; ci < word.length; ci++) {
                  const gi = startGlobal + ci;
                  let cls = "lf-letter";
                  if (gi < charIdx) {
                    const tc = typedChars[gi];
                    cls += tc && tc.correct ? " lf-typed" : " lf-wrong";
                  }
                  if (gi === charIdx) cls += " lf-active";
                  letterSpans.push(<span key={gi} className={cls}>{word[ci]}</span>);
                }
                globalIdx += word.length;
                // Add space
                if (wi < words.length - 1) {
                  const spaceGi = globalIdx;
                  let spaceCls = "lf-letter";
                  if (spaceGi < charIdx) spaceCls += " lf-typed";
                  if (spaceGi === charIdx) spaceCls += " lf-active";
                  letterSpans.push(<span key={`s${spaceGi}`} className={spaceCls}> </span>);
                  globalIdx++;
                }
                return <div key={wi} className="lf-word">{letterSpans}</div>;
              })}
            </div>

            {/* Turkish translation (shadow flow) */}
            <div className="lf-translation">
              {trWords.map((w, i) => (
                <span key={i} className={`lf-tr-word ${i < highlightCount ? "lf-tr-highlight" : ""}`}>
                  {w}{" "}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Reader Mode Overlay */}
        {readerData && (
          <div className="lf-reader-overlay" onClick={() => setReaderData(null)}>
            <div className="lf-reader-content" onClick={e => e.stopPropagation()}>
              <button className="lf-reader-close" onClick={() => setReaderData(null)}>
                <i className="fas fa-times"></i> close reader
              </button>
              <div className="lf-reader-en">{readerData.en}</div>
              <div className="lf-reader-tr">{readerData.tr}</div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // RESULT SCREEN
  if (phase === "result") {
    return (
      <div className="lf-standalone">
        <div className="lf-top-bar">
          <div></div>
          <div className="lf-logo">linefocus</div>
        </div>
        <div className="lf-main">
          <div className="lf-result">
            <div className="lf-result-title">flow completed.</div>
            <div className="lf-result-stats">
              <span>keystrokes: {totalKeys}</span>
              <span>errors: {wrongKeys}</span>
              <span>accuracy: {totalKeys > 0 ? Math.round(((totalKeys - wrongKeys) / totalKeys) * 100) : 100}%</span>
            </div>
            <button className="lf-primary-btn" onClick={resetToSetup}>new text</button>
            {isEndless && (
              <button className="lf-primary-btn" style={{ marginTop: 12 }} onClick={startEndlessBook}>
                continue book
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // MOBILE RESTRICTION
  if (isMobile) {
    return (
      <div className="lf-standalone">
        <div className="lf-top-bar">
          <a href="/dashboard" className="lf-exit-btn"><i className="fas fa-chevron-left"></i> back</a>
          <div className="lf-logo">linefocus</div>
        </div>
        <div className="lf-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💻</div>
          <h2 className="lf-setup-title">Sadece Masaüstü</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
            Linefocus odaklanma modu, klavye yazımı ve geniş ekran deneyimi için tasarlanmıştır. Lütfen bu moda bilgisayarınızdan erişin.
          </p>
          <a href="/dashboard" className="lf-primary-btn">Panele Dön</a>
        </div>
      </div>
    );
  }

  // LOADING SCREEN
  if (authLoading) {
    return (
      <div className="lf-standalone">
        <div className="lf-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="lf-loading"><i className="fas fa-circle-notch fa-spin"></i> Yükleniyor...</div>
        </div>
      </div>
    );
  }

  // GUEST SCREEN
  if (!user) {
    return (
      <div className="lf-standalone">
        <div className="lf-top-bar">
          <a href="/dashboard" className="lf-exit-btn"><i className="fas fa-chevron-left"></i> back</a>
          <div className="lf-logo">linefocus</div>
        </div>
        <div className="lf-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔒</div>
          <h2 className="lf-setup-title">Kayıtlı Kullanıcı Alanı</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
            Linefocus odak moduna erişmek ve hikaye okuma geçmişinizi kaydetmek için ücretsiz kayıt olmalısınız.
          </p>
          <button className="lf-primary-btn" onClick={() => setAuthModalOpen(true)}>Kayıt Ol / Giriş Yap</button>
        </div>
      </div>
    );
  }

  // SETUP SCREEN
  return (
    <div className="lf-standalone">
      {/* Sidebar Toggle */}
      <button className={`lf-sidebar-toggle ${sidebarOpen ? "shifted" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span className="lf-toggle-icon">{sidebarOpen ? "--" : "::"}</span>
        {sidebarOpen ? "close" : "history"}
      </button>

      {/* Sidebar */}
      <div className={`lf-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="lf-sidebar-inner">
          <h3 className="lf-sidebar-label">completed sentences</h3>
          <button className="lf-clear-btn" onClick={clearHistory}>gecmisi temizle</button>
          <div className="lf-history-list">
            {history.map((item, i) => (
              <div key={i} className="lf-history-item" onClick={() => setReaderData(item)}>
                <div className="lf-story-meta">
                  {item.isBook ? "ai endless book" : "general flow"}
                </div>
                <div className="lf-history-en">{item.en?.substring(0, 120)}...</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Bar */}
      <div className="lf-top-bar">
        <a href="/dashboard" className="lf-exit-btn">
          <i className="fas fa-chevron-left"></i> back
        </a>
        <div className="lf-logo">linefocus</div>
      </div>

      {/* Main */}
      <div className="lf-main">
        <div className="lf-setup">
          <h2 className="lf-setup-title">select category</h2>
          <div className="lf-categories">
            {categories.map(cat => (
              <button key={cat} onClick={() => startFlow(cat)}>{cat}</button>
            ))}
            <button className="lf-endless-btn" onClick={startEndlessBook}>
              open ai book
            </button>
          </div>
          {loading && (
            <p className="lf-loading">
              <i className="fas fa-circle-notch fa-spin"></i> generating text...
            </p>
          )}
        </div>
      </div>

      {/* Reader */}
      {readerData && (
        <div className="lf-reader-overlay" onClick={() => setReaderData(null)}>
          <div className="lf-reader-content" onClick={e => e.stopPropagation()}>
            <button className="lf-reader-close" onClick={() => setReaderData(null)}>
              <i className="fas fa-times"></i> close reader
            </button>
            <div className="lf-reader-en">{readerData.en}</div>
            <div className="lf-reader-tr">{readerData.tr}</div>
          </div>
        </div>
      )}
    </div>
  );
}
