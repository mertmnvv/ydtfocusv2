"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { subscribeToUserWords, addUserWord } from "@/lib/firestore";

const TOPICS = [
  { id: "random", label: "Karışık" },
  { id: "literature", label: "Edebiyat" },
  { id: "politics", label: "Siyaset" },
  { id: "daily", label: "Günlük Yaşam" },
  { id: "history", label: "Tarih" },
  { id: "science", label: "Bilim" },
  { id: "psychology", label: "Psikoloji" },
  { id: "technology", label: "Teknoloji" },
  { id: "health", label: "Sağlık" },
  { id: "environment", label: "Çevre" },
  { id: "sociology", label: "Sosyoloji" },
  { id: "philosophy", label: "Felsefe" },
  { id: "economy", label: "Ekonomi" },
  { id: "art", label: "Sanat" },
  { id: "sports", label: "Spor" },
  { id: "space", label: "Uzay" },
];

const YDT_ACADEMIC_WORDS = [
  "abandon", "abundant", "accelerate", "accumulate", "accuracy", "achieve", "acquire", "adapt",
  "adequate", "advocate", "allocate", "alter", "ambiguous", "amend", "analyze", "anticipate",
  "apparent", "appreciate", "approach", "appropriate", "assess", "assume", "attain", "attribute",
  "available", "benefit", "capable", "capacity", "cease", "challenge", "circumstance", "clarify",
  "coherent", "coincide", "collapse", "commence", "commit", "communicate", "compatible", "compensate",
  "compile", "complement", "complex", "comprise", "conceive", "concentrate", "conclude", "conduct",
  "confine", "confirm", "conflict", "conform", "consent", "consequent", "considerable", "consist",
  "constant", "constitute", "constrain", "construct", "consult", "consume", "contemporary", "context",
  "contract", "contradict", "contrary", "contrast", "contribute", "controversy", "convene", "convert",
  "convince", "cooperate", "crucial", "currency", "debate", "decline", "deduce", "define",
  "demonstrate", "deny", "depress", "derive", "despite", "detect", "deviate", "devote",
  "differentiate", "diminish", "discriminate", "displace", "display", "dispose", "distinct",
  "distort", "distribute", "diverse", "document", "dominate", "draft", "dynamic", "eliminate",
  "emerge", "emphasis", "empirical", "enable", "encounter", "enforce", "enhance", "enormous",
  "ensure", "environment", "equate", "equip", "equivalent", "establish", "estimate", "evaluate",
  "evident", "evolve", "exceed", "exclude", "exhibit", "expand", "explicit", "exploit",
  "expose", "extract", "facilitate", "feature", "fluctuate", "focus", "framework", "function",
  "fundamental", "generate", "grant", "guarantee", "highlight", "hypothesis", "identical", "identify",
  "illustrate", "impact", "implement", "implicate", "implicit", "imply", "impose", "incentive",
  "incidence", "incline", "incorporate", "indicate", "induce", "inevitable", "infer", "inherent",
  "inhibit", "initial", "initiate", "injure", "innovate", "insight", "inspect", "instance",
  "institute", "instruct", "integral", "integrate", "integrity", "intelligence", "intense", "interact",
  "intermediate", "internal", "interpret", "intervene", "intrinsic", "invest", "investigate",
  "invoke", "involve", "isolate", "issue", "justify", "label", "legislate", "license",
  "locate", "logic", "maintain", "major", "manipulate", "margin", "mature", "maximize",
  "mechanism", "mediate", "mental", "method", "migrate", "minimal", "minimize", "minimum",
  "modify", "monitor", "motive", "mutual", "negate", "neutral", "nevertheless", "nonetheless",
  "normal", "notion", "notwithstanding", "nuclear", "objective", "obtain", "obvious", "occupy",
  "occur", "odd", "offset", "ongoing", "option", "orient", "outcome", "overall",
  "overlap", "paradigm", "parallel", "parameter", "participate", "passive", "perceive", "period",
  "persist", "perspective", "phase", "phenomenon", "physical", "policy", "portion", "pose",
  "positive", "potential", "precede", "precise", "predict", "predominant", "preliminary", "presume",
  "previous", "primary", "prime", "principal", "principle", "prior", "priority", "proceed",
  "process", "professional", "profound", "promote", "proportion", "prospect", "protocol", "publication",
  "publish", "purchase", "pursue", "qualitative", "quote", "radical", "random", "range",
  "ratio", "rational", "react", "recover", "refine", "regime", "region", "register",
  "regulate", "reinforce", "reject", "relax", "release", "relevant", "reluctance", "rely",
  "remove", "require", "research", "reside", "resolve", "resource", "respond", "restore",
  "restrain", "restrict", "retain", "reveal", "revenue", "reverse", "revise", "revolution",
  "rigid", "role", "route", "scenario", "schedule", "scheme", "scope", "section",
  "sector", "secure", "seek", "select", "sequence", "series", "shift", "significant",
  "similar", "simulate", "site", "so-called", "sole", "somewhat", "source", "specific",
  "specify", "sphere", "stable", "statistic", "status", "straightforward", "strategy", "stress",
  "structure", "style", "submit", "subordinate", "subsequent", "subsidy", "substitute", "successor",
  "sufficient", "sum", "summary", "supplement", "survey", "survive", "suspend", "sustain",
  "symbol", "tape", "target", "task", "team", "technical", "technique", "technology",
  "temporary", "tense", "terminate", "text", "theme", "theory", "thereby", "thesis",
  "topic", "trace", "tradition", "transfer", "transform", "transit", "transmit", "transport",
  "trend", "trigger", "ultimate", "undergo", "underlie", "undertake", "uniform", "unify",
  "unique", "utilize", "valid", "vary", "vehicle", "version", "via", "violate", "virtual",
  "visible", "vision", "visual", "volume", "voluntary", "welfare", "whereas", "whereby",
  "widespread"
];

export default function ReadingPage() {
  const { user, requireAuth } = useAuth();
  const { showNotification } = useNotification();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState("random");
  const [generating, setGenerating] = useState(false);
  const [myWords, setMyWords] = useState([]);
  
  const [lookupInput, setLookupInput] = useState("");
  const [wordInput, setWordInput] = useState("");
  const [meaningInput, setMeaningInput] = useState("");
  const [synInput, setSynInput] = useState("");
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setMyWords([]);
      return;
    }
    const unsubscribe = subscribeToUserWords(user.uid, setMyWords);

    // Focus AI'dan gelen özel metni dinle
    const handleLoadPassage = (e) => {
      const { passage, questions } = e.detail;
      if (passage) {
        setText(passage);
        setQuizQuestions(questions || []);
      }
    };

    window.addEventListener("focus-load-passage", handleLoadPassage);

    // URL'den gelen özel üretim isteğini kontrol et
    const params = new URLSearchParams(window.location.search);
    if (params.get("generate") === "special") {
      // AI'ya tetikleyici gönder
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("focus-generate-special"));
      }, 1000);
    }

    return () => {
      unsubscribe();
      window.removeEventListener("focus-load-passage", handleLoadPassage);
    };
  }, [user]);

  // Sayfa içeriğini Focus AI'ya bildir
  useEffect(() => {
    if (text) {
      const event = new CustomEvent("focus-page-context", {
        detail: {
          type: "reading_passage",
          topic: topic,
          text: text,
          status: "Metin oluşturuldu"
        }
      });
      window.dispatchEvent(event);
    }
  }, [text, topic]);

  async function generateAIText(selectedTopic) {
    const t = selectedTopic || topic;
    setTopic(t);
    setGenerating(true);
    let prompt = `Write an English reading passage about ${t}. Level: ${level} CEFR. Length: 150-200 words. Focus on YDT exam style academic vocabulary. ONLY return the pure text paragraph.`;
    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        setText(data.choices[0].message.content.replace(/\*/g, "").trim());
        setQuizQuestions([]); 
      }
    } catch {
      setText("Bağlantı hatası.");
    }
    setGenerating(false);
  }

  async function lookupWord(input) {
    const clean = (input || lookupInput).trim();
    if (!clean) return;
    
    setFetchingDetails(true);
    setShowResultCard(true);
    setWordInput(clean);
    setMeaningInput("Aranıyor...");
    setSynInput("-");

    try {
      const resp = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: clean }),
      });
      const data = await resp.json();
      setWordInput(data.en || clean);
      setMeaningInput(data.tr || "Bulunamadı");
      
      const enWord = data.en || clean;
      try {
        const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${enWord}`);
        if (dictRes.ok) {
          const dictData = await dictRes.json();
          let syns = [];
          dictData[0]?.meanings?.forEach(m => {
            if (m.synonyms?.length > 0) syns = [...syns, ...m.synonyms.filter(s => !s.includes(" ") && s.length < 15)];
          });
          if (syns.length > 0) setSynInput([...new Set(syns)].slice(0, 3).join(", "));
        }
      } catch {}
    } catch {
      setMeaningInput("Hata.");
    }
    setFetchingDetails(false);
  }

  function saveWord() {
    requireAuth(async () => {
      if (!wordInput || !meaningInput || meaningInput === "Aranıyor...") return;
      if (myWords.some(w => w.word?.toLowerCase() === wordInput.toLowerCase())) {
        return showNotification("Bu kelime zaten bankanızda!", "warning");
      }
      try {
        await addUserWord(user.uid, { word: wordInput, meaning: meaningInput, syn: synInput || "-" });
        setMyWords(prev => [...prev, { word: wordInput }]);
        showNotification("Kelime bankasına eklendi!", "success");
      } catch { showNotification("Hata oluştu.", "error"); }
    });
  }

  async function generateQuiz() {
    if (!text || text.length < 50) return;
    setQuizLoading(true);
    setQuizQuestions([]);

    const prompt = `Based on the text below, create exactly 3 multiple-choice questions. 
    Return ONLY a valid JSON object with key "questions" containing an array of 3 objects.
    Each object keys: "q" (question), "a", "b", "c", "d" (options), "correct" (value: a/b/c/d).
    Text: ${text}`;

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      if (parsed.questions) setQuizQuestions(parsed.questions);
    } catch {
      showNotification("Soru üretilemedi.", "error");
    }
    setQuizLoading(false);
  }

  function checkAnswer(qIdx, opt) {
    setQuizQuestions(prev => prev.map((q, i) => 
      i === qIdx ? { ...q, userAnswer: opt } : q
    ));
  }

  function renderAnalysis() {
    if (!text.trim()) return null;
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    return sentences.map((sentence, si) => {
      const tokens = sentence.split(/(\s+)/);
      return (
        <span key={si} className="focus-sentence">
          {tokens.map((token, ti) => {
            const clean = token.replace(/[^\p{L}]/gu, "").toLowerCase().trim();
            if (!clean || clean.length < 2) return <span key={ti}>{token}</span>;
            const isSaved = myWords.some(w => w.word?.toLowerCase() === clean);
            const isAcademic = YDT_ACADEMIC_WORDS.includes(clean);
            return (
              <span key={ti} className={`hover-word ${isSaved ? "is-saved" : ""} ${isAcademic ? "academic-word" : ""}`}
                onClick={() => lookupWord(clean)}>
                {token}
              </span>
            );
          })}
          {" "}
        </span>
      );
    });
  }

  return (
    <div className="reading-page">
      <div className="header-split">
        <h2 className="section-title">Metin Analizi</h2>
        <div className="reading-controls">
          <select value={level} onChange={e => setLevel(e.target.value)} className="reading-select">
            <option value="A2">A2</option><option value="B1">B1</option>
            <option value="B2">B2</option><option value="C1">C1</option>
          </select>
        </div>
      </div>

      <div className="topic-chips">
        {TOPICS.map(t => (
          <button 
            key={t.id} 
            className={`topic-chip ${topic === t.id ? "active" : ""}`}
            onClick={() => generateAIText(t.id)}
            disabled={generating}
          >
            <span className="chip-label">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="reading-grid">
        <div className="reading-sidebar">
          <div className="glass-card">
            <div className="card-header-minimal">Kelime Ara</div>
            <div className="minimal-search-box">
              <input 
                placeholder="Kelimeyi girin..." 
                value={lookupInput} 
                onChange={e => setLookupInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupWord()}
              />
              <button onClick={() => lookupWord()} className="minimal-search-btn">
                Ara
              </button>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-header-minimal">Metin Girişi</div>
            <textarea
              className="reading-textarea"
              placeholder="Metninizi buraya ekleyin..."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={8}
            />
          </div>
        </div>

        <div className="reading-main">
          {text.trim() ? (
            <>
              <div className="glass-card reading-display-card">
                <div className="card-header-minimal">Analiz</div>
                <div className="reading-display">{renderAnalysis()}</div>
                <button onClick={generateQuiz} className="btn-ghost w-100 mt-2" disabled={quizLoading}>
                  {quizLoading ? "Hazırlanıyor..." : "Okuduğunu Anlama Testi"}
                </button>
              </div>

              {quizQuestions.length > 0 && (
                <div className="quiz-section">
                  {quizQuestions.map((q, i) => (
                    <div key={i} className="glass-card quiz-card">
                      <p className="quiz-q-text"><b>{i+1}.</b> {q.q}</p>
                      <div className="quiz-options-col">
                        {['a','b','c','d'].map(opt => {
                          let cls = "quiz-opt";
                          if (q.userAnswer) {
                            if (opt === q.correct) cls += " correct";
                            else if (opt === q.userAnswer) cls += " wrong";
                          }
                          return (
                            <button key={opt} className={cls} disabled={!!q.userAnswer} onClick={() => checkAnswer(i, opt)}>
                              <span className="opt-letter">{opt.toUpperCase()}</span>
                              {q[opt]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-analysis-state">
              <p>Analiz için metin ekleyin veya yukarıdan bir konu seçin.</p>
              {generating && <p style={{ color: "var(--accent)", marginTop: 12 }}>İçerik hazırlanıyor...</p>}
            </div>
          )}
        </div>
      </div>

      {showResultCard && (
        <div className="responsive-lookup-overlay" onClick={() => setShowResultCard(false)}>
          <div className="responsive-lookup-card animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="card-header-minimal">
              <span>Sonuç</span>
              <button onClick={() => setShowResultCard(false)} className="btn-close-minimal">Kapat</button>
            </div>
            {fetchingDetails ? (
              <div className="sheet-loading-small"><div className="spinner-ring"></div></div>
            ) : (
              <>
                <div className="lookup-fields">
                  <div className="lookup-field">
                    <label>KELİME</label>
                    <input value={wordInput} onChange={e => setWordInput(e.target.value)} />
                  </div>
                  <div className="lookup-field">
                    <label>ANLAM</label>
                    <input value={meaningInput} onChange={e => setMeaningInput(e.target.value)} />
                  </div>
                  <div className="lookup-field">
                    <label>EŞ ANLAM</label>
                    <input value={synInput} onChange={e => setSynInput(e.target.value)} />
                  </div>
                </div>
                <button onClick={saveWord} className="btn-primary w-100 mt-2">Kaydet</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
