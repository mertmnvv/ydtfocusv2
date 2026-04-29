"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useSearchParams } from "next/navigation";
import { subscribeToUserWords, addUserWord, completeReadingPassage, getUserMistakes } from "@/lib/firestore";
import ShareButton from "@/components/ShareButton";

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
  const [passageTitle, setPassageTitle] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  const [lookupInput, setLookupInput] = useState("");
  const [wordInput, setWordInput] = useState("");
  const [meaningInput, setMeaningInput] = useState("");
  const [synInput, setSynInput] = useState("");
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [showResultCard, setShowResultCard] = useState(false);
  
  const [quizQuestions, setQuizQuestions] = useState([]);
  const searchParams = useSearchParams();
  const [quizLoading, setQuizLoading] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // URL Parametrelerini Dinle (Paylaşılan Metinler & AI Üretimi)
  useEffect(() => {
    const sharedText = searchParams.get("loadText");
    const generateMode = searchParams.get("generate");

    if (sharedText) {
      setText(decodeURIComponent(sharedText));
      setQuizQuestions([]);
    } else if (generateMode === "special") {
      // AI'ya tetikleyici gönder (2 sn gecikme asistanın hazır olması için)
      const timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent("focus-generate-special"));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) {
      setMyWords([]);
      return;
    }
    const isIdFormat = (str) => /^\d{10,15}_[a-z0-9]{3,10}$/.test(str);
    const unsubscribe = subscribeToUserWords(user.uid, (updated) => {
      setMyWords(updated.filter(w => !isIdFormat(w.word || "")));
    });

    // Focus AI'dan gelen özel metni dinle (GlobalAI'dan gelen event)
    const handleLoadPassage = (e) => {
      const { passage, questions } = e.detail;
      if (passage) {
        setText(passage);
        setQuizQuestions(questions || []);
      }
    };

    window.addEventListener("focus-load-passage", handleLoadPassage);

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

  // Quiz Sonucunu Dinle ve Başarıyı Tetikle
  useEffect(() => {
    if (quizQuestions.length > 0 && !isFinished) {
      const allAnswered = quizQuestions.every(q => q.userAnswer);
      const allCorrect = quizQuestions.every(q => q.userAnswer === q.correct);
      
      if (allAnswered && allCorrect) {
        handleCompleteReading();
      }
    }
  }, [quizQuestions]);

  async function generateAIText(selectedTopic) {
    const t = selectedTopic || topic;
    setTopic(t);
    setGenerating(true);
    const levelConstraints = {
      "A2": "Use very simple SVO sentences, common daily vocabulary, and avoid complex clauses. Keep it basic and direct.",
      "B1": "Use intermediate vocabulary and clear standard English. Include simple complex sentences (because, although, if).",
      "B2": "Use upper-intermediate academic vocabulary, technical terms, passive voice, and complex relative clauses. This is typical YDT level.",
      "C1": "Use advanced, sophisticated academic vocabulary (GRE/SAT level), abstract concepts, complex logical connectors, and varied sentence structures."
    };

    let prompt = `Create an English reading passage about ${t}. 
    Target Level: ${level} CEFR. 
    Linguistic Constraints: ${levelConstraints[level] || ""}
    Format: Return ONLY a valid JSON object with keys: 
      "title": "Creative academic title",
      "en": "The English reading text (Strictly English)",
      "tr": "Professional Turkish translation. 
             - Ensure natural, fluent, and academic phrasing.
             - Correctly handle causative structures: 'make us feel' should be 'hissettirir' (NOT 'hissedebilir').
             - Avoid literal translation. Use professional SOV Turkish.
             - No foreign language mixing."
    Length: 150-200 words. 
    Focus: YDT exam style academic vocabulary.`;

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        const parsed = JSON.parse(data.choices[0].message.content);
        setPassageTitle(parsed.title || "");
        setText(parsed.en || "");
        setTranslatedText(parsed.tr || "");
        setQuizQuestions([]); 
        setIsFlipped(false);
      }
    } catch {
      setText("Bağlantı hatası.");
    }
    setGenerating(false);
    setIsFinished(false);
  }

  async function generateStoryFromMyWords() {
    if (!user) return requireAuth(() => {});
    setGenerating(true);
    try {
      const mistakes = await getUserMistakes(user.uid);
      const bank = myWords.map(w => w.word);
      
      // Filtreleme: Sadece gerçek kelimeleri al (ID'leri ve çok uzun teknik dizileri temizle)
      const isIdFormat = (str) => /^\d{10,20}_[a-z0-9]+$/.test(str) || str.includes("_") || /\d/.test(str);
      
      const combined = [...new Set([...bank, ...mistakes])].filter(w => w && w.length > 1 && !isIdFormat(w));
      
      if (combined.length < 3) {
        showNotification("En az 3 gerçek akademik kelimeniz olmalı (Bankada veya hatalarda).", "warning");
        setGenerating(false);
        return;
      }

      const shuffled = combined.sort(() => 0.5 - Math.random());
      const selectedWords = shuffled.slice(0, 7);
      
      const levelConstraints = {
        "A2": "Use very simple SVO sentences and common daily vocabulary for all text except the required words. Keep it basic.",
        "B1": "Use intermediate vocabulary and clear standard English. Include simple complex sentences.",
        "B2": "Use upper-intermediate academic vocabulary, passive voice, and complex clauses. Typical YDT exam level.",
        "C1": "Use advanced, sophisticated academic vocabulary, abstract concepts, and complex logical connectors."
      };

      let prompt = `Write an English academic reading passage. 
      Target Level: ${level} CEFR.
      Linguistic Constraints: ${levelConstraints[level] || ""}
      Required Words to Include: ${selectedWords.join(", ")}. 
      Format: Return ONLY a valid JSON object with keys: 
        "title": "Creative title",
        "en": "English text (Strictly English, required words in **bold**)",
        "tr": "Professional Turkish translation (Strictly Turkish). 
               - NO foreign words mixed in. 
               - Ensure perfect grammar and spelling. 
               - Use natural, academic Turkish sentence structure."
      Length: 150-200 words.`;
      
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.6,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        const parsed = JSON.parse(data.choices[0].message.content);
        setPassageTitle(parsed.title || "");
        setText(parsed.en || "");
        setTranslatedText(parsed.tr || "");
        setTopic("Kelimelerim");
        setQuizQuestions([]);
        setIsFlipped(false);
        showNotification(`Hikaye oluşturuldu! Kullanılan kelimeler: ${selectedWords.join(", ")}`, "success");
      }
    } catch (err) {
      showNotification("Hikaye üretilirken hata oluştu.", "error");
    }
    setGenerating(false);
    setIsFinished(false);
  }

  async function handleCompleteReading() {
    if (!user || finishing || isFinished) return;
    setFinishing(true);
    try {
      await completeReadingPassage(user.uid);
      showNotification("Analiz başarıyla tamamlandı!", "success");
      setIsFinished(true);
      // Reset text after short delay or just stay there? Stay for now.
    } catch {
      showNotification("Hata oluştu.", "error");
    }
    setFinishing(false);
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
    
    // Paragraflara böl
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    return paragraphs.map((para, pi) => {
      // Cümlelere böl
      const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
      
      return (
        <div key={pi} className="reading-paragraph">
          {sentences.map((sentence, si) => {
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
              </span>
            );
          })}
        </div>
      );
    });
  }

  return (
    <div className={`reading-page ${sidebarCollapsed ? "zen-mode" : ""}`}>
      <div className="header-split" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h2 className="section-title" style={{ margin: 0 }}>Metin Analizi</h2>
          {text.trim() && <ShareButton item={{ text: text, title: topic }} type="reading" />}
        </div>
        <div className="reading-controls" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            className={`btn-ghost ${sidebarCollapsed ? "active" : ""}`} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <i className={`fa-solid ${sidebarCollapsed ? "fa-expand-arrows-alt" : "fa-compress-arrows-alt"}`} style={{ marginRight: 8 }}></i>
            {sidebarCollapsed ? " Kenar Çubuğunu Göster" : " Odak Modu"}
          </button>
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
        <button 
          className={`topic-chip special-chip ${topic === "Kelimelerim" ? "active" : ""}`}
          onClick={generateStoryFromMyWords}
          disabled={generating}
        >
          <span className="chip-label"><i className="fa-solid fa-magic-wand-sparkles" style={{ marginRight: 6 }}></i> Kelimelerimle Yaz</span>
        </button>
      </div>

      <div className={`reading-grid ${sidebarCollapsed ? "collapsed-sidebar" : ""}`}>
        {!sidebarCollapsed && (
          <div className="reading-sidebar animate-fadeInLeft">
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
              onChange={e => {
                setText(e.target.value);
                setPassageTitle("");
              }}
              rows={8}
            />
          </div>
        </div>
      )}

      <div className="reading-main">
          {text.trim() ? (
            <>
              <div className={`reading-card-scene ${isFlipped ? "is-flipped" : ""}`}>
                <div className="reading-card-inner">
                  {/* FRONT: ENGLISH ANALYSIS */}
                  <div className="reading-card-front glass-card reading-display-card">
                    <div className="card-header-minimal">
                      <span>Analiz</span>
                      {translatedText && (
                        <button className="btn-translate-toggle" onClick={() => setIsFlipped(true)}>
                          <i className="fa-solid fa-language"></i> Türkçesine Bak
                        </button>
                      )}
                    </div>
                    {passageTitle && <h1 className="reading-title-display">{passageTitle}</h1>}
                    <div className="reading-display">{renderAnalysis()}</div>
                  </div>

                  {/* BACK: TURKISH TRANSLATION */}
                  <div className="reading-card-back glass-card reading-display-card">
                    <div className="card-header-minimal">
                      <span>Türkçe Çeviri</span>
                      <button className="btn-translate-toggle" onClick={() => setIsFlipped(false)}>
                        <i className="fa-solid fa-arrow-left"></i> İngilizceye Dön
                      </button>
                    </div>
                    {passageTitle && <h1 className="reading-title-display">{passageTitle} (Çeviri)</h1>}
                    <div className="reading-display translation-text-display">
                      {translatedText.split(/\n+/).map((p, i) => (
                        <p key={i} className="reading-paragraph">{p}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div> {/* End of reading-card-scene */}

              <div className="analysis-actions" style={{ display: 'flex', gap: 10, marginTop: 15 }}>
                <button onClick={generateQuiz} className="btn-ghost flex-1" disabled={quizLoading || isFinished}>
                  {quizLoading ? "Hazırlanıyor..." : isFinished ? "Test Tamamlandı" : "Okuduğunu Anlama Testi"}
                </button>
              </div>

              {isFinished && (
                <div className="glass-card animate-fadeIn" style={{ border: '1px solid var(--accent)', background: 'rgba(48, 209, 88, 0.1)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: 'var(--accent)', fontSize: '1.4rem' }}></i>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Tebrikler!</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Soruların tamamını doğru yanıtlayarak analizi başarıyla tamamladın.</p>
                    </div>
                  </div>
                </div>
              )}

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
