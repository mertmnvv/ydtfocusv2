"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserHeroStats, updateUserHeroStats, addUserWord, getUserWords } from "@/lib/firestore";

const LEVEL_COLORS = { A1: "#30d158", A2: "#32ade6", B1: "#ff9f0a", B2: "#ff375f", C1: "#bf5af2" };

export default function HeroPage() {
  const { user, requireAuth } = useAuth();
  const [heroStats, setHeroStats] = useState(null);
  const [heroWords, setHeroWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("roadmap"); // roadmap | lesson | quiz | boss | result
  const [currentLevel, setCurrentLevel] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonWords, setLessonWords] = useState([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [bossScore, setBossScore] = useState(0);
  const [bossAnswers, setBossAnswers] = useState({});
  const [bossQuestions, setBossQuestions] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [showBank, setShowBank] = useState(false);

  useEffect(() => {
    if (!user) {
      setHeroStats({
        A1: { completed: 0, required: 5, unlocked: true, next: "A2" },
        A2: { completed: 0, required: 5, unlocked: false, next: "B1" },
        B1: { completed: 0, required: 5, unlocked: false, next: "B2" },
        B2: { completed: 0, required: 5, unlocked: false, next: "C1" },
        C1: { completed: 0, required: 5, unlocked: false, next: null },
      });
      setHeroWords([]);
      setLoading(false);
      return;
    }
    loadHero();
  }, [user]);

  async function loadHero() {
    try {
      const data = await getUserHeroStats(user.uid);
      setHeroStats(data.levels);
      setHeroWords(data.heroWords || []);
    } catch (err) {
      console.error("Hero yükleme hatası:", err);
    }
    setLoading(false);
  }

  // Seviye dersi başlat
  function startLevel(level) {
    requireAuth(async () => {
      if (!heroStats[level].unlocked) return alert("Bu seviye kilitli!");
      setCurrentLevel(level);
      const stats = heroStats[level];

      // Boss fight gerekli mi?
      if (stats.completed >= stats.required && stats.next && !heroStats[stats.next]?.unlocked) {
        startBossFight(level);
        return;
      }
      if (stats.completed >= stats.required && (!stats.next || heroStats[stats.next]?.unlocked)) {
        return alert("Bu seviyeyi zaten tamamladın!");
      }

      setGenerating(true);
      setPhase("lesson");
      setLessonContent("");
      setLessonWords([]);
      setQuizScore(0);
      setQuizAnswers({});

      // AI'dan ders üret
    const sampleWords = ["achieve", "approach", "benefit", "challenge", "contribute", "determine", "establish", "maintain", "significant", "strategy"];
    const levelWords = sampleWords.sort(() => 0.5 - Math.random()).slice(0, 5).map(w => ({
      word: w, meaning: "—"
    }));

    const wordList = levelWords.map(w => w.word).join(", ");
    const prompt = `You are the 'Zero to Hero' English Teacher. Level: ${level} CEFR.
Task: Write an engaging 4-5 sentence paragraph using these words: ${wordList}. 
Then write a short 3-line dialogue using the same words.
Finally add a "Vocabulary Review" section listing each word with a simple definition.
No markdown. No asterisks. Level-appropriate grammar only.`;

    try {
      const resp = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.55, max_tokens: 800,
        }),
      });
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content?.replace(/\*/g, "").trim() || "İçerik yüklenemedi.";
      setLessonContent(text);

      // Çevirileri çek
      const translated = await Promise.all(
        levelWords.map(async w => {
          try {
            const tr = await fetch("/api/translate", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ word: w.word }),
            });
            const d = await tr.json();
            return { word: w.word, meaning: d.tr || "—" };
          } catch { return { word: w.word, meaning: "—" }; }
        })
      );
      setLessonWords(translated);
    } catch {
      setLessonContent("Bağlantı hatası oluştu. Lütfen tekrar deneyin.");
      }
      setGenerating(false);
    });
  }

  // Mini quiz cevaplama
  function answerMiniQuiz(qIndex, selected, correct) {
    if (quizAnswers[qIndex] !== undefined) return;
    const isCorrect = selected === correct;
    setQuizAnswers(prev => ({ ...prev, [qIndex]: selected }));
    if (isCorrect) setQuizScore(prev => prev + 1);
  }

  // Dersi tamamla
  async function completeLesson() {
    // Kelimeleri hero çantasına ekle
    const newHeroWords = [...heroWords];
    lessonWords.forEach(w => {
      if (!newHeroWords.some(hw => hw.word?.toLowerCase() === w.word?.toLowerCase())) {
        newHeroWords.push({ word: w.word, meaning: w.meaning, level: currentLevel, addedDate: Date.now() });
      }
    });
    setHeroWords(newHeroWords);

    // Stats güncelle
    const newStats = { ...heroStats };
    newStats[currentLevel].completed += 1;
    setHeroStats(newStats);

    await updateUserHeroStats(user.uid, { levels: newStats, heroWords: newHeroWords });

    if (newStats[currentLevel].completed >= newStats[currentLevel].required) {
      alert(`${currentLevel} derslerini bitirdin! Şimdi Boss Fight zamanı!`);
    } else {
      alert("Ders tamamlandı! Kelimeler Hero Çantasına eklendi.");
    }
    setPhase("roadmap");
  }

  // Boss Fight
  function startBossFight(level) {
    setCurrentLevel(level);
    setBossScore(0);
    setBossAnswers({});
    const learnedInLevel = heroWords.filter(w => w.level === level);
    if (learnedInLevel.length < 10) {
      alert("Boss Fight için en az 10 kelime gerekli!");
      return;
    }
    const questions = learnedInLevel.sort(() => 0.5 - Math.random()).slice(0, 10);
    setBossQuestions(questions);
    setPhase("boss");
  }

  function answerBoss(qIndex, selected, correct) {
    if (bossAnswers[qIndex] !== undefined) return;
    const isCorrect = selected === correct;
    setBossAnswers(prev => ({ ...prev, [qIndex]: selected }));
    if (isCorrect) setBossScore(prev => prev + 1);
  }

  async function completeBoss() {
    if (bossScore >= 8) {
      const newStats = { ...heroStats };
      const nextLevel = newStats[currentLevel].next;
      if (nextLevel && newStats[nextLevel]) {
        newStats[nextLevel].unlocked = true;
        setHeroStats(newStats);
        await updateUserHeroStats(user.uid, { levels: newStats, heroWords });
      }
      alert(`${bossScore}/10 — Yeni seviye açıldı!`);
    } else {
      alert(`${bossScore}/10 — En az 8 doğru gerekli. Tekrar dene!`);
    }
    setPhase("roadmap");
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Hero yükleniyor...</p></div>;
  }

  if (!heroStats) return null;

  // Boss Fight Ekranı
  if (phase === "boss") {
    const allMeanings = heroWords.map(w => w.meaning).filter(Boolean);
    return (
      <div className="hero-page">
        <button className="btn-ghost" onClick={() => setPhase("roadmap")} style={{ marginBottom: 16 }}>
          ← Yol Haritasına Dön
        </button>
        <div className="glass-card" style={{ textAlign: "center", borderColor: "rgba(191,90,242,0.3)", borderWidth: 2 }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: 8, color: "#bf5af2" }}>BOSS</div>
          <h2 style={{ color: "#bf5af2", marginBottom: 4 }}>{currentLevel} BOSS FIGHT</h2>
          <p className="hint-text">10 sorudan en az 8'ini doğru bilmelisin!</p>
        </div>
        {bossQuestions.map((q, i) => {
          const wrongs = allMeanings.filter(m => m !== q.meaning).sort(() => 0.5 - Math.random()).slice(0, 3);
          const opts = [q.meaning, ...wrongs].sort(() => 0.5 - Math.random());
          return (
            <div key={i} className="glass-card" style={{ borderLeft: "4px solid #bf5af2" }}>
              <p className="quiz-question">
                <span style={{ color: "#bf5af2" }}>Soru {i + 1}: </span>
                &quot;{q.word}&quot; kelimesinin anlamı nedir?
              </p>
              <div className="quiz-options-col">
                {opts.map((opt, oi) => {
                  let cls = "quiz-opt";
                  if (bossAnswers[i] !== undefined) {
                    if (opt === q.meaning) cls += " correct-ans";
                    else if (opt === bossAnswers[i] && opt !== q.meaning) cls += " wrong-ans";
                  }
                  return (
                    <button key={oi} className={cls} disabled={bossAnswers[i] !== undefined}
                      onClick={() => answerBoss(i, opt, q.meaning)}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {Object.keys(bossAnswers).length === bossQuestions.length && (
          <button className="bento-btn w-100" style={{ marginTop: 16, background: "linear-gradient(135deg, #bf5af2, #8b5cf6)" }}
            onClick={completeBoss}>
            Sonucu Gör ({bossScore}/10)
          </button>
        )}
      </div>
    );
  }

  // Ders Ekranı
  if (phase === "lesson") {
    const allCompleted = Object.keys(quizAnswers).length === lessonWords.length;
    const allCorrect = allCompleted && quizScore === lessonWords.length;
    return (
      <div className="hero-page">
        <button className="btn-ghost" onClick={() => setPhase("roadmap")} style={{ marginBottom: 16 }}>
          ← Yol Haritasına Dön
        </button>
        <h2 className="section-title">
          {currentLevel} — Ders {heroStats[currentLevel].completed + 1}/{heroStats[currentLevel].required}
        </h2>

        {generating ? (
          <div className="glass-card" style={{ textAlign: "center", padding: 40 }}>
            <div className="spinner-ring" style={{ margin: "0 auto 16px" }}></div>
            <p>AI ders üretiyor...</p>
          </div>
        ) : (
          <>
            {/* Metin */}
            <div className="glass-card">
              <div className="reading-display" style={{ marginTop: 0 }}>
                {lessonContent.split("\n").filter(Boolean).map((p, i) => (
                  <p key={i} style={{ marginBottom: 12 }}>{p}</p>
                ))}
              </div>
            </div>

            {/* Mini Quiz */}
            {lessonWords.length > 0 && (
              <div className="glass-card">
                <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Mini Quiz</h3>
                {lessonWords.map((w, i) => {
                  const wrongs = lessonWords.filter(lw => lw.meaning !== w.meaning).map(lw => lw.meaning)
                    .sort(() => 0.5 - Math.random()).slice(0, 2);
                  const opts = [w.meaning, ...wrongs].sort(() => 0.5 - Math.random());
                  return (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <p style={{ fontWeight: 700, marginBottom: 8 }}>
                        {i + 1}. &quot;{w.word}&quot; anlamı nedir?
                      </p>
                      <div className="quiz-options-col">
                        {opts.map((opt, oi) => {
                          let cls = "quiz-opt";
                          if (quizAnswers[i] !== undefined) {
                            if (opt === w.meaning) cls += " correct-ans";
                            else if (opt === quizAnswers[i] && opt !== w.meaning) cls += " wrong-ans";
                          }
                          return (
                            <button key={oi} className={cls} disabled={quizAnswers[i] !== undefined}
                              onClick={() => answerMiniQuiz(i, opt, w.meaning)}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Dersi Tamamla */}
            {allCorrect && (
              <button className="bento-btn w-100" onClick={completeLesson}>
                Dersi Tamamla & Kelimeleri Kaydet
              </button>
            )}
            {allCompleted && !allCorrect && (
              <button className="bento-btn w-100" style={{ background: "linear-gradient(135deg, var(--error), #cc0000)" }}
                onClick={() => startLevel(currentLevel)}>
                Tekrar Dene
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Roadmap
  const levels = ["A1", "A2", "B1", "B2", "C1"];
  const totalReq = levels.reduce((s, l) => s + heroStats[l].required, 0);
  const totalDone = levels.reduce((s, l) => s + Math.min(heroStats[l].completed, heroStats[l].required), 0);
  const overallPercent = totalReq === 0 ? 0 : Math.round((totalDone / totalReq) * 100);

  return (
    <div className="hero-page">
      <div className="header-split">
        <h2 className="section-title">Zero to Hero</h2>
        <button className="btn-ghost" onClick={() => setShowBank(!showBank)}>
          Hero Çantası ({heroWords.length})
        </button>
      </div>

      {/* Progress */}
      <div className="glass-card">
        <div className="bento-target-top">
          <span className="bento-label">Genel İlerleme</span>
          <span className="bento-value">%{overallPercent}</span>
        </div>
        <div className="bento-bar-bg" style={{ marginTop: 12 }}>
          <div className="bento-bar-fill" style={{ width: `${overallPercent}%`, background: "linear-gradient(90deg, #bf5af2, #30d158)" }}></div>
        </div>
      </div>

      {/* Seviye Kartları */}
      <div className="hero-roadmap">
        {levels.map((lvl, idx) => {
          const s = heroStats[lvl];
          const needsBoss = s.completed >= s.required && s.next && !heroStats[s.next]?.unlocked;
          const isComplete = s.completed >= s.required && (!s.next || heroStats[s.next]?.unlocked);
          const progress = s.required === 0 ? 0 : Math.min((s.completed / s.required) * 100, 100);

          return (
            <div key={lvl}
              className={`glass-card hero-node ${!s.unlocked ? "hero-locked" : ""}`}
              style={{ borderLeft: `4px solid ${LEVEL_COLORS[lvl]}`, cursor: s.unlocked ? "pointer" : "default" }}
              onClick={() => s.unlocked && startLevel(lvl)}
            >
              <div className="header-split">
                <h3 style={{ color: LEVEL_COLORS[lvl], fontWeight: 900 }}>{lvl}</h3>
                {!s.unlocked && <span style={{ color: "var(--text-muted)" }}>Kilitli</span>}
                {needsBoss && <span style={{ color: "#bf5af2", fontWeight: 700 }}>Boss Fight</span>}
                {isComplete && <span style={{ color: "var(--primary)", fontWeight: 700 }}>Tamamlandı</span>}
                {s.unlocked && !needsBoss && !isComplete && (
                  <span style={{ color: LEVEL_COLORS[lvl] }}>Dersi Başlat ▶</span>
                )}
              </div>
              <div className="bento-bar-bg" style={{ marginTop: 10, height: 6 }}>
                <div className="bento-bar-fill" style={{ width: `${progress}%`, background: LEVEL_COLORS[lvl] }}></div>
              </div>
              <span className="hint-text" style={{ marginTop: 6, display: "block" }}>
                {s.completed}/{s.required} ders
              </span>
            </div>
          );
        })}
      </div>

      {/* Hero Çantası */}
      {showBank && (
        <div className="glass-card" style={{ marginTop: 16 }}>
          <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Hero Çantası</h3>
          {heroWords.length === 0 ? (
            <p className="hint-text" style={{ textAlign: "center", padding: 20 }}>
              Çantan boş. Dersleri tamamladıkça kelimeler buraya eklenecek!
            </p>
          ) : (
            <div className="word-list">
              {[...heroWords].reverse().map((w, i) => (
                <div key={i} className="word-card-mini" style={{ borderLeft: `3px solid ${LEVEL_COLORS[w.level] || "var(--accent)"}` }}>
                  <b>{w.word}</b>
                  <span className="meaning-text">{w.meaning}</span>
                  <span style={{ color: LEVEL_COLORS[w.level], fontSize: "0.8rem", fontWeight: 700 }}>{w.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
