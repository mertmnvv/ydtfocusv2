"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserHeroStats, updateUserHeroStats } from "@/lib/firestore";
import HeroAssistant from "@/components/HeroAssistant";
import Link from "next/link";

const LEVEL_COLORS = {
  A1: "#30d158",
  A2: "#e2b714",
  B1: "#ff9f0a",
  B2: "#bf5af2",
  C1: "#ff375f",
};

export default function HeroPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [heroStats, setHeroStats] = useState({
    A1: { completed: 0, required: 10, unlocked: true, next: "A2" },
    A2: { completed: 0, required: 15, unlocked: false, next: "B1" },
    B1: { completed: 0, required: 20, unlocked: false, next: "B2" },
    B2: { completed: 0, required: 25, unlocked: false, next: "C1" },
    C1: { completed: 0, required: 30, unlocked: false, next: null },
  });
  const [heroWords, setHeroWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState("roadmap");
  const [currentLevel, setCurrentLevel] = useState("");
  const [lessonSteps, setLessonSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [placedWords, setPlacedWords] = useState({});
  const [wrongGap, setWrongGap] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [hasErrored, setHasErrored] = useState(false);

  const loadHero = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserHeroStats(user.uid);
      // Immutability fix: Clone the object before modifying
      let lvls = data?.levels ? JSON.parse(JSON.stringify(data.levels)) : JSON.parse(JSON.stringify(heroStats));
      
      const newReqs = { A1: 10, A2: 15, B1: 20, B2: 25, C1: 30 };
      Object.keys(lvls).forEach(k => { if (lvls[k].required !== newReqs[k]) lvls[k].required = newReqs[k]; });
      
      if (lvls.A1.completed >= lvls.A1.required && !lvls.A2.unlocked) lvls.A2.unlocked = true;
      if (lvls.A2.completed >= lvls.A2.required && !lvls.B1.unlocked) lvls.B1.unlocked = true;
      if (lvls.B1.completed >= lvls.B1.required && !lvls.B2.unlocked) lvls.B2.unlocked = true;
      if (lvls.B2.completed >= lvls.B2.required && !lvls.C1.unlocked) lvls.C1.unlocked = true;
      
      setHeroStats(lvls);
      setHeroWords(data?.heroWords || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [user]); // Removed heroStats and heroWords from deps to avoid infinite loop

  useEffect(() => {
    if (user) {
      loadHero();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading, loadHero]);

  const startLevel = (level) => {
    if (!heroStats[level].unlocked) return;
    const stats = heroStats[level];
    const subLevel = stats.completed + 1;
    
    const baseQs = { A1: 5, A2: 6, B1: 8, B2: 10, C1: 10 };
    const maxQs = { A1: 8, A2: 10, B1: 12, B2: 14, C1: 15 };
    const progress = stats.completed / (stats.required - 1 || 1);
    const qCount = Math.round(baseQs[level] + (maxQs[level] - baseQs[level]) * progress);
    
    setCurrentLevel(level);
    setGenerating(true);
    setPhase("lesson");
    setLessonSteps([]);
    setCurrentStep(0);
    setPlacedWords({});
    setFeedback(null);
    setCorrectCount(0);
    setHasErrored(false);

    const themes = ["daily life", "work", "travel", "hobbies", "shopping", "technology", "nature", "emotions", "socializing", "education", "science", "arts", "politics", "history"];
    const randomTheme = themes[Math.floor(Math.random() * themes.length)];

    const prompt = `Generate ${qCount} UNIQUE English sentence completion exercises for CEFR level ${level}, specifically for step ${subLevel} of ${stats.required}.
    Step 1 is introductory, step ${stats.required} is peak difficulty for this level. 
    CURRENT THEME: ${randomTheme}.
    RULES:
    1. Each sentence has ONE blank [gap1].
    2. Provide 3 WRONG high-quality distractors.
    3. Return ONLY JSON: { "steps": [{ "text": "...", "blanks": {"gap1": "word"}, "translation": "...", "distractors": ["...", "...", "..."], "allTranslations": {...} }] }`;

    fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const raw = data.choices?.[0]?.message?.content || "";
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
        setLessonSteps(json.steps.map(s => {
          const correctAnswer = Object.values(s.blanks)[0];
          const dists = (s.distractors || []).filter(d => d && d.trim() !== "");
          const finalBank = [correctAnswer, ...dists].filter(w => w && w.trim() !== "");
          
          return {
            ...s,
            bank: finalBank.sort(() => Math.random() - 0.5),
          };
        }));
        setGenerating(false);
      })
      .catch(() => {
        setLessonSteps([
          { text: "I [gap1] English.", blanks: { gap1: "learn" }, translation: "Öğrenmek", allTranslations: { I: "Ben", learn: "öğrenmek", English: "İngilizce" }, bank: ["learn", "go", "sleep", "eat"] },
          { text: "The cat is [gap1].", blanks: { gap1: "small" }, translation: "Küçük", allTranslations: { The: "O", cat: "kedi", is: "dır", small: "küçük" }, bank: ["small", "big", "red", "fast"] },
          { text: "He [gap1] to school.", blanks: { gap1: "goes" }, translation: "Gider", allTranslations: { He: "O", goes: "gider", to: "-e", school: "okul" }, bank: ["goes", "sees", "plays", "eats"] },
          { text: "It is [gap1].", blanks: { gap1: "cold" }, translation: "Soğuk", allTranslations: { It: "O", is: "dır", cold: "soğuk" }, bank: ["cold", "hot", "big", "blue"] },
          { text: "We [gap1] pizza.", blanks: { gap1: "eat" }, translation: "Yemek", allTranslations: { We: "Biz", eat: "yemek", pizza: "pizza" }, bank: ["eat", "drink", "run", "read"] },
        ]);
        setGenerating(false);
      });
  };

  const handleCheck = () => {
    const s = lessonSteps[currentStep];
    const ok = Object.entries(s.blanks).every(([g, v]) => placedWords[g]?.toLowerCase() === v.toLowerCase());
    if (ok) {
      if (!hasErrored) setCorrectCount(prev => prev + 1);
      setFeedback("success");
    } else {
      setFeedback("error");
      setHasErrored(true);
      setWrongGap(true);
      setTimeout(() => setWrongGap(false), 500);
    }
  };

  const handleNext = () => {
    if (currentStep < lessonSteps.length - 1) {
      setCurrentStep(p => p + 1);
      setPlacedWords({});
      setFeedback(null);
      setHasErrored(false);
    } else {
      finishLesson();
    }
  };

  const finishLesson = async () => {
    const score = (correctCount / lessonSteps.length) * 100;
    const passed = score >= 60;

    if (passed) {
      const ns = JSON.parse(JSON.stringify(heroStats));
      ns[currentLevel].completed += 1;
      if (ns[currentLevel].completed >= ns[currentLevel].required && ns[currentLevel].next) {
        ns[ns[currentLevel].next].unlocked = true;
      }
      setHeroStats(ns);
      setPhase("finish");
      if (user) await updateUserHeroStats(user.uid, { levels: ns, heroWords });
    } else {
      setPhase("failed");
    }
  };

  function WordTip({ text, tr }) {
    const [show, setShow] = useState(false);
    return (
      <span className="htip-word" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onClick={() => setShow(!show)}>
        {text}
        {show && <span className="htip-bubble">{tr || "..."}</span>}
      </span>
    );
  }

  if (loading || authLoading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  // ── FAILED ──
  if (phase === "failed") {
    const score = Math.round((correctCount / lessonSteps.length) * 100);
    return (
      <div className="hero-finish">
        <div className="glass-card hero-finish-inner" style={{ borderTop: "4px solid #ff375f" }}>
          <div style={{ fontSize: "3rem", color: "#ff375f", marginBottom: 20 }}>
            <i className="fa-solid fa-circle-xmark"></i>
          </div>
          <h2>Başarısız!</h2>
          <p className="hint-text">Başarı Oranı: %{score}</p>
          <p style={{ marginTop: 10, fontSize: "0.9rem" }}>Geçmek için en az %60 başarı sağlamalısın. Lütfen tekrar dene.</p>
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button className="btn-ghost" onClick={() => setPhase("roadmap")}>Vazgeç</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => startLevel(currentLevel)}>Tekrar Dene</button>
          </div>
        </div>
      </div>
    );
  }

  // ── FINISH ──
  if (phase === "finish") {
    const score = Math.round((correctCount / lessonSteps.length) * 100);
    return (
      <div className="hero-finish">
        <div className="glass-card hero-finish-inner">
          <div className="hero-finish-icon" style={{ fontSize: "3rem", color: "var(--primary)" }}>
            <i className="fa-solid fa-certificate"></i>
          </div>
          <h2>Tebrikler!</h2>
          <p className="hint-text">Başarı Oranı: %{score}</p>
          <p style={{ marginTop: 8, fontSize: "0.9rem" }}>{currentLevel} seviyesinde bir basamak daha tırmandın.</p>
          <button className="btn-primary w-100" style={{ marginTop: 24 }} onClick={() => setPhase("roadmap")}>
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  // ── LESSON ──
  if (phase === "lesson") {
    const s = lessonSteps[currentStep];
    const allFilled = s && Object.keys(placedWords).length >= Object.keys(s.blanks).length;
    return (
      <div className="hero-lesson">
        <div className="hero-lesson-top">
          <button className="btn-ghost" onClick={() => setPhase("roadmap")}>✕</button>
          <div className="hero-progress-track">
            <div className="hero-progress-fill" style={{ width: `${((currentStep + 1) / lessonSteps.length) * 100}%` }} />
          </div>
          <span className="hero-step-count">{currentStep + 1}/{lessonSteps.length}</span>
        </div>

        <div className="hero-lesson-body">
          <h3 className="hero-lesson-title">Boşluğu doldur</h3>

          {generating ? (
            <div className="glass-card" style={{ textAlign: "center", padding: 60 }}>
              <div className="spinner-ring" style={{ margin: "0 auto 16px" }} />
              <p className="hint-text">AI sorular hazırlıyor…</p>
            </div>
          ) : s && (
            <>
              <div className="hero-sentence glass-card">
                {s.text.split(/(\s+)/).map((p, i) => {
                  const m = p.match(/\[(gap\d+)\]/);
                  if (m) {
                    const gid = m[1];
                    const val = placedWords[gid];
                    return (
                      <span key={i}
                        className={`hero-blank ${val ? "filled" : ""} ${wrongGap ? "shake" : ""}`}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => { setPlacedWords({ ...placedWords, [gid]: e.dataTransfer.getData("word") }); }}
                        onClick={() => val && setPlacedWords({ ...placedWords, [gid]: null })}
                      >
                        {val || "\u00A0\u00A0\u00A0"}
                      </span>
                    );
                  }
                  const clean = p.replace(/[.,!?;]/g, "").trim();
                  if (!clean) return <span key={i}>{p}</span>;
                  return <WordTip key={i} text={p} tr={s.allTranslations?.[clean]} />;
                })}
              </div>

              {!feedback && (
                <div className="hero-bank">
                  {s.bank.map((w, i) => {
                    const used = Object.values(placedWords).includes(w);
                    return (
                      <button key={i}
                        className={`hero-chip ${used ? "used" : ""}`}
                        draggable={!used}
                        onDragStart={e => e.dataTransfer.setData("word", w)}
                        onClick={() => {
                          if (used) return;
                          const gap = Object.keys(s.blanks).find(k => !placedWords[k]);
                          if (gap) setPlacedWords({ ...placedWords, [gap]: w });
                        }}
                      >{w}</button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className={`hero-footer ${feedback || ""}`}>
          <div className="hero-footer-inner">
            {feedback && (
              <div className="hero-fb-row">
                <span className={`hero-fb-icon ${feedback}`}>{feedback === "success" ? "✓" : "✕"}</span>
                <div>
                  <b>{feedback === "success" ? "Doğru!" : "Yanlış!"}</b>
                  {feedback === "error" && <span className="hero-fb-hint"> Doğrusu: {Object.values(s.blanks).join(", ")}</span>}
                </div>
              </div>
            )}
            {!feedback ? (
              <button className="btn-primary w-100" disabled={!allFilled} onClick={handleCheck}>Kontrol Et</button>
            ) : (
              <button className="btn-primary w-100" onClick={handleNext}>Devam Et</button>
            )}
          </div>
        </div>

        <style jsx>{`
          .hero-lesson { height: 100vh; display: flex; flex-direction: column; background: #0a0a0b; color: #fff; position: relative; z-index: 100; }
          .hero-lesson-top { padding: 20px; display: flex; align-items: center; gap: 15px; }
          .hero-progress-track { flex: 1; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden; }
          .hero-progress-fill { height: 100%; background: var(--accent); transition: 0.3s; }
          .hero-lesson-body { flex: 1; padding: 20px; max-width: 600px; margin: 0 auto; width: 100%; display: flex; flex-direction: column; gap: 30px; overflow-y: auto; }
          .hero-sentence { font-size: 1.5rem; line-height: 2; padding: 30px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; min-height: 150px; }
          .hero-blank { border-bottom: 2px solid var(--accent); min-width: 60px; text-align: center; color: var(--accent); font-weight: 700; cursor: pointer; }
          .hero-blank.filled { border-bottom-color: transparent; background: rgba(226, 183, 20, 0.1); padding: 0 10px; border-radius: 8px; }
          .hero-bank { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; padding-bottom: 40px; }
          .hero-chip { padding: 12px 20px; background: #1a1a1b; border: 1px solid var(--border); border-radius: 12px; color: #fff; cursor: pointer; transition: 0.2s; font-size: 1rem; }
          .hero-chip:hover { border-color: var(--accent); }
          .hero-chip.used { opacity: 0.2; cursor: default; }
          
          .hero-footer { padding: 20px; border-top: 1px solid var(--border); background: #0a0a0b; }
          .hero-footer.success { background: rgba(48, 209, 88, 0.1); border-top-color: #30d158; }
          .hero-footer.error { background: rgba(255, 55, 95, 0.1); border-top-color: #ff375f; }
          .hero-footer-inner { max-width: 600px; margin: 0 auto; }
          .hero-fb-row { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; }
          .hero-fb-icon { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; }
          .hero-fb-icon.success { background: #30d158; color: #000; }
          .hero-fb-icon.error { background: #ff375f; color: #fff; }
          
          @media (max-width: 600px) {
            .hero-footer { padding-bottom: 90px; }
            .hero-sentence { font-size: 1.2rem; padding: 20px; }
            .hero-chip { padding: 10px 15px; font-size: 0.9rem; }
          }
        `}</style>
      </div>
    );
  }

  // ── ROADMAP ──
  const levels = ["A1", "A2", "B1", "B2", "C1"];
  const totalDone = levels.reduce((s, l) => s + Math.min(heroStats[l].completed, heroStats[l].required), 0);
  const totalReq = levels.reduce((s, l) => s + heroStats[l].required, 0);
  const pct = Math.round((totalDone / totalReq) * 100);

  return (
    <div className="hero-roadmap">
      <h2 className="section-title">Zero to Hero</h2>
      <p className="hint-text" style={{ marginBottom: 24 }}>Seviyeleri tamamlayarak ilerleyin.</p>

      <div className="glass-card" style={{ marginBottom: 40, padding: 20 }}>
        <div className="header-split">
          <span className="hint-text">Genel İlerleme</span>
          <b style={{ color: "var(--accent)" }}>%{pct}</b>
        </div>
        <div className="hero-overall-bar" style={{ height: 10, background: "rgba(255,255,255,0.05)", borderRadius: 5, marginTop: 10, overflow: "hidden" }}>
          <div className="hero-overall-fill" style={{ width: `${pct}%`, height: "100%", background: "var(--accent)", transition: "1s" }} />
        </div>
      </div>

      <div className="hero-path">
        {levels.map((lvl, idx) => {
          const s = heroStats[lvl];
          const color = LEVEL_COLORS[lvl];
          const locked = !s.unlocked;
          const done = s.completed >= s.required;
          const prog = Math.round((s.completed / s.required) * 100);

          return (
            <div key={lvl} className="hero-path-item">
              <div
                className={`hero-node ${locked ? "locked" : ""} ${done ? "done" : ""}`}
                style={{ "--c": color }}
                onClick={() => !locked && startLevel(lvl)}
              >
                <svg className="hero-ring" viewBox="0 0 100 100">
                  <circle className="hero-ring-bg" cx="50" cy="50" r="44" />
                  {!locked && !done && (
                    <circle className="hero-ring-fill" cx="50" cy="50" r="44"
                      style={{ 
                        strokeDasharray: `${2 * Math.PI * 44}`, 
                        strokeDashoffset: `${2 * Math.PI * 44 * (1 - prog / 100)}` 
                      }}
                    />
                  )}
                </svg>
                <span className="hero-node-text">
                  {locked ? <i className="fa-solid fa-lock"></i> : done ? <i className="fa-solid fa-check"></i> : lvl}
                </span>
              </div>
              <div className="hero-node-meta">
                <span className="hero-node-badge" style={{ background: `${color}20`, color }}>{lvl}</span>
                <span className="hero-node-sub">{done ? "Tamamlandı" : `${s.completed}/${s.required}`}</span>
              </div>
              {idx < 4 && <div className={`hero-path-line ${done ? "active" : ""}`} />}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .hero-roadmap { max-width: 900px; margin: 0 auto; padding: 20px; }
        .hero-path { display: flex; flex-direction: column; gap: 60px; position: relative; align-items: center; padding: 40px 0; }
        .hero-path-item { position: relative; display: flex; flex-direction: column; align-items: center; z-index: 2; }
        
        .hero-node { 
          width: 90px; height: 90px; border-radius: 50%; background: #1a1a1b; 
          display: flex; align-items: center; justify-content: center; 
          cursor: pointer; position: relative; transition: 0.3s;
        }
        .hero-node:hover:not(.locked) { transform: scale(1.1); box-shadow: 0 0 30px var(--c); }
        .hero-node.locked { opacity: 0.4; cursor: not-allowed; filter: grayscale(1); }
        .hero-node.done { background: var(--c); color: #000; }
        
        .hero-ring { position: absolute; inset: -5px; transform: rotate(-90deg); width: 100px; height: 100px; }
        .hero-ring-bg { fill: none; stroke: rgba(255,255,255,0.05); stroke-width: 6; }
        .hero-ring-fill { fill: none; stroke: var(--c); stroke-width: 6; stroke-linecap: round; transition: 1s; }
        
        .hero-node-text { font-size: 1.5rem; font-weight: 900; z-index: 2; }
        .hero-node-meta { margin-top: 15px; text-align: center; display: flex; flex-direction: column; gap: 5px; }
        .hero-node-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; }
        .hero-node-sub { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }
        
        .hero-path-line { 
          position: absolute; top: 100px; height: 60px; width: 4px; 
          background: rgba(255,255,255,0.05); z-index: 1; 
        }
        .hero-path-line.active { background: var(--accent); }

        @media (max-width: 600px) {
          .hero-path { gap: 50px; }
          .hero-node { width: 80px; height: 80px; }
          .hero-ring { width: 90px; height: 90px; }
          .hero-node-text { font-size: 1.2rem; }
        }
      `}</style>
    </div>
  );
}
