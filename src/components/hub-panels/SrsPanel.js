"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, updateUserWord, updateUserStats, refreshUserStreak } from "@/lib/firestore";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";

const FALLBACK_DISTRACTORS = [
  "vurgulamak", "anlamına gelmek", "iddia etmek", "kolaylaştırmak", "engellemek",
  "katkıda bulunmak", "sürdürmek", "meydana gelmek", "farklılık göstermek", "başarmak",
  "etkilemek", "belirlemek", "ortaya çıkmak", "geliştirmek", "fark etmek",
  "reddetmek", "kabul etmek", "yönetmek", "incelemek", "oluşturmak",
  "kaçınmak", "sağlamak", "önlemek", "tanımlamak", "kanıtlamak"
];

const LEVEL_INTERVALS = [0.5, 1, 3, 7, 15]; // Gün cinsinden tekrar aralıkları (Level 0-4)

export default function SrsPanel({ onClose }) {
  const { user } = useAuth();
  const [quizWords, setQuizWords] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [loading, setLoading] = useState(true);

  const [answers, setAnswers] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);

  const [selectedOption, setSelectedOption] = useState(null);
  const [showNextDelay, setShowNextDelay] = useState(false);

  useEffect(() => {
    if (user) {
      getUserWords(user.uid).then(all => {
        const wordList = all || [];
        const now = Date.now();
        const dueWords = wordList.filter(w => (w.nextReview || 0) <= now);

        if (dueWords.length === 0) {
          setPhase("no-due");
          refreshUserStreak(user.uid).catch(console.error);
          setLoading(false);
        } else {
          const selected = dueWords.sort(() => Math.random() - 0.5);
          setQuizWords(selected.map(w => ({
            ...w,
            options: generateOptions(w, wordList)
          })));
          setPhase("quiz");
          setStartTime(Date.now());
          setLoading(false);
        }
      });
    }
  }, [user]);

  function generateOptions(target, all) {
    const others = all.filter(w => w.id !== target.id && w.meaning !== target.meaning);
    const selectedOthers = others.sort(() => Math.random() - 0.5).slice(0, 3);

    let opts = [target.meaning, ...selectedOthers.map(o => o.meaning)];

    if (opts.length < 4) {
      const needed = 4 - opts.length;
      const filteredFallbacks = FALLBACK_DISTRACTORS.filter(f => !opts.includes(f));
      const fallbacks = filteredFallbacks.sort(() => Math.random() - 0.5).slice(0, needed);
      opts = [...opts, ...fallbacks];
    }
    while (opts.length < 4) opts.push("belirlemek");

    return opts.sort(() => Math.random() - 0.5);
  }

  async function handleAnswer(option) {
    if (showNextDelay) return;
    const target = quizWords[currentIdx];
    const isCorrect = option === target.meaning;
    setSelectedOption(option);

    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      playSuccessSound();
    } else {
      playErrorSound();
    }

    setAnswers(prev => [...prev, { word: target.word, correctMeaning: target.meaning, userAnswer: option, isCorrect }]);
    setShowNextDelay(true);

    let newLevel = target.level || 0;
    if (isCorrect) newLevel = Math.min(4, newLevel + 1); else newLevel = 0;
    const nextReview = Date.now() + (LEVEL_INTERVALS[newLevel] * 24 * 60 * 60 * 1000);

    await updateUserWord(user.uid, target.id, {
      level: newLevel,
      nextReview: nextReview,
      correctCount: (target.correctCount || 0) + (isCorrect ? 1 : 0),
      wrongCount: (target.wrongCount || 0) + (isCorrect ? 0 : 1),
    });

    setTimeout(async () => {
      if (currentIdx + 1 < quizWords.length) {
        setSelectedOption(null);
        setShowNextDelay(false);
        setCurrentIdx(prev => prev + 1);
      } else {
        const finalCorrectCount = correctCount + (isCorrect ? 1 : 0);
        const finalWrongCount = quizWords.length - finalCorrectCount;

        if (isCorrect) setCorrectCount(finalCorrectCount);
        setEndTime(Date.now());

        try {
          await updateUserStats(user.uid, {
            correct: finalCorrectCount,
            wrong: finalWrongCount
          });
          await refreshUserStreak(user.uid);
        } catch (err) {
          console.error("Stats update failed:", err);
        }

        setPhase("result");
      }
    }, 1200);
  }

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (phase === "no-due") {
    return (
      <div className="srs-empty-page">
        <div className="srs-empty-card">
          <h2>Akıllı Tekrar</h2>
          <p className="hint-text">Şu an tekrar etmen gereken bir kelime yok. Harika gidiyorsun!</p>
          <button className="btn-primary" onClick={onClose}>Okumaya Dön</button>
        </div>
        <style jsx>{`
          .srs-empty-page { display: flex; align-items: center; justify-content: center; min-height: 40vh; padding: 20px 0; }
          .srs-empty-card { max-width: 440px; width: 100%; padding: 40px; text-align: center; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; }
          .srs-empty-card h2 { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; color: var(--text); }
          .srs-empty-card p { margin-bottom: 24px; }
          .srs-empty-card :global(.btn-primary) { display: inline-block; padding: 14px 32px; border: none; cursor: pointer; }
        `}</style>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = quizWords[currentIdx];
    return (
      <div className="srs-run-page">
        <div className="srs-run-top">
          <button className="srs-run-close" onClick={onClose}>Kapat</button>
          <div className="srs-run-dots">
            {quizWords.map((_, i) => (
              <span key={i} className={`srs-run-dot ${i < currentIdx ? "done" : ""} ${i === currentIdx ? "current" : ""}`}></span>
            ))}
          </div>
        </div>

        <div className="srs-run-body">
          <div className="srs-run-word">{q.word}</div>
          <div className="srs-run-options">
            {q.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isCorrectAnswer = opt === q.meaning;
              let cls = "srs-run-opt";
              if (showNextDelay) {
                if (isCorrectAnswer) cls += " correct";
                else if (isSelected) cls += " wrong";
              }
              return (
                <button key={i} className={cls} onClick={() => handleAnswer(opt)} disabled={showNextDelay}>
                  <span className="srs-run-opt-letter">{String.fromCharCode(65 + i)}</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <style jsx>{`
          .srs-run-page { max-width: 560px; margin: 0 auto; }
          .srs-run-top { display: flex; align-items: center; gap: 16px; padding: 4px 0; margin-bottom: 40px; }
          .srs-run-close { background: none; border: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 700; cursor: pointer; flex-shrink: 0; }
          .srs-run-close:hover { color: var(--text); }
          .srs-run-dots { flex: 1; display: flex; gap: 4px; overflow-x: auto; }
          .srs-run-dot { flex: 1; min-width: 6px; height: 4px; border-radius: 4px; background: var(--glass); }
          .srs-run-dot.done { background: var(--text-muted); }
          .srs-run-dot.current { background: var(--accent); }
          .srs-run-body { text-align: center; }
          .srs-run-word { font-size: 24px; font-weight: 800; color: var(--text); margin-bottom: 32px; }
          .srs-run-options { display: flex; flex-direction: column; gap: 10px; }
          .srs-run-opt {
            display: flex; align-items: center; gap: 14px; width: 100%; background: var(--bg-card);
            border: 1px solid var(--border); border-radius: 12px; padding: 16px 18px; text-align: left;
            font-size: 0.95rem; font-weight: 600; color: var(--text); cursor: pointer; transition: border-color 0.15s;
          }
          .srs-run-opt:hover:not(:disabled) { border-color: var(--accent); }
          .srs-run-opt:disabled { cursor: default; }
          .srs-run-opt-letter { width: 26px; height: 26px; border-radius: 8px; background: var(--glass); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; flex-shrink: 0; }
          .srs-run-opt.correct { background: #30d158; border-color: #30d158; color: #06210f; }
          .srs-run-opt.correct .srs-run-opt-letter { background: rgba(0,0,0,0.15); color: #06210f; }
          .srs-run-opt.wrong { background: #ff453a; border-color: #ff453a; color: #2a0503; }
          .srs-run-opt.wrong .srs-run-opt-letter { background: rgba(0,0,0,0.15); color: #2a0503; }
        `}</style>
      </div>
    );
  }

  if (phase === "result") {
    const durationMs = (endTime || Date.now()) - startTime;
    const mins = Math.floor(durationMs / 60000);
    const secs = Math.floor((durationMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
    const accuracy = Math.round((correctCount / quizWords.length) * 100);
    const wrongAnswers = answers.filter(a => !a.isCorrect);

    return (
      <div className="srs-result-page">
        <div className="srs-result-card">
          <div className="srs-result-score-circle">%{accuracy}</div>
          <h2 className="srs-result-title">Tekrar Tamamlandı!</h2>
          <p className="srs-result-subtitle">{timeStr} sürede zihnini tazeledin</p>

          <div className="srs-result-stats">
            <div className="srs-stat success"><div className="srs-stat-val">{correctCount}</div><div className="srs-stat-label">Hatırlandı</div></div>
            <div className="srs-stat error"><div className="srs-stat-val">{quizWords.length - correctCount}</div><div className="srs-stat-label">Unutuldu</div></div>
            <div className="srs-stat accent"><div className="srs-stat-val">%{accuracy}</div><div className="srs-stat-label">Başarı</div></div>
          </div>

          {wrongAnswers.length > 0 && (
            <div className="srs-result-mistakes">
              <h4>Zayıf Halkalar</h4>
              <div className="srs-mistakes-list">
                {wrongAnswers.slice(0, 5).map((w, i) => (
                  <div key={i} className="srs-mistake-item">
                    <span className="srs-mistake-word">{w.word}</span>
                    <span className="srs-mistake-arrow">→</span>
                    <span className="srs-mistake-meaning">{w.correctMeaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="srs-result-cta" onClick={onClose}>Okumaya Dön</button>
        </div>

        <style jsx>{`
          .srs-result-page { max-width: 500px; margin: 0 auto; }
          .srs-result-card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; padding: 40px; text-align: center; }
          .srs-result-score-circle {
            width: 88px; height: 88px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px; background: var(--glass); border: 2px solid var(--accent); font-size: 1.3rem; font-weight: 900; color: var(--accent);
          }
          .srs-result-title { font-size: 1.6rem; font-weight: 900; margin-bottom: 8px; letter-spacing: -1px; color: var(--text); }
          .srs-result-subtitle { color: var(--text-muted); font-size: 0.95rem; margin-bottom: 32px; }
          .srs-result-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
          .srs-stat { background: var(--glass); border: 1px solid var(--border); border-radius: 16px; padding: 16px 8px; }
          .srs-stat-val { font-size: 1.5rem; font-weight: 900; margin-bottom: 2px; }
          .srs-stat.success .srs-stat-val { color: var(--primary); }
          .srs-stat.error .srs-stat-val { color: var(--error); }
          .srs-stat.accent .srs-stat-val { color: var(--accent); }
          .srs-stat-label { font-size: 0.72rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
          .srs-result-mistakes { text-align: left; background: rgba(0,0,0,0.15); border-radius: 16px; padding: 20px; margin-bottom: 28px; }
          .srs-result-mistakes h4 { font-weight: 800; margin-bottom: 14px; color: var(--error); font-size: 0.9rem; }
          .srs-mistake-item { display: flex; gap: 10px; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.88rem; }
          .srs-mistake-item:last-child { border-bottom: none; }
          .srs-mistake-word { font-weight: 700; min-width: 90px; color: var(--text); }
          .srs-mistake-arrow { color: var(--text-muted); }
          .srs-mistake-meaning { color: var(--primary); }
          .srs-result-cta { display: block; width: 100%; padding: 15px; background: var(--accent); color: #000; font-weight: 800; border-radius: 14px; border: none; cursor: pointer; font-family: var(--font); font-size: 0.95rem; }
        `}</style>
      </div>
    );
  }

  return null;
}
