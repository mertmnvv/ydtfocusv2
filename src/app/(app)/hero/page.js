"use client";

import { useState, useEffect } from "react";
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
    A1: { completed: 0, required: 5, unlocked: true, next: "A2" },
    A2: { completed: 0, required: 5, unlocked: false, next: "B1" },
    B1: { completed: 0, required: 5, unlocked: false, next: "B2" },
    B2: { completed: 0, required: 5, unlocked: false, next: "C1" },
    C1: { completed: 0, required: 5, unlocked: false, next: null },
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

  useEffect(() => {
    if (user) loadHero();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  async function loadHero() {
    try {
      const data = await getUserHeroStats(user.uid);
      let lvls = data?.levels || heroStats;
      // Force-unlock based on completion
      if (lvls.A1.completed >= lvls.A1.required && !lvls.A2.unlocked) lvls.A2.unlocked = true;
      if (lvls.A2.completed >= lvls.A2.required && !lvls.B1.unlocked) lvls.B1.unlocked = true;
      if (lvls.B1.completed >= lvls.B1.required && !lvls.B2.unlocked) lvls.B2.unlocked = true;
      if (lvls.B2.completed >= lvls.B2.required && !lvls.C1.unlocked) lvls.C1.unlocked = true;
      setHeroStats(lvls);
      setHeroWords(data?.heroWords || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  function startLevel(level) {
    if (!heroStats[level].unlocked) return;
    setCurrentLevel(level);
    setGenerating(true);
    setPhase("lesson");
    setLessonSteps([]);
    setCurrentStep(0);
    setPlacedWords({});
    setFeedback(null);

    const prompt = `Generate 5 English sentence completion exercises for CEFR level ${level}. Each sentence has ONE blank.
TURKISH TRANSLATION RULES:
1. allTranslations must map each English word to its CONTEXTUAL Turkish meaning (not dictionary form).
2. Use natural spoken Turkish, not devrik (inverted) sentences.
3. The "translation" field is the meaning of the BLANK word only.
Return ONLY valid JSON: { "steps": [{ "text": "I [gap1] English.", "blanks": {"gap1": "learn"}, "translation": "öğrenmek", "allTranslations": {"I": "Ben", "learn": "öğrenmek", "English": "İngilizce"} }] }`;

    fetch("/api/groq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const raw = data.choices?.[0]?.message?.content || "";
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
        setLessonSteps(json.steps.map(s => ({
          ...s,
          bank: [Object.values(s.blanks)[0], "go", "book", "new", "always"].sort(() => Math.random() - 0.5),
        })));
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
  }

  function handleCheck() {
    const s = lessonSteps[currentStep];
    const ok = Object.entries(s.blanks).every(([g, v]) => placedWords[g] === v);
    if (ok) {
      setFeedback("success");
    } else {
      setFeedback("error");
      setWrongGap(true);
      setTimeout(() => setWrongGap(false), 500);
    }
  }

  function handleNext() {
    if (currentStep < 4) {
      setCurrentStep(p => p + 1);
      setPlacedWords({});
      setFeedback(null);
    } else {
      finishLesson();
    }
  }

  async function finishLesson() {
    const ns = { ...heroStats };
    ns[currentLevel].completed += 1;
    if (ns[currentLevel].completed >= ns[currentLevel].required && ns[currentLevel].next) {
      ns[ns[currentLevel].next].unlocked = true;
    }
    setHeroStats(ns);
    setPhase("finish");
    if (user) await updateUserHeroStats(user.uid, { levels: ns, heroWords });
  }

  function WordTip({ text, tr }) {
    const [show, setShow] = useState(false);
    return (
      <span className="htip-word" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {text}
        {show && <span className="htip-bubble">{tr || "..."}</span>}
      </span>
    );
  }

  if (loading || authLoading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!isAdmin) {
    return (
      <div className="hero-roadmap" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div className="glass-card" style={{ padding: "60px 20px", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: "3rem", marginBottom: 24, color: "var(--accent)" }}>
            <i className="fa-solid fa-hourglass-half"></i>
          </div>
          <h2 style={{ marginBottom: 16 }}>Çok Yakında</h2>
          <p className="hint-text">Zero to Hero modülü şu an geliştirme aşamasındadır. Çok yakında tüm kullanıcılarımıza açılacaktır.</p>
          <Link href="/dashboard" className="btn-primary" style={{ marginTop: 32, display: "inline-block", padding: "12px 32px" }}>
            Merkeze Dön
          </Link>
        </div>
      </div>
    );
  }

  // ── FINISH ──
  if (phase === "finish") {
    return (
      <div className="hero-finish">
        <div className="glass-card hero-finish-inner">
          <div className="hero-finish-icon" style={{ fontSize: "3rem", color: "var(--primary)" }}>
            <i className="fa-solid fa-certificate"></i>
          </div>
          <h2>Bölüm Tamamlandı!</h2>
          <p className="hint-text">{currentLevel} seviyesinde bir ders daha tamamladın.</p>
          <button className="btn-primary w-100" style={{ marginTop: 24 }} onClick={() => setPhase("roadmap")}>
            Haritaya Dön
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
        {/* Header */}
        <div className="hero-lesson-top">
          <button className="btn-ghost" onClick={() => setPhase("roadmap")}>✕</button>
          <div className="hero-progress-track">
            <div className="hero-progress-fill" style={{ width: `${((currentStep + 1) / 5) * 100}%` }} />
          </div>
          <span className="hero-step-count">{currentStep + 1}/5</span>
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
                        {val || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
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

        {/* Footer */}
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

      {/* Overall progress */}
      <div className="glass-card" style={{ marginBottom: 40 }}>
        <div className="header-split">
          <span className="hint-text">Genel İlerleme</span>
          <b>%{pct}</b>
        </div>
        <div className="hero-overall-bar">
          <div className="hero-overall-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Path */}
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
                      style={{ strokeDasharray: `${2 * Math.PI * 44}`, strokeDashoffset: `${2 * Math.PI * 44 * (1 - prog / 100)}` }}
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
              {idx < 4 && <div className="hero-path-line" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
