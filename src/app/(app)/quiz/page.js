"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import {
  getUserWords, getUserMistakes, updateUserMistakes,
  updateUserWord, incrementStudyMinutes, updateUserStats
} from "@/lib/firestore";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";

export default function QuizPage() {
  const { user, requireAuth } = useAuth();
  const { showNotification } = useNotification();
  const [words, setWords] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null=seçim, "mistakes", "hybrid"
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [answered, setAnswered] = useState(null);
  const [results, setResults] = useState([]); // Her sorunun sonucu
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showAllMistakes, setShowAllMistakes] = useState(false);
  const quizActiveRef = useRef(false); // If a quiz is currently running

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
    if (mode && !finished && questions.length > 0) {
      const id = setInterval(() => setTimer(p => p + 1), 1000);
      setTimerInterval(id);
      return () => clearInterval(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      quizActiveRef.current = true;

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
        correctCount: (wordData?.correctCount || 0) + 1
      });
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      playErrorSound();
      addMistakeToUser(q.wordId);
      const wordData = words.find(w => w.id === q.wordId);
      updateUserWord(user.uid, q.wordId, {
        level: 0,
        nextReview: Date.now() + 5 * 60 * 1000,
        wrongCount: (wordData?.wrongCount || 0) + 1
      });
    }

    setTimeout(() => {
      if (!quizActiveRef.current) return;

      if (qIdx + 1 < questions.length) {
        setAnswered(null);
        setQIdx(prev => prev + 1);
      } else {
        setFinished(true);
        quizActiveRef.current = false;
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
    }, 1100);
  }

  function exitQuiz() {
    if (timerInterval) clearInterval(timerInterval);
    quizActiveRef.current = false;
    setMode(null);
  }

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  // ───── MOD SEÇİM EKRANI ─────
  if (!mode) {
    return (
      <div className="quiz-selection-page">
        <h2 className="section-title">ydt<span>focus</span> Quiz</h2>
        <div className="quiz-modes-list">
          <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("hybrid")}>
            <div className="quiz-mode-title">Karma Tur</div>
            <p className="quiz-mode-desc">Hataların ve öğrendiğin kelimelerden oluşan dinamik bir seri</p>
          </button>
          <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("mistakes")}>
            <div className="quiz-mode-title">Hatalar Testi</div>
            <p className="quiz-mode-desc">Yanlış bildiklerini tekrar et ve bankadan temizle</p>
          </button>
        </div>
        <p className="hint-text" style={{ textAlign: "center", marginTop: 20 }}>Bankanda {words.length} kelime var</p>

        <style jsx>{`
          .quiz-selection-page { max-width: 500px; margin: 40px auto; }
          .section-title { text-align: center; margin-bottom: 32px; }
          .section-title span { color: var(--accent); }
          .quiz-modes-list { display: flex; flex-direction: column; gap: 14px; }
          .quiz-mode-btn {
            text-align: left; width: 100%;
            padding: 22px 24px; border: 1px solid var(--border); border-radius: 18px;
            transition: all 0.2s; background: var(--bg-card);
          }
          .quiz-mode-btn:hover { border-color: var(--accent); transform: translateY(-2px); }
          .quiz-mode-title { font-size: 1.05rem; font-weight: 800; margin-bottom: 4px; color: var(--text); }
          .quiz-mode-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
        `}</style>
      </div>
    );
  }

  // ───── SONUÇ EKRANI ─────
  if (finished) {
    const total = score.correct + score.wrong;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    const wrongAnswers = results.filter(r => !r.isCorrect);

    return (
      <div className="result-page">
        <div className="glass-card result-card">
          <div className="result-header">
            <div className="result-score-circle">%{pct}</div>
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
          .result-page { max-width: 500px; margin: 0 auto; animation: fadeIn 0.5s ease-out; }
          .result-card { padding: 40px; text-align: center; }
          .result-header { margin-bottom: 32px; }
          .result-score-circle {
            width: 88px; height: 88px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
            background: var(--glass); border: 2px solid var(--accent);
            font-size: 1.3rem; font-weight: 900; color: var(--accent);
          }
          .result-title { font-size: 1.8rem; font-weight: 900; margin-bottom: 8px; letter-spacing: -1px; }
          .result-subtitle { color: var(--text-muted); font-size: 1rem; }
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

  // ───── AKTİF SORU EKRANI ─────
  const q = questions[qIdx];

  return (
    <div className="quiz-run-page">
      <div className="quiz-run-top">
        <button className="quiz-run-close" onClick={exitQuiz}>Kapat</button>
        <div className="quiz-run-dots">
          {questions.map((_, i) => (
            <span key={i} className={`quiz-run-dot ${i < qIdx ? "done" : ""} ${i === qIdx ? "current" : ""}`}></span>
          ))}
        </div>
        <span className="quiz-run-timer">{formatTime(timer)}</span>
      </div>

      <div className="quiz-run-body">
        <div className="quiz-run-word">{q.word}</div>
        <div className="quiz-run-options">
          {q.options.map((opt, oi) => {
            let cls = "quiz-run-opt";
            if (answered !== null) {
              if (opt.correct) cls += " correct";
              else if (oi === answered) cls += " wrong";
            }
            return (
              <button key={oi} className={cls} onClick={() => handleAnswer(oi)} disabled={answered !== null}>
                <span className="quiz-run-opt-letter">{String.fromCharCode(65 + oi)}</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .quiz-run-page { max-width: 560px; margin: 0 auto; }
        .quiz-run-top {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 0;
          margin-bottom: 40px;
        }
        .quiz-run-close {
          background: none; border: none; color: var(--text-muted);
          font-size: 0.85rem; font-weight: 700; cursor: pointer; flex-shrink: 0;
        }
        .quiz-run-close:hover { color: var(--text); }
        .quiz-run-dots {
          flex: 1;
          display: flex;
          gap: 4px;
          overflow-x: auto;
        }
        .quiz-run-dot {
          flex: 1;
          min-width: 6px;
          height: 4px;
          border-radius: 4px;
          background: var(--glass);
        }
        .quiz-run-dot.done { background: var(--text-muted); }
        .quiz-run-dot.current { background: var(--accent); }
        .quiz-run-timer {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          flex-shrink: 0;
        }
        .quiz-run-body { text-align: center; }
        .quiz-run-word {
          font-size: 24px;
          font-weight: 800;
          color: var(--text);
          margin-bottom: 32px;
        }
        .quiz-run-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .quiz-run-opt {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 16px 18px;
          text-align: left;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text);
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .quiz-run-opt:hover:not(:disabled) { border-color: var(--accent); }
        .quiz-run-opt:disabled { cursor: default; }
        .quiz-run-opt-letter {
          width: 26px;
          height: 26px;
          border-radius: 8px;
          background: var(--glass);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.75rem;
          flex-shrink: 0;
        }
        .quiz-run-opt.correct {
          background: #30d158;
          border-color: #30d158;
          color: #06210f;
        }
        .quiz-run-opt.correct .quiz-run-opt-letter { background: rgba(0,0,0,0.15); color: #06210f; }
        .quiz-run-opt.wrong {
          background: #ff453a;
          border-color: #ff453a;
          color: #2a0503;
        }
        .quiz-run-opt.wrong .quiz-run-opt-letter { background: rgba(0,0,0,0.15); color: #2a0503; }

        @media (max-width: 640px) {
          .quiz-run-word { font-size: 22px; }
        }
      `}</style>
    </div>
  );
}
