"use client";

import { useState, useEffect, useRef, useCallback, memo, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";
import { getUserWords, getUserMistakes, checkDailyLimit, incrementDailyLimit } from "@/lib/firestore";
import { AI_MODELS, buildLinefocusTopicPrompt, buildLinefocusStoryPrompt, buildLinefocusVocabPrompt } from "@/constants/prompts";

// --- Sub-components for Optimization ---

const Sidebar = memo(({ isOpen, setOpen, history, setReaderData, onClear }) => (
  <>
    <button className={`lf-sidebar-toggle ${isOpen ? "shifted" : ""}`}
      onClick={() => setOpen(!isOpen)}>
      <i className={`fas ${isOpen ? "fa-times" : "fa-history"}`}></i>
      {isOpen ? "close" : "history"}
    </button>

    <div className={`lf-sidebar ${isOpen ? "is-open" : ""}`}>
      <div className="lf-sidebar-inner">
        <h3 className="lf-sidebar-label">completed sentences</h3>
        <button className="lf-clear-btn" onClick={onClear}>clear history</button>
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
  </>
));

const TypingArea = memo(({ sentence, charIdx, typedChars }) => {
  if (!sentence) return null;
  const target = sentence.en.trim();
  const words = target.split(" ");
  const trText = sentence.tr?.trim() || "";
  const trWords = trText.split(" ");
  const ratio = target.length > 0 ? charIdx / target.length : 0;
  const highlightCount = Math.ceil(ratio * trWords.length);

  let globalIdx = 0;

  return (
    <div className="lf-flow-container">
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
          if (wi < words.length - 1) {
            const spaceGi = globalIdx;
            let spaceCls = "lf-letter";
            if (spaceGi < charIdx) spaceCls += " lf-typed";
            if (spaceGi === charIdx) spaceCls += " lf-active";
            letterSpans.push(<span key={`s${spaceGi}`} className={`${spaceCls} lf-space-char`}>&nbsp;</span>);
            globalIdx++;
          }
          return <div key={wi} className="lf-word">{letterSpans}</div>;
        })}
      </div>

      <div className="lf-translation">
        {trWords.map((w, i) => (
          <span key={i} className={`lf-tr-word ${i < highlightCount ? "lf-tr-highlight" : ""}`}>
            {w}{" "}
          </span>
        ))}
      </div>
    </div>
  );
});

const ReaderOverlay = memo(({ data, onClose }) => (
  <div className="lf-reader-overlay" onClick={onClose}>
    <div className="lf-reader-content" onClick={e => e.stopPropagation()}>
      <button className="lf-reader-close" onClick={onClose}>
        <i className="fas fa-times"></i> close reader
      </button>
      <div className="lf-reader-en">{data.en}</div>
      <div className="lf-reader-tr">{data.tr}</div>
    </div>
  </div>
));

export default function LinefocusPage() {
  const { user, loading: authLoading, setAuthModalOpen, isPremium, setPremiumModalOpen } = useAuth();
  const { showNotification } = useNotification();
  const [phase, setPhase] = useState("setup"); // setup | typing | result
  const [isMobile, setIsMobile] = useState(false);
  const [sentences, setSentences] = useState([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
  const audioCtxRef = useRef(null);

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
    if (!user) return setAuthModalOpen(true);

    // Limit Kontrolü
    if (!isPremium) {
      const { limitReached } = await checkDailyLimit(user.uid, "linefocus");
      if (limitReached) {
        setPremiumModalOpen(true);
        return;
      }
    }

    setLoading(true);
    const seed = Math.floor(Math.random() * 10000);
    const prompt = buildLinefocusTopicPrompt(topic);

    try {
      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });
      
      if (!resp.ok) throw new Error("API hatası");
      
      const data = await resp.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("JSON bulunamadı");
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && parsed.length > 0) {
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

        // Başarılı ise limiti artır
        if (!isPremium) {
          await incrementDailyLimit(user.uid, "linefocus");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Yapay zeka şu an yanıt veremiyor. Test modu aktif.", "info");
      const mock = [
        { "en": "The music began to play softly in the background.", "tr": "Müzik arka planda yavaşça çalmaya başladı." },
        { "en": "Everyone in the room stopped talking to listen.", "tr": "Odadaki herkes dinlemek için konuşmayı kesti." },
        { "en": "It was a beautiful melody that felt very familiar.", "tr": "Çok tanıdık gelen güzel bir melodiydi." },
        { "en": "The atmosphere became peaceful and calm immediately.", "tr": "Atmosfer anında huzurlu ve sakin bir hal aldı." }
      ];
      setSentences(mock);
      setSIdx(0);
      setCharIdx(0);
      setTypedChars([]);
      sessionRef.current = Date.now();
      processingRef.current = false;
      setIsEndless(false);
      setPhase("typing");
    }
    setLoading(false);
  }

  // Endless Book Mode
  async function startEndlessBook() {
    if (!user) return setAuthModalOpen(true);

    // Limit Kontrolü
    if (!isPremium) {
      const { limitReached } = await checkDailyLimit(user.uid, "linefocus");
      if (limitReached) {
        setPremiumModalOpen(true);
        return;
      }
    }

    setLoading(true);
    const chapter = parseInt(localStorage.getItem("ai_book_chapter") || "1");
    const bookHistory = localStorage.getItem("ai_book_history") || "In a dark and silent futuristic city, a young coder named Kael finds a strange, ancient machine.";

    const prompt = buildLinefocusStoryPrompt({ chapter, history: bookHistory });

    try {
      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!resp.ok) throw new Error("API hatası");

      const data = await resp.json();
      const raw = (data.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("JSON bozuk");
      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed && parsed.length > 0) {
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

        // Başarılı ise limiti artır
        if (!isPremium) {
          await incrementDailyLimit(user.uid, "linefocus");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Yapay zeka şu an yanıt veremiyor. Test modu aktif.", "info");
      const mock = [
        { "en": "The first chapter of the mysterious book was titled 'The Beginning'.", "tr": "Gizemli kitabın ilk bölümü 'Başlangıç' başlığını taşıyordu." },
        { "en": "It spoke of an ancient machine hidden beneath the city.", "tr": "Şehrin altına gizlenmiş antik bir makineden bahsediyordu." },
        { "en": "Nobody knew who had built it or what its purpose was.", "tr": "Onu kimin yaptığını ya da amacının ne olduğunu kimse bilmiyordu." },
        { "en": "But everyone felt its power vibrating through the ground.", "tr": "Ancak herkes onun gücünün yerin altından titreştiğini hissediyordu." }
      ];
      setSentences(mock);
      setSIdx(0);
      setCharIdx(0);
      setTypedChars([]);
      sessionRef.current = "endless_ai_book";
      processingRef.current = false;
      setIsEndless(true);
      setPhase("typing");
    }
    setLoading(false);
  }

  // Personal Article from Bank & Mistakes
  async function startPersonalArticle() {
    if (!user) return setAuthModalOpen(true);

    // Limit Kontrolü
    if (!isPremium) {
      const { limitReached } = await checkDailyLimit(user.uid, "linefocus");
      if (limitReached) {
        setPremiumModalOpen(true);
        return;
      }
    }
    setLoading(true);
    try {
      const [words, mistakes] = await Promise.all([
        getUserWords(user.uid),
        getUserMistakes(user.uid)
      ]);

      const isIdFormat = (str) => /^\d{10,20}_[a-z0-9]+$/.test(str) || str.includes("_") || /\d/.test(str);
      const bankWords = words.map(w => w.word);
      const combined = [...new Set([...bankWords, ...mistakes])].filter(w => w && w.length > 2 && !isIdFormat(w));

      if (combined.length < 3) {
        showNotification("Bankanızda veya hatalarınızda yeterli kelime (en az 3) yok.", "warning");
        setLoading(false);
        return;
      }

      // Pick random words
      const shuffled = combined.sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, 10);

      const prompt = buildLinefocusVocabPrompt(selectedWords);

      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
        }),
      });

      if (!resp.ok) throw new Error("API hatası");
      
      const data = await resp.json();
      const raw = (data.choices?.[0]?.message?.content || "").replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error("JSON bozuk");
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && parsed.length > 0) {
        setSentences(parsed);
        setSIdx(0);
        setCharIdx(0);
        setTotalKeys(0);
        setWrongKeys(0);
        setTypedChars([]);
        sessionRef.current = "personal_academic_flow";
        processingRef.current = false;
        setIsEndless(false);
        setPhase("typing");

        // Başarılı ise limiti artır
        if (!isPremium) {
          await incrementDailyLimit(user.uid, "linefocus");
        }
      }
    } catch (err) {
      console.error(err);
      showNotification("Yapay zeka şu an yanıt veremiyor.", "error");
    }
    setLoading(false);
  }

  // Mekanik Ses Üreteci (Gelişmiş Gürültü Bazlı Tık)
  const playClick = useCallback((isError = false) => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 0.05; // 50ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Beyaz gürültü oluştur (Gerçek tık hissi için)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = isError ? 200 : 1200; // Hata sesi daha kalın
      filter.Q.value = 1;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(isError ? 0.2 : 0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.error("Audio Error:", e);
    }
  }, []);

  // Klavye dinleme
  const handleKeyDown = useCallback((e) => {
    if (phase !== "typing" || !sentences[sIdx] || processingRef.current) return;

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
      
      playClick(!isCorrect);

      if (!isCorrect) {
        setWrongKeys(prev => prev + 1);
        // Yazı kutusuna sarsılma sınıfı ekle
        const box = document.querySelector(".lf-text-box");
        if (box) {
          box.classList.add("lf-shake-box");
          setTimeout(() => box.classList.remove("lf-shake-box"), 200);
        }
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

        // Geçişi hızlandır (100ms) - Neredeyse anında
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
        }, 100);
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

  function handleClearHistory() {
    localStorage.removeItem("lf_history_blocks");
    localStorage.removeItem("ai_book_chapter");
    localStorage.removeItem("ai_book_history");
    setHistory([]);
    sessionRef.current = null;
    setShowClearConfirm(false);
    showNotification("Okuma geçmişi temizlendi.", "success");
  }

  const memoHistory = useMemo(() => history, [history]);

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
        <Sidebar 
          isOpen={sidebarOpen} 
          setOpen={setSidebarOpen} 
          history={memoHistory} 
          setReaderData={setReaderData}
          onClear={() => setShowClearConfirm(true)}
        />

        <div className="lf-top-bar">
          <button className="lf-exit-btn" onClick={resetToSetup}>
            <i className="fas fa-chevron-left"></i> back
          </button>
          <div className="lf-logo">line<span>focus</span></div>
        </div>

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

          <TypingArea 
            sentence={sentences[sIdx]} 
            charIdx={charIdx} 
            typedChars={typedChars} 
          />
        </div>

        {readerData && (
          <ReaderOverlay data={readerData} onClose={() => setReaderData(null)} />
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
          <div className="lf-logo">line<span>focus</span></div>
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
          <div className="lf-logo">line<span>focus</span></div>
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
          <div className="lf-logo">line<span>focus</span></div>
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
      <Sidebar 
        isOpen={sidebarOpen} 
        setOpen={setSidebarOpen} 
        history={memoHistory} 
        setReaderData={setReaderData}
        onClear={() => setShowClearConfirm(true)}
      />

      {/* Top Bar */}
      <div className="lf-top-bar">
        <a href="/dashboard" className="lf-exit-btn">
          <i className="fas fa-chevron-left"></i> back
        </a>
        <div className="lf-logo">line<span>focus</span></div>
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
            <button className="lf-personal-btn" onClick={startPersonalArticle}>
              generate from bank & mistakes
            </button>
          </div>
          {loading && (
            <p className="lf-loading">
              <i className="fas fa-circle-notch fa-spin"></i> generating text...
            </p>
          )}
        </div>
      </div>

      {readerData && (
        <ReaderOverlay data={readerData} onClose={() => setReaderData(null)} />
      )}

      {showClearConfirm && (
        <CustomDialog 
          className="lf-dialog"
          title="Clear History"
          message="Are you sure you want to delete all reading history and typing statistics? This action cannot be undone."
          onConfirm={handleClearHistory}
          onCancel={() => setShowClearConfirm(false)}
          confirmText="Yes, Delete All"
          cancelText="Cancel"
        />
      )}
    </div>
  );
}
