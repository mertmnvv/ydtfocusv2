"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { 
  getUserWords, getUserMistakes, updateUserMistakes, 
  updateUserWord, incrementStudyMinutes, updateUserStats
} from "@/lib/firestore";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";
import ShareButton from "@/components/ShareButton";

export default function QuizPage() {
  const { user, requireAuth } = useAuth();
  const { showNotification } = useNotification();
  const [words, setWords] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null=seçim, "smart", "bank", "flash", "mistakes", "hybrid"
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [answered, setAnswered] = useState(null);
  const [results, setResults] = useState([]); // Her sorunun sonucu
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showAllMistakes, setShowAllMistakes] = useState(false);

  // Swipe UI Ref
  const scrollRef = useRef(null);

  // Flash card state
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getUserWords(user.uid), 
      getUserMistakes(user.uid)
    ])
      .then(([w, m]) => { 
        setWords(w || []); 
        setMistakes(m || []); 
        setLoading(false); 
      })
      .catch(console.error);
  }, [user]);

  async function addMistakeToUser(wordId) {
    try {
      const ms = await getUserMistakes(user.uid);
      if (!ms.includes(wordId)) {
        const newMs = [...ms, wordId];
        await updateUserMistakes(user.uid, newMs);
        setMistakes(newMs);
      }
    } catch (err) { console.error(err); }
  }

  async function removeMistakeFromUser(wordId) {
    try {
      const ms = await getUserMistakes(user.uid);
      if (ms.includes(wordId)) {
        const newMs = ms.filter(m => m !== wordId);
        await updateUserMistakes(user.uid, newMs);
        setMistakes(newMs);
      }
    } catch (err) { console.error(err); }
  }

  // Timer
  useEffect(() => {
    if (mode && mode !== "flash" && !finished && questions.length > 0) {
      const id = setInterval(() => setTimer(p => p + 1), 1000);
      setTimerInterval(id);
      return () => clearInterval(id);
    }
  }, [mode, finished, questions.length]);

  function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // Quiz üret
  function startQuiz(selectedMode) {
    requireAuth(() => {
      if (words.length < 4) return showNotification("En az 4 kelime gerekli!", "warning");
      
      let pool = [];
      if (selectedMode === "mistakes") {
        // Robust filtering: check ID or word string (for legacy support)
        pool = words.filter(w => 
          mistakes.includes(w.id) || 
          mistakes.includes(w.word) || 
          mistakes.includes(w.word?.toLowerCase())
        );
        if (pool.length < 4) {
          return showNotification("Hatalar testini çözmek için en az 4 hata kaydınız olmalı!", "warning");
        }
        pool = pool.sort(() => Math.random() - 0.5);
      } else if (selectedMode === "hybrid") {
        const mistakePool = words.filter(w => 
          mistakes.includes(w.id) || 
          mistakes.includes(w.word) || 
          mistakes.includes(w.word?.toLowerCase())
        );
        const learnedPool = words.filter(w => (w.level || 0) > 0 && !mistakePool.find(mp => mp.id === w.id));
        const combined = [...mistakePool, ...learnedPool].sort(() => Math.random() - 0.5);
        pool = combined.slice(0, 20);

        if (pool.length < 20) {
          const others = words.filter(w => !pool.find(p => p.id === w.id)).sort(() => Math.random() - 0.5);
          pool = [...pool, ...others.slice(0, 20 - pool.length)];
        }
      } else {
        pool = [...words].sort(() => Math.random() - 0.5);
      }

      setMode(selectedMode);
      setQIdx(0);
      setScore({ correct: 0, wrong: 0 });
      setAnswered(null);
      setResults([]);
      setFinished(false);
      setTimer(0);
      setShowAllMistakes(false);

      if (selectedMode === "flash") {
        setFlashIdx(0);
        setFlashFlipped(false);
        return;
      }

      const count = selectedMode === "hybrid" ? 20 : Math.min(pool.length, 20);
      const qs = [];
      for (let i = 0; i < Math.min(count, pool.length); i++) {
        const correct = pool[i];
        const others = words.filter(w => w.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...others.map(o => ({ text: o.meaning, correct: false })), { text: correct.meaning, correct: true }]
          .sort(() => Math.random() - 0.5);
        qs.push({ word: correct.word, correctMeaning: correct.meaning, options, wordId: correct.id });
      }
      setQuestions(qs);
    });
  }

  function handleAnswer(optionIdx) {
    if (answered !== null) return;
    const q = questions[qIdx];
    const selected = q.options[optionIdx];
    const isCorrect = selected.correct;
    setAnswered(optionIdx);

    const result = {
      word: q.word,
      correctMeaning: q.correctMeaning,
      selectedMeaning: selected.text,
      isCorrect,
    };
    setResults(prev => [...prev, result]);

    if (isCorrect) {
      setScore(prev => ({ ...prev, correct: prev.correct + 1 }));
      playSuccessSound();
      removeMistakeFromUser(q.wordId);
      const wordData = words.find(w => w.id === q.wordId);
      const newLevel = Math.min(4, (wordData?.level || 0) + 1);
      updateUserWord(user.uid, q.wordId, { 
        level: newLevel, 
        nextReview: Date.now() + (newLevel + 1) * 24 * 60 * 60 * 1000, 
        correctCount: (wordData?.correctCount||0) + 1 
      });
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      playErrorSound();
      addMistakeToUser(q.wordId);
      const wordData = words.find(w => w.id === q.wordId);
      updateUserWord(user.uid, q.wordId, { 
        level: 0, 
        nextReview: Date.now() + 5 * 60 * 1000, 
        wrongCount: (wordData?.wrongCount||0) + 1 
      });
    }

    setTimeout(() => {
      if (qIdx + 1 < questions.length) {
        const nextIdx = qIdx + 1;
        setAnswered(null);
        setQIdx(nextIdx);
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.offsetHeight * nextIdx, behavior: "smooth" });
        }
      } else {
        setFinished(true);
        if (timerInterval) clearInterval(timerInterval);
        if (user && timer > 0) {
          const mins = Math.max(1, Math.round(timer / 60));
          incrementStudyMinutes(user.uid, mins).catch(console.error);
          updateUserStats(user.uid, { 
            correct: score.correct + (isCorrect ? 1 : 0), 
            wrong: score.wrong + (isCorrect ? 0 : 1),
            lastTestTime: timer 
          });
        }
      }
    }, 1200);
  }

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!mode) {
    return (
      <div className="quiz-selection-page">
        <h2 className="section-title">ydt<span>focus</span> Quiz</h2>
          <div className="quiz-modes-list">
            <button className="glass-card quiz-mode-btn hybrid" onClick={() => startQuiz("hybrid")}>
              <div className="quiz-mode-tag">YENİ</div>
              <div className="quiz-mode-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></svg>
              </div>
              <div className="quiz-mode-content">
                <div className="quiz-mode-title">Karma Kaydırmalı Tur</div>
                <p className="quiz-mode-desc">Hataların ve öğrendiğin kelimelerden oluşan dinamik dikey seri</p>
              </div>
            </button>
            <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("mistakes")}>
              <div className="quiz-mode-icon" style={{ color: "var(--error)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <div className="quiz-mode-content">
                <div className="quiz-mode-title">Hatalar Testi</div>
                <p className="quiz-mode-desc">Yanlış bildiklerini tekrar et ve bankadan temizle</p>
              </div>
            </button>
            <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("flash")}>
              <div className="quiz-mode-icon" style={{ color: "var(--primary)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
              </div>
              <div className="quiz-mode-content">
                <div className="quiz-mode-title">Flash Cards</div>
                <p className="quiz-mode-desc">Hızlı görsel ve anlam tekrarı için kartlar</p>
              </div>
            </button>
        </div>
        <p className="hint-text" style={{ textAlign: "center", marginTop: 20 }}>Bankanda {words.length} kelime var</p>

        <style jsx>{`
          .quiz-selection-page { max-width: 600px; margin: 0 auto; }
          .section-title span { color: var(--accent); }
          .quiz-modes-list { display: flex; flex-direction: column; gap: 16px; }
          .quiz-mode-btn {
            display: flex; align-items: center; gap: 20px; text-align: left; width: 100%;
            padding: 24px; border: 1px solid var(--border); border-radius: 20px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); background: rgba(255, 255, 255, 0.03);
          }
          .quiz-mode-btn:hover { transform: translateY(-4px); border-color: rgba(226, 183, 20, 0.4); background: rgba(226, 183, 20, 0.05); }
          .quiz-mode-btn.hybrid { border: 1px solid rgba(226, 183, 20, 0.3); background: linear-gradient(135deg, rgba(226, 183, 20, 0.1), transparent); position: relative; overflow: hidden; }
          .quiz-mode-icon {
            display: flex; align-items: center; justify-content: center; width: 56px; height: 56px;
            background: rgba(255, 255, 255, 0.05); border-radius: 16px; flex-shrink: 0; color: var(--accent);
          }
          .quiz-mode-title { font-size: 1.15rem; font-weight: 800; margin-bottom: 4px; color: var(--text); }
          .quiz-mode-desc { font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; }
          .quiz-mode-tag {
            position: absolute; top: 12px; right: -30px; background: var(--accent); color: #000;
            font-size: 0.65rem; font-weight: 900; padding: 4px 35px; transform: rotate(45deg);
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          }
        `}</style>
      </div>
    );
  }

  function playAudio(text, e) {
    if (e) e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  }

  // FLASH CARDS
  if (mode === "flash") {
    if (words.length === 0) return <p className="hint-text" style={{ textAlign: "center", padding: 40 }}>Bankanız boş.</p>;
    const safeIdx = Math.min(flashIdx, words.length - 1);
    const card = words[safeIdx];
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
        <div className="header-split" style={{ marginBottom: 20 }}>
          <button className="btn-ghost" onClick={() => setMode(null)}>Geri</button>
          <span className="hint-text">{safeIdx + 1} / {words.length}</span>
        </div>
        <div className="flash-scene" onClick={() => setFlashFlipped(!flashFlipped)}>
          <div className={`flash-card-inner ${flashFlipped ? "flipped" : ""}`}>
            <div className="flash-front">
              <h2 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {card.word}
                <button className="audio-btn" onClick={(e) => playAudio(card.word, e)} title="Dinle">🔊</button>
              </h2>
              <span className="flash-hint">Tıklayarak çevir</span>
            </div>
            <div className="flash-back">
              <h3>{card.meaning}</h3>
              {card.syn && card.syn !== "-" && <p className="flash-syn">{card.syn}</p>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="btn-ghost" style={{ flex: 1 }} disabled={safeIdx <= 0} onClick={() => { setFlashIdx(Math.max(0, safeIdx - 1)); setFlashFlipped(false); }}>Önceki</button>
          <button className="btn-primary" style={{ flex: 1 }} disabled={safeIdx >= words.length - 1} onClick={() => { if (safeIdx < words.length - 1) { setFlashIdx(safeIdx + 1); setFlashFlipped(false); } }}>Sonraki</button>
        </div>
      </div>
    );
  }

  // SONUÇ EKRANI
  if (finished) {
    const total = score.correct + score.wrong;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const wrongAnswers = results.filter(r => !r.isCorrect);

    return (
      <div className="result-page">
        <div className="glass-card result-card">
          <div className="result-header">
            <div className="result-icon-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
            </div>
            <h2 className="result-title">Tur Tamamlandı!</h2>
            <p className="result-subtitle">{formatTime(timer)} sürede bitirdin</p>
          </div>

          <div className="result-stats-grid">
            <div className="res-stat-card success"><div className="res-stat-val">{score.correct}</div><div className="res-stat-label">Doğru</div></div>
            <div className="res-stat-card error"><div className="res-stat-val">{score.wrong}</div><div className="res-stat-label">Yanlış</div></div>
            <div className="res-stat-card accent"><div className="res-stat-val">%{pct}</div><div className="res-stat-label">Başarı</div></div>
          </div>

          {wrongAnswers.length > 0 && (
            <div className="result-mistakes">
              <h4 className="mistakes-title">Gözden Geçir</h4>
              <div className="mistakes-list">
                {(showAllMistakes ? wrongAnswers : wrongAnswers.slice(0, 5)).map((r, i) => (
                  <div key={i} className="mistake-item">
                    <span className="mistake-word">{r.word}</span>
                    <span className="mistake-arrow">→</span>
                    <span className="mistake-meaning">{r.correctMeaning}</span>
                  </div>
                ))}
                {wrongAnswers.length > 5 && !showAllMistakes && (
                  <button className="btn-show-more" onClick={() => setShowAllMistakes(true)}>
                    ve {wrongAnswers.length - 5} tane daha göster...
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button className="btn-ghost" onClick={() => setMode(null)}>Ana Menü</button>
            <button className="btn-primary" onClick={() => startQuiz(mode)}>Yeniden Başlat</button>
          </div>
        </div>

        <style jsx>{`
          .result-page { max-width: 600px; margin: 0 auto; animation: fadeIn 0.5s ease-out; }
          .result-card { padding: 40px; text-align: center; }
          .result-header { margin-bottom: 32px; }
          .result-icon-circle {
            width: 80px; height: 80px; background: rgba(226, 183, 20, 0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: var(--accent);
            margin: 0 auto 20px; border: 1px solid rgba(226, 183, 20, 0.2);
          }
          .result-title { font-size: 2.2rem; font-weight: 900; margin-bottom: 8px; letter-spacing: -1px; }
          .result-subtitle { color: var(--text-muted); font-size: 1.1rem; }
          .result-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 40px; }
          .res-stat-card { background: var(--glass); border: 1px solid var(--border); border-radius: 20px; padding: 20px 10px; }
          .res-stat-val { font-size: 1.8rem; font-weight: 900; margin-bottom: 4px; }
          .res-stat-card.success .res-stat-val { color: var(--primary); }
          .res-stat-card.error .res-stat-val { color: var(--error); }
          .res-stat-card.accent .res-stat-val { color: var(--accent); }
          .res-stat-label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
          .result-mistakes { text-align: left; background: var(--bg-elevated); border-radius: 20px; padding: 24px; margin-bottom: 32px; }
          .mistakes-title { font-weight: 800; margin-bottom: 16px; color: var(--error); font-size: 1rem; }
          .mistake-item { display: flex; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
          .mistake-word { font-weight: 700; min-width: 100px; color: var(--text); }
          .mistake-arrow { color: var(--text-muted); }
          .mistake-meaning { color: var(--primary); font-size: 0.9rem; }
          .btn-show-more {
            background: none; border: none; color: var(--accent); font-size: 0.85rem; font-weight: 700;
            padding: 12px 0; cursor: pointer; width: 100%; text-align: center; opacity: 0.8;
          }
          .btn-show-more:hover { opacity: 1; text-decoration: underline; }
          .result-actions { display: flex; gap: 16px; }
          .result-actions button { flex: 1; padding: 16px; font-size: 1rem; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="quiz-sim">
      <div className="quiz-sim-bar">
        <button className="quiz-exit-icon" onClick={() => { if (timerInterval) clearInterval(timerInterval); setMode(null); }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div className="quiz-sim-progress">
          <div className="quiz-sim-progress-fill" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }}></div>
        </div>
        <span className="quiz-sim-timer">{formatTime(timer)}</span>
        <span className="quiz-sim-counter">{qIdx + 1}/{questions.length}</span>
      </div>

      <div className="quiz-scroll-container" ref={scrollRef}>
        {questions.map((q, idx) => (
          <div key={idx} className={`quiz-slide ${idx === qIdx ? "active" : ""}`}>
            <div className="quiz-sim-body">
              <div className="quiz-sim-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 40 }}>
                <div className="quiz-sim-word" style={{ marginBottom: 0 }}>{q.word}</div>
                <ShareButton item={q} type="question" />
              </div>
              <div className="quiz-sim-options">
                {q.options.map((opt, oi) => {
                  let cls = "quiz-sim-opt";
                  if (idx === qIdx && answered !== null) {
                    if (opt.correct) cls += " correct-ans flash-success";
                    else if (oi === answered && !opt.correct) cls += " wrong-ans shake-error";
                  }
                  return (
                    <button key={oi} className={cls} onClick={() => handleAnswer(oi)} disabled={idx !== qIdx || answered !== null}>
                      <span className="quiz-sim-opt-letter">{String.fromCharCode(65 + oi)}</span>
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .quiz-scroll-container { display: flex; flex-direction: column; overflow: hidden; width: 100%; height: calc(100vh - 180px); scroll-snap-type: y mandatory; }
        .quiz-slide {
          flex: 0 0 100%; width: 100%; height: 100%; scroll-snap-align: start;
          display: flex; align-items: center; justify-content: center; pointer-events: none;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; transform: translateY(40px);
        }
        .quiz-slide.active { pointer-events: all; opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}
