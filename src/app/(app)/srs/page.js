"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, updateUserWord, updateUserStats, refreshUserStreak } from "@/lib/firestore";
import Link from "next/link";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";

const LEVEL_INTERVALS = { 0: 1, 1: 3, 2: 7, 3: 14, 4: 30 };

export default function SRSPage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
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

  const scrollRef = useRef(null);

  useEffect(() => {
    if (user) {
      getUserWords(user.uid).then(all => {
        const wordList = all || [];
        setWords(wordList);
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
    const others = all.filter(w => w.id !== target.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const opts = [target.meaning, ...others.map(o => o.meaning)];
    while(opts.length < 4) opts.push("---");
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
        const nextIdx = currentIdx + 1;
        setSelectedOption(null);
        setShowNextDelay(false);
        setCurrentIdx(nextIdx);
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ top: scrollRef.current.offsetHeight * nextIdx, behavior: "smooth" });
        }
      } else {
        setEndTime(Date.now());
        setPhase("result");
        refreshUserStreak(user.uid).catch(console.error);
        const totalCorrects = correctCount + (isCorrect ? 1 : 0);
        await updateUserStats(user.uid, { correct: totalCorrects, wrong: quizWords.length - totalCorrects });
      }
    }, 1200);
  }

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (phase === "no-due") {
    return (
      <div className="glass-card" style={{ maxWidth: 500, margin: "100px auto", padding: 40, textAlign: "center" }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 16 }}>Akıllı Tekrar</h2>
        <p className="hint-text" style={{ fontSize: "1.1rem", marginBottom: 32 }}>Şu an tekrar etmen gereken bir kelime yok. Harika gidiyorsun!</p>
        <Link href="/dashboard" className="btn-primary" style={{ display: "inline-block", padding: "12px 32px" }}>Merkeze Dön</Link>
      </div>
    );
  }

  if (phase === "quiz") {
    return (
      <div className="quiz-sim">
        <div className="quiz-sim-bar">
          <Link href="/dashboard" className="quiz-exit-icon">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </Link>
          <div className="quiz-sim-progress">
            <div className="quiz-sim-progress-fill" style={{ width: `${((currentIdx + 1) / quizWords.length) * 100}%` }}></div>
          </div>
          <span className="quiz-sim-counter">{currentIdx + 1} / {quizWords.length}</span>
        </div>

        <div className="quiz-scroll-container" ref={scrollRef}>
          {quizWords.map((q, idx) => (
            <div key={idx} className={`quiz-slide ${idx === currentIdx ? "active" : ""}`}>
              <div className="quiz-sim-body">
                <div className="quiz-sim-word">{q.word}</div>
                <div className="quiz-sim-options">
                  {q.options.map((opt, i) => {
                    const isSelected = selectedOption === opt;
                    const isCorrectAnswer = opt === q.meaning;
                    let cls = "quiz-sim-opt";
                    if (idx === currentIdx && showNextDelay) {
                      if (isCorrectAnswer) cls += " correct-ans flash-success";
                      else if (isSelected && !isCorrectAnswer) cls += " wrong-ans shake-error";
                    }
                    return (
                      <button key={i} className={cls} onClick={() => handleAnswer(opt)} disabled={idx !== currentIdx || showNextDelay}>
                        <span className="quiz-sim-opt-letter">{String.fromCharCode(65 + i)}</span>
                        {opt}
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

  if (phase === "result") {
    const durationMs = (endTime || Date.now()) - startTime;
    const mins = Math.floor(durationMs / 60000);
    const secs = Math.floor((durationMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
    const accuracy = Math.round((correctCount / quizWords.length) * 100);
    const wrongAnswers = answers.filter(a => !a.isCorrect);

    return (
      <div className="result-page">
        <div className="glass-card result-card">
          <div className="result-header">
            <div className="result-icon-circle">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <h2 className="result-title">Tekrar Tamamlandı!</h2>
            <p className="result-subtitle">{timeStr} sürede zihnini tazeledin</p>
          </div>

          <div className="result-stats-grid">
            <div className="res-stat-card success"><div className="res-stat-val">{correctCount}</div><div className="res-stat-label">Hatırlandı</div></div>
            <div className="res-stat-card error"><div className="res-stat-val">{quizWords.length - correctCount}</div><div className="res-stat-label">Unutuldu</div></div>
            <div className="res-stat-card accent"><div className="res-stat-val">%{accuracy}</div><div className="res-stat-label">Başarı</div></div>
          </div>

          {wrongAnswers.length > 0 && (
            <div className="result-mistakes">
              <h4 className="mistakes-title">Zayıf Halkalar</h4>
              <div className="mistakes-list">
                {wrongAnswers.slice(0, 5).map((w, i) => (
                  <div key={i} className="mistake-item">
                    <span className="mistake-word">{w.word}</span><span className="mistake-arrow">→</span><span className="mistake-meaning">{w.correctMeaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="result-actions">
            <Link href="/dashboard" className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: 16 }}>Merkeze Dön</Link>
          </div>
        </div>

        <style jsx>{`
          .result-page { max-width: 600px; margin: 0 auto; animation: fadeIn 0.5s ease-out; }
          .result-card { padding: 40px; text-align: center; }
          .result-header { margin-bottom: 32px; }
          .result-icon-circle {
            width: 80px; height: 80px; background: rgba(48, 209, 88, 0.1); border-radius: 50%;
            display: flex; align-items: center; justify-content: center; color: #30d158;
            margin: 0 auto 20px; border: 1px solid rgba(48, 209, 88, 0.2);
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
          .result-actions { display: flex; gap: 16px; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>
      </div>
    );
  }

  return null;
}
