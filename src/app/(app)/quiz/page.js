"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserMistakes, updateUserMistakes } from "@/lib/firestore";

export default function QuizPage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null); // null=seçim, "smart", "bank", "flash"
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [answered, setAnswered] = useState(null);
  const [results, setResults] = useState([]); // Her sorunun sonucu
  const [finished, setFinished] = useState(false);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  // Flash card state
  const [flashIdx, setFlashIdx] = useState(0);
  const [flashFlipped, setFlashFlipped] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserWords(user.uid).then(w => { setWords(w || []); setLoading(false); }).catch(console.error);
  }, [user]);

  async function addMistakeToUser(word) {
    try {
      const mistakes = await getUserMistakes(user.uid);
      if (!mistakes.includes(word)) {
        await updateUserMistakes(user.uid, [...mistakes, word]);
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
    if (words.length < 4) return alert("En az 4 kelime gerekli!");
    setMode(selectedMode);
    setQIdx(0);
    setScore({ correct: 0, wrong: 0 });
    setAnswered(null);
    setResults([]);
    setFinished(false);
    setTimer(0);

    if (selectedMode === "flash") {
      setFlashIdx(0);
      setFlashFlipped(false);
      return;
    }

    // Soru üret
    const pool = [...words].sort(() => Math.random() - 0.5);
    const count = Math.min(pool.length, 20);
    const qs = [];

    for (let i = 0; i < count; i++) {
      const correct = pool[i];
      const others = words.filter(w => w.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [...others.map(o => ({ text: o.meaning, correct: false })), { text: correct.meaning, correct: true }]
        .sort(() => Math.random() - 0.5);
      qs.push({ word: correct.word, correctMeaning: correct.meaning, options, wordId: correct.id });
    }

    setQuestions(qs);
  }

  // Cevap ver
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
    } else {
      setScore(prev => ({ ...prev, wrong: prev.wrong + 1 }));
      addMistakeToUser(q.word);
    }

    // Sonraki soruya geç
    setTimeout(() => {
      if (qIdx + 1 < questions.length) {
        setQIdx(prev => prev + 1);
        setAnswered(null);
      } else {
        setFinished(true);
        if (timerInterval) clearInterval(timerInterval);
      }
    }, 800);
  }

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  // MOD SEÇİMİ
  if (!mode) {
    return (
      <div>
        <h2 className="section-title">Quiz</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 600, margin: "0 auto" }}>
          <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("smart")}>
            <div className="quiz-mode-title">Akıllı Tekrar</div>
            <p className="quiz-mode-desc">Spaced repetition algoritması ile öğrenme</p>
          </button>
          <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("bank")}>
            <div className="quiz-mode-title">Banka Testi</div>
            <p className="quiz-mode-desc">Tüm kelime bankandan rastgele sorular</p>
          </button>
          <button className="glass-card quiz-mode-btn" onClick={() => startQuiz("flash")}>
            <div className="quiz-mode-title">Flash Cards</div>
            <p className="quiz-mode-desc">Kartları çevirerek hızlı tekrar</p>
          </button>
        </div>
        <p className="hint-text" style={{ textAlign: "center", marginTop: 20 }}>
          Bankanda {words.length} kelime var
        </p>
      </div>
    );
  }

  // FLASH CARDS
  if (mode === "flash") {
    if (words.length === 0) return <p className="hint-text" style={{ textAlign: "center", padding: 40 }}>Bankanız boş.</p>;
    const card = words[flashIdx % words.length];
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", textAlign: "center" }}>
        <div className="header-split" style={{ marginBottom: 20 }}>
          <button className="btn-ghost" onClick={() => setMode(null)}>Geri</button>
          <span className="hint-text">{flashIdx + 1} / {words.length}</span>
        </div>
        <div className="flash-scene" onClick={() => setFlashFlipped(!flashFlipped)}>
          <div className={`flash-card-inner ${flashFlipped ? "flipped" : ""}`}>
            <div className="flash-front">
              <h2>{card.word}</h2>
              <span className="flash-hint">tap to flip</span>
            </div>
            <div className="flash-back">
              <h3>{card.meaning}</h3>
              {card.syn && card.syn !== "-" && <p className="flash-syn">{card.syn}</p>}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
          <button className="btn-ghost" style={{ flex: 1 }}
            onClick={() => { setFlashIdx(Math.max(0, flashIdx - 1)); setFlashFlipped(false); }}>
            Önceki
          </button>
          <button className="btn-primary" style={{ flex: 1 }}
            onClick={() => { setFlashIdx(flashIdx + 1); setFlashFlipped(false); }}>
            Sonraki
          </button>
        </div>
      </div>
    );
  }

  // SONUÇ EKRANI
  if (finished) {
    const total = score.correct + score.wrong;
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0;
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="glass-card" style={{ textAlign: "center", padding: 40 }}>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: 8 }}>Sonuçlar</h2>
          <p className="hint-text">{formatTime(timer)} sürdü</p>

          <div className="dash-stats-grid" style={{ margin: "24px 0" }}>
            <div className="dash-stat-card">
              <div className="dash-stat-value" style={{ color: "var(--primary)" }}>{score.correct}</div>
              <div className="dash-stat-label">Doğru</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-value" style={{ color: "var(--error)" }}>{score.wrong}</div>
              <div className="dash-stat-label">Yanlış</div>
            </div>
            <div className="dash-stat-card">
              <div className="dash-stat-value" style={{ color: "var(--accent)" }}>%{pct}</div>
              <div className="dash-stat-label">Başarı</div>
            </div>
          </div>

          {/* Hata Listesi */}
          {results.filter(r => !r.isCorrect).length > 0 && (
            <div style={{ textAlign: "left", marginTop: 20 }}>
              <h4 style={{ color: "var(--error)", marginBottom: 12 }}>Hatalar</h4>
              {results.filter(r => !r.isCorrect).map((r, i) => (
                <div key={i} style={{
                  padding: 12, background: "rgba(255,69,58,0.05)", border: "1px solid rgba(255,69,58,0.15)",
                  borderRadius: 12, marginBottom: 8,
                }}>
                  <b>{r.word}</b> → {r.correctMeaning}
                  <span style={{ color: "var(--error)", marginLeft: 8, fontSize: "0.85rem" }}>
                    (seçtiğin: {r.selectedMeaning})
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <button className="btn-ghost" style={{ flex: 1 }} onClick={() => setMode(null)}>Geri Dön</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => startQuiz(mode)}>Tekrar</button>
          </div>
        </div>
      </div>
    );
  }

  // SİMÜLASYON FORMATI — Tek soru gösterimi
  const q = questions[qIdx];
  if (!q) return null;

  return (
    <div className="quiz-sim">
      {/* Üst Bar */}
      <div className="quiz-sim-bar">
        <button className="btn-ghost quiz-sim-exit" onClick={() => { if (timerInterval) clearInterval(timerInterval); setMode(null); }}>
          Çık
        </button>
        <div className="quiz-sim-progress">
          <div className="quiz-sim-progress-fill" style={{ width: `${((qIdx + 1) / questions.length) * 100}%` }}></div>
        </div>
        <span className="quiz-sim-timer">{formatTime(timer)}</span>
        <span className="quiz-sim-counter">{qIdx + 1}/{questions.length}</span>
      </div>

      {/* Soru */}
      <div className="quiz-sim-body">
        <div className="quiz-sim-word">{q.word}</div>

        <div className="quiz-sim-options">
          {q.options.map((opt, oi) => {
            let cls = "quiz-sim-opt";
            if (answered !== null) {
              if (opt.correct) cls += " correct-ans";
              else if (oi === answered && !opt.correct) cls += " wrong-ans";
            }
            return (
              <button key={oi} className={cls} onClick={() => handleAnswer(oi)} disabled={answered !== null}>
                <span className="quiz-sim-opt-letter">{String.fromCharCode(65 + oi)}</span>
                {opt.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
