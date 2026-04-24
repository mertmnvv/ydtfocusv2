"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, updateUserWord, updateUserStats } from "@/lib/firestore";
import Link from "next/link";

const LEVEL_INTERVALS = { 0: 1, 1: 3, 2: 7, 3: 14, 4: 30 };

const playAmbientSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    if (type === 'correct') {
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } else {
      osc.type = 'sine';
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {}
};

export default function SRSPage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [quizWords, setQuizWords] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState("loading");
  const [loading, setLoading] = useState(true);
  
  // Detailed Tracking
  const [answers, setAnswers] = useState([]); // {word, correctMeaning, userAnswer, isCorrect}
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  
  // Animation states
  const [selectedOption, setSelectedOption] = useState(null);
  const [isWrongShake, setIsWrongShake] = useState(false);
  const [showNextDelay, setShowNextDelay] = useState(false);

  useEffect(() => {
    if (user) {
      getUserWords(user.uid).then(all => {
        const wordList = all || [];
        setWords(wordList);
        
        const now = Date.now();
        const dueWords = wordList.filter(w => (w.nextReview || 0) <= now);
        
        if (dueWords.length === 0) {
          setPhase("no-due");
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
      playAmbientSound('correct');
    } else {
      playAmbientSound('wrong');
      setIsWrongShake(true);
      setTimeout(() => setIsWrongShake(false), 500);
    }
    
    setAnswers(prev => [...prev, { 
      word: target.word, 
      correctMeaning: target.meaning,
      userAnswer: option,
      isCorrect 
    }]);
    setShowNextDelay(true);

    // SRS Logic updates - 5 levels (0 to 4)
    let newLevel = target.level || 0;
    if (isCorrect) {
      newLevel = Math.min(4, newLevel + 1);
    } else {
      newLevel = 0; // Reset to 0 on wrong
    }
    const intervalDays = LEVEL_INTERVALS[newLevel] || 1;
    const nextReview = Date.now() + (intervalDays * 24 * 60 * 60 * 1000);

    await updateUserWord(user.uid, target.id, {
      level: newLevel,
      nextReview: nextReview,
      correctCount: (target.correctCount || 0) + (isCorrect ? 1 : 0),
      wrongCount: (target.wrongCount || 0) + (isCorrect ? 0 : 1),
    });

    setTimeout(async () => {
      setSelectedOption(null);
      setShowNextDelay(false);
      
      if (currentIdx + 1 < quizWords.length) {
        setCurrentIdx(prev => prev + 1);
      } else {
        setEndTime(Date.now());
        setPhase("result");
        const totalCorrects = correctCount + (isCorrect ? 1 : 0);
        await updateUserStats(user.uid, {
          correct: totalCorrects,
          wrong: quizWords.length - totalCorrects
        });
      }
    }, 1200);
  }

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (phase === "no-due") {
    return (
      <div className="minimal-setup-container">
        <div className="minimal-header">
          <h2 className="minimal-title">Akıllı Tekrar</h2>
          <Link href="/dashboard" className="minimal-link">Kapat</Link>
        </div>
        <div className="minimal-list-group mt-4">
          <div className="minimal-list-item" style={{justifyContent: 'center', textAlign: 'center', padding: '40px 20px', flexDirection: 'column'}}>
            <span className="minimal-item-title" style={{color: 'var(--text-muted)'}}>Bugünlük İşlem Yok</span>
            <span className="minimal-item-desc" style={{marginTop: 8}}>Tekrar etmen gereken kelimeleri tamamladın.</span>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "quiz") {
    const q = quizWords[currentIdx];
    return (
      <div className="minimal-quiz-container">
        <div className="minimal-q-top">
          <span className="minimal-q-count">{currentIdx + 1} / {quizWords.length}</span>
          <Link href="/dashboard" className="minimal-link">Sonlandır</Link>
        </div>
        
        <div className="minimal-q-progress">
          <div className="minimal-q-fill" style={{ width: `${((currentIdx + 1) / quizWords.length) * 100}%` }}></div>
        </div>
        
        <div className={`minimal-q-body ${isWrongShake ? "shake-animation" : ""}`}>
          <h1 className="minimal-q-word">{q.word}</h1>
          
          <div className="minimal-options-col">
            {q.options.map((opt, i) => {
              const isSelected = selectedOption === opt;
              const isCorrectAnswer = opt === q.meaning;
              
              let btnClass = "minimal-option-btn";
              if (showNextDelay) {
                if (isCorrectAnswer) btnClass += " opt-correct";
                else if (isSelected && !isCorrectAnswer) btnClass += " opt-wrong";
                else btnClass += " opt-disabled";
              }

              return (
                <button 
                  key={i} 
                  className={btnClass} 
                  onClick={() => handleAnswer(opt)}
                  disabled={showNextDelay}
                >
                  <span className="minimal-opt-text">{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  if (phase === "result") {
    const durationMs = (endTime || Date.now()) - startTime;
    const mins = Math.floor(durationMs / 60000);
    const secs = Math.floor((durationMs % 60000) / 1000);
    const timeStr = mins > 0 ? `${mins}dk ${secs}sn` : `${secs}sn`;
    
    const total = quizWords.length;
    const accuracy = Math.round((correctCount / total) * 100);
    const wrongAnswers = answers.filter(a => !a.isCorrect);

    return (
      <div className="minimal-result-container">
        <h1 className="minimal-result-title">Akıllı Tekrar Raporu</h1>
        
        <div className="minimal-result-stats">
          <div className="minimal-stat-box">
            <span className="minimal-stat-label">Süre</span>
            <span className="minimal-stat-val">{timeStr}</span>
          </div>
          <div className="minimal-stat-box">
            <span className="minimal-stat-label">Başarı</span>
            <span className="minimal-stat-val">% {accuracy}</span>
          </div>
          <div className="minimal-stat-box">
            <span className="minimal-stat-label" style={{color: "#30d158"}}>Doğru</span>
            <span className="minimal-stat-val">{correctCount}</span>
          </div>
          <div className="minimal-stat-box">
            <span className="minimal-stat-label" style={{color: "#ff375f"}}>Yanlış</span>
            <span className="minimal-stat-val">{total - correctCount}</span>
          </div>
        </div>

        {wrongAnswers.length > 0 && (
          <div className="minimal-mistakes-section">
            <h3 className="minimal-mistakes-title">Seviyesi Düşenler (Hatalar)</h3>
            <div className="minimal-mistakes-list">
              {wrongAnswers.map((w, i) => (
                <div key={i} className="minimal-mistake-item">
                  <div className="minimal-mistake-word">{w.word}</div>
                  <div className="minimal-mistake-details">
                    <span className="mistake-wrong-ans">{w.userAnswer}</span>
                    <span className="mistake-arrow">→</span>
                    <span className="mistake-correct-ans">{w.correctMeaning}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link href="/dashboard" className="minimal-btn-full mt-4" style={{display: 'block', textAlign: 'center'}}>Merkeze Dön</Link>
      </div>
    );
  }

  return null;
}
