"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useSearchParams } from "next/navigation";
import { subscribeToUserWords, addUserWord, completeReadingPassage, getUserMistakes, checkDailyLimit, incrementDailyLimit } from "@/lib/firestore";
import PremiumModal from "@/components/PremiumModal";

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

const WIKI_TOPICS = [
  { id: "random", label: "Rastgele" },
  { id: "animals", label: "Hayvanlar Alemi" },
  { id: "biography", label: "Biyografi" },
  { id: "geography", label: "Coğrafya & Ülkeler" },
  { id: "history", label: "Tarih" },
  { id: "science", label: "Bilim" },
  { id: "mythology", label: "Mitoloji" },
  { id: "space", label: "Uzay" },
  { id: "technology", label: "Teknoloji" },
  { id: "art", label: "Sanat" },
  { id: "music", label: "Müzik" },
  { id: "cinema", label: "Sinema" },
  { id: "sports", label: "Spor" },
  { id: "landmarks", label: "Önemli Yapılar" },
  { id: "food", label: "Dünya Mutfağı" },
  { id: "inventions", label: "İcatlar" },
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
  const { user, requireAuth, isPremium, setPremiumModalOpen } = useAuth();
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
  const [streamMode, setStreamMode] = useState(false);
  const [sourceMode, setSourceMode] = useState(null); // null=selection, "wikipedia", "ai"
  const [wikiUrl, setWikiUrl] = useState("");
  const [wikiThumbnail, setWikiThumbnail] = useState("");
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [logicLines, setLogicLines] = useState([]);
  const [conjunctions, setConjunctions] = useState([]);
  const [hoveredRef, setHoveredRef] = useState(null);
  const [hoveredConj, setHoveredConj] = useState(null);

  function speakWord(w) {
    if (!w) return;
    
    // Önceki seslendirmeleri anında iptal et (Sıra beklememesi için)
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(w);
    
    // Tarayıcıdaki sesleri al ve Amerikan aksanlı olanı bul
    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(v => v.lang === "en-US" && v.name.includes("Google")) || 
                    voices.find(v => v.lang === "en-US") || 
                    voices[0];
    
    if (usVoice) utterance.voice = usVoice;
    utterance.lang = "en-US";
    utterance.rate = 0.85; 
    utterance.pitch = 1;
    
    window.speechSynthesis.speak(utterance);
  }
  
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
    const sourceParam = searchParams.get("source");

    if (sharedText) {
      setText(decodeURIComponent(sharedText));
      setSourceMode(sourceParam || "ai"); // Doğrudan analiz ekranına geç
      setQuizQuestions([]);
    } else if (generateMode === "special") {
      setSourceMode("ai");
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
    if (!user) return requireAuth(() => {});

    // Limit Kontrolü
    if (!isPremium) {
      const { limitReached } = await checkDailyLimit(user.uid, "reading");
      if (limitReached) {
        setPremiumModalOpen(true);
        return;
      }
    }

    const t = selectedTopic || topic;
    setTopic(t);
    setGenerating(true);
    
    let prompt = `Write a high-quality, professional academic reading passage for YDT students.
    Target Level: ${level} CEFR.
    Topic: ${t}.
    
    Linguistic Requirements:
    - Style: Professional academic journal (e.g., Nature, The Economist).
    - Sentence Structure: Use complex clauses, passive voice, and academic logical connectors. 
    - Cohesion: Ensure logical flow and perfect transitions between sentences.
    - NO repetitive simplistic SVO sentences.
    - NO typos or spelling errors.
    
    Format: Return ONLY a valid JSON object with keys: 
      "title": "A professional academic title",
      "en": "The English reading text (Sophisticated English)",
      "tr": "Professional Turkish translation (Academic Turkish)",
      "logic_lines": [
        {"ref": "it/they/this", "target": "EXACT phrase in text", "context": "explanation"}
      ],
      "conjunctions": [
        {"word": "however/when/etc", "type": "contrast/time/etc", "tr": "Türkçe anlamı"}
      ]
    Important: The 'target' MUST match a substring in the 'en' text exactly.
    Length: 150-200 words.`;

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      if (data.choices?.[0]?.message?.content) {
        const parsed = JSON.parse(data.choices[0].message.content);
        setPassageTitle(parsed.title || "");
        setText(parsed.en || "");
        setTranslatedText(parsed.tr || "");
        setLogicLines(parsed.logic_lines || []);
        setConjunctions(parsed.conjunctions || []);
        setQuizQuestions([]); 
        setIsFlipped(false);
        setCurrentCardIdx(0);

        // Başarılı ise limiti artır
        if (!isPremium) {
          await incrementDailyLimit(user.uid, "reading");
        }
      }
    } catch (error) {
      console.error(error);
      setText("Bağlantı hatası.");
    }
    setGenerating(false);
    setIsFinished(false);
  }

  async function generateStoryFromMyWords() {
    if (!user) return requireAuth(() => {});

    // Limit Kontrolü
    if (!isPremium) {
      const { limitReached } = await checkDailyLimit(user.uid, "reading");
      if (limitReached) {
        setPremiumModalOpen(true);
        return;
      }
    }

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

      let prompt = `Write a professional academic reading passage that logically integrates the following vocabulary.
      Target Level: ${level} CEFR.
      Required Vocabulary: ${selectedWords.join(", ")}.
      
      Linguistic Requirements:
      - The text must be a coherent academic argument or analysis, NOT a list of random sentences.
      - Use sophisticated sentence structures and professional academic tone.
      - Bold the required words in the "en" text.
      - Ensure perfect logical flow and cohesive links.
      
      Format: Return ONLY a valid JSON object with keys: 
        "title": "Academic Title",
        "en": "English text (Sophisticated, professional, words in **bold**)",
        "tr": "Accurate academic Turkish translation"
      
      Length: 150-200 words.`;
      
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
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

        // Başarılı ise limiti artır
        if (!isPremium) {
          await incrementDailyLimit(user.uid, "reading");
        }
      }
    } catch (err) {
      showNotification("Hikaye üretilirken hata oluştu.", "error");
    }
    setGenerating(false);
    setIsFinished(false);
  }

  async function generateWikipediaText(selectedTopic) {
    if (!user) return requireAuth(() => {});
    const t = selectedTopic || topic;
    setTopic(t);
    setGenerating(true);
    setQuizQuestions([]);
    setIsFlipped(false);
    setCurrentCardIdx(0);
    setLogicLines([]);
    setConjunctions([]);
    setTranslatedText("");
    setWikiUrl("");
    setWikiThumbnail("");
    try {
      const response = await fetch("/api/wikipedia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const data = await response.json();
      if (data.error) {
        showNotification(data.error, "error");
        setText("");
      } else {
        setPassageTitle(data.title || "");
        setText(data.text || "");
        setTranslatedText(data.tr || "");
        setWikiUrl(data.url || "");
        setWikiThumbnail(data.thumbnail || "");
      }
    } catch (error) {
      console.error(error);
      showNotification("Wikipedia bağlantı hatası.", "error");
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
      setSynInput(data.synonyms || "-");
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

  function renderStreamMode() {
    if (!text.trim()) return null;
    
    // Metni cümlelere böl ve 2'şerli kartlar yap
    const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
    const cards = [];
    for (let i = 0; i < sentences.length; i += 2) {
      cards.push(sentences.slice(i, i + 2).join(" "));
    }

    if (currentCardIdx >= cards.length) setCurrentCardIdx(0);

    const currentCard = cards[currentCardIdx];
    const tokens = currentCard.split(/(\s+)/);

    return (
      <div className="stream-container">
        {/* Progress Bar */}
        <div className="stream-overall-progress">
          <div 
            className="stream-progress-fill" 
            style={{ width: `${((currentCardIdx + 1) / cards.length) * 100}%` }}
          ></div>
        </div>

        <div className="stream-card-wrapper animate-slideIn">
          <div className="stream-card-content">
            {tokens.map((token, ti) => {
              const clean = token.replace(/[^\p{L}]/gu, "").toLowerCase().trim();
              
              // Bu kelime bir referans mı?
              const isRef = logicLines.find(l => l?.ref?.toLowerCase() === clean);
              // Bu kelime bir bağlaç mı?
              const isConj = conjunctions.find(c => c?.word?.toLowerCase() === clean);
              
              // Sadece hover edilen referansın hedefini parlat
              const isCurrentTarget = hoveredRef && hoveredRef.target.toLowerCase().includes(clean);
              
              const isActiveRef = hoveredRef && hoveredRef.ref.toLowerCase() === clean;

              return (
                <span 
                  key={ti} 
                  className={`stream-word 
                    ${isRef ? "logic-ref" : ""} 
                    ${isConj ? "conj-ref" : ""} 
                    ${isActiveRef || isCurrentTarget ? "connection-active" : ""} 
                    ${hoveredConj && hoveredConj.word.toLowerCase() === clean ? "conj-active" : ""}
                  `}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => {
                    if (isRef) setHoveredRef(isRef);
                    if (isConj) setHoveredConj(isConj);
                  }}
                  onMouseLeave={() => {
                    setHoveredRef(null);
                    setHoveredConj(null);
                  }}
                  onClick={() => {
                    if (clean) {
                      if (isRef || isConj) {
                        // Mobilde tıklayınca ipucunu göster/gizle
                        setHoveredRef(prev => (prev === isRef ? null : isRef));
                        setHoveredConj(prev => (prev === isConj ? null : isConj));
                      } else {
                        setLookupInput(clean);
                        setTimeout(() => lookupWord(clean), 0);
                      }
                    }
                  }}
                >
                  {token}
                  {isActiveRef && (
                    <span className="logic-connector-tip">
                      {hoveredRef.target}
                    </span>
                  )}
                  {hoveredConj && hoveredConj.word.toLowerCase() === clean && (
                    <span className={`conj-connector-tip ${isActiveRef ? "stacked" : ""}`}>
                      {hoveredConj.tr}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
          
          <div className="stream-card-footer">
            <button 
              className="btn-stream-nav" 
              onClick={() => setCurrentCardIdx(prev => Math.max(0, prev - 1))}
              disabled={currentCardIdx === 0}
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <div className="stream-progress">
              Kart {currentCardIdx + 1} / {cards.length}
            </div>
            <button 
              className="btn-stream-nav highlight" 
              onClick={() => setCurrentCardIdx(prev => Math.min(cards.length - 1, prev + 1))}
              disabled={currentCardIdx === cards.length - 1}
            >
              {currentCardIdx === cards.length - 1 ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-chevron-right"></i>}
            </button>
          </div>
        </div>
        
        {/* Quick Quiz for the card */}
        <div className="stream-quick-quiz animate-fadeIn">
           <p className="quiz-hint"><i className="fa-solid fa-bolt"></i> Bu parçayı anladın mı? Devam et!</p>
        </div>
      </div>
    );
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
          {para.split(/(\s+)/).map((token, ti) => {
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
        </div>
      );
    });
  }

  return (
    <div className={`reading-page ${sidebarCollapsed ? "zen-mode" : ""}`}>

      {/* ───── SOURCE SELECTION SCREEN ───── */}
      {!sourceMode ? (
        <div className="source-selection-container">
          <div className="source-selection-header">
            <h2 className="section-title" style={{ margin: 0 }}>Metin Analizi</h2>
            <p className="source-subtitle">Okuma pratiği için bir kaynak seçin</p>
          </div>
          <div className="source-cards-grid">
            <button className="source-card" onClick={() => setSourceMode("wikipedia")}>
              <div className="source-card-icon wiki-icon">
                <i className="fa-brands fa-wikipedia-w"></i>
              </div>
              <h3>Wikipedia&apos;dan Oku</h3>
              <p>Gerçek İngilizce makaleler ile pratik yap. Ücretsiz, sınırsız içerik.</p>
              <div className="source-card-tags">
                <span className="stag">Gerçek İçerik</span>
                <span className="stag">Sınırsız</span>
                <span className="stag">Ücretsiz</span>
              </div>
            </button>
            <button className="source-card" onClick={() => setSourceMode("ai")}>
              <div className="source-card-icon ai-icon">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h3>AI ile Üret</h3>
              <p>Yapay zeka ile seviyene uygun akademik metin üret. YDT formatında.</p>
              <div className="source-card-tags">
                <span className="stag">Seviye Uyumlu</span>
                <span className="stag">YDT Format</span>
                <span className="stag">Çeviri</span>
              </div>
            </button>
          </div>

          <style jsx>{`
            .source-selection-container { max-width: 700px; margin: 40px auto; padding: 0 16px; }
            .source-selection-header { text-align: center; margin-bottom: 40px; }
            .source-subtitle { color: #888; font-size: 0.95rem; margin-top: 8px; }
            .source-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .source-card {
              background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
              border-radius: 24px; padding: 36px 28px; text-align: center; cursor: pointer;
              transition: all 0.3s ease; display: flex; flex-direction: column; align-items: center; gap: 12px;
            }
            .source-card:hover { border-color: var(--accent); background: rgba(226,183,20,0.04); transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.3); }
            .source-card-icon { width: 72px; height: 72px; border-radius: 22px; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin-bottom: 8px; }
            .wiki-icon { background: rgba(255,255,255,0.06); color: #fff; }
            .ai-icon { background: rgba(226,183,20,0.1); color: var(--accent); }
            .source-card h3 { font-size: 1.2rem; font-weight: 900; color: #fff; margin: 0; }
            .source-card p { font-size: 0.82rem; color: #888; line-height: 1.5; margin: 0; }
            .source-card-tags { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
            .stag { font-size: 0.65rem; font-weight: 700; padding: 3px 10px; border-radius: 8px; background: rgba(255,255,255,0.04); color: #aaa; border: 1px solid rgba(255,255,255,0.06); text-transform: uppercase; letter-spacing: 0.3px; }
            .source-card:hover .stag { border-color: rgba(226,183,20,0.2); color: var(--accent); }
            @media (max-width: 600px) { .source-cards-grid { grid-template-columns: 1fr; } .source-card { padding: 28px 20px; } }
          `}</style>
        </div>
      ) : (
      <>

      {/* ───── READING INTERFACE ───── */}
      <div className="header-split" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => { setSourceMode(null); setText(""); setPassageTitle(""); setQuizQuestions([]); setWikiUrl(""); setWikiThumbnail(""); }}
            className="btn-ghost"
            style={{ padding: '8px 12px', borderRadius: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <h2 className="section-title" style={{ margin: 0 }}>
            {sourceMode === "wikipedia" ? "Wikipedia Okuma" : "Metin Analizi"}
          </h2>
          {sourceMode === "wikipedia" && <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: '#aaa', textTransform: 'uppercase' }}>Wikipedia</span>}
          {sourceMode === "ai" && <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '3px 10px', borderRadius: '8px', background: 'rgba(226,183,20,0.1)', color: 'var(--accent)', textTransform: 'uppercase' }}>AI</span>}
        </div>
        <div className="reading-controls" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button 
            className={`btn-ghost ${streamMode ? "active" : ""}`} 
            onClick={() => setStreamMode(!streamMode)}
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', color: streamMode ? 'var(--accent)' : '' }}
          >
            <i className="fa-solid fa-layer-group" style={{ marginRight: 8 }}></i>
            {streamMode ? " SmartStream Aktif" : " SmartStream Modu"}
          </button>
          <button 
            className={`btn-ghost ${sidebarCollapsed ? "active" : ""}`} 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem' }}
          >
            <i className={`fa-solid ${sidebarCollapsed ? "fa-expand-arrows-alt" : "fa-compress-arrows-alt"}`} style={{ marginRight: 8 }}></i>
            {sidebarCollapsed ? " Kenar Çubuğunu Göster" : " Odak Modu"}
          </button>
          {sourceMode === "ai" && (
            <select value={level} onChange={e => setLevel(e.target.value)} className="reading-select">
              <option value="A2">A2</option><option value="B1">B1</option>
              <option value="B2">B2</option><option value="C1">C1</option>
            </select>
          )}
        </div>
      </div>

      {!sidebarCollapsed && (
        <div className="topic-chips">
          {(sourceMode === "wikipedia" ? WIKI_TOPICS : TOPICS).map(t => (
            <button 
              key={t.id} 
              className={`topic-chip ${topic === t.id ? "active" : ""}`}
              onClick={() => sourceMode === "wikipedia" ? generateWikipediaText(t.id) : generateAIText(t.id)}
              disabled={generating}
            >
              <span className="chip-label">{t.label}</span>
            </button>
          ))}
          {sourceMode === "ai" && (
            <button 
              className={`topic-chip special-chip ${topic === "Kelimelerim" ? "active" : ""}`}
              onClick={generateStoryFromMyWords}
              disabled={generating}
            >
              <span className="chip-label"><i className="fa-solid fa-magic-wand-sparkles" style={{ marginRight: 6 }}></i> Kelimelerimle Yaz</span>
            </button>
          )}
        </div>
      )}

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
                      <span>{streamMode ? "SmartStream Akışı" : "Analiz"}</span>
                      {translatedText && !streamMode && (
                        <button className="btn-translate-toggle" onClick={() => setIsFlipped(true)}>
                          <i className="fa-solid fa-language"></i> Türkçesine Bak
                        </button>
                      )}
                    </div>
                    {passageTitle && <h1 className="reading-title-display">{passageTitle}</h1>}
                    <div className="reading-display">
                      {streamMode ? renderStreamMode() : renderAnalysis()}
                    </div>
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

      {/* Wikipedia Source Link */}
      {sourceMode === "wikipedia" && wikiUrl && text.trim() && (
        <div style={{ textAlign: 'center', marginTop: 12, marginBottom: 12 }}>
          <a href={wikiUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#888', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-brands fa-wikipedia-w"></i> Kaynak: Wikipedia — {passageTitle}
            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.6rem' }}></i>
          </a>
        </div>
      )}

      </>
      )}

      {showResultCard && (
        <div className="responsive-lookup-overlay" onClick={() => setShowResultCard(false)}>
          <div className="responsive-lookup-card animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="card-header-minimal">
              <span>Hızlı Sözlük</span>
              <button onClick={() => setShowResultCard(false)} className="btn-close-minimal">Kapat</button>
            </div>

            {/* Pop-up İçi Hızlı Arama */}
            <div className="popup-search-box" style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
              <input 
                placeholder="Yeni bir kelime ara..." 
                value={lookupInput} 
                onChange={e => setLookupInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && lookupWord()}
                style={{ 
                  flex: 1, 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  borderRadius: '12px', 
                  padding: '10px 14px', 
                  fontSize: '0.85rem',
                  color: '#fff'
                }}
              />
              <button 
                onClick={() => lookupWord()} 
                className="btn-icon-sm"
                style={{ background: 'var(--accent)', color: '#000', borderRadius: '12px', padding: '0 15px' }}
              >
                <i className="fa-solid fa-search"></i>
              </button>
            </div>

            {fetchingDetails ? (
              <div className="sheet-loading-small"><div className="spinner-ring"></div></div>
            ) : (
              <>
                <div className="lookup-fields">
                  <div className="lookup-field">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label>KELİME</label>
                      <button 
                        className="btn-icon-sm" 
                        onClick={() => speakWord(wordInput)} 
                        title="Dinle"
                        style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}
                      >
                        <i className="fa-solid fa-volume-high"></i>
                      </button>
                    </div>
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
                <button 
                  onClick={saveWord} 
                  className="btn-primary w-100 mt-4"
                  style={{ 
                    padding: '16px', 
                    borderRadius: '16px', 
                    fontSize: '0.9rem', 
                    fontWeight: 900,
                    boxShadow: '0 10px 20px rgba(226, 183, 20, 0.2)' 
                  }}
                >
                  Bankaya Kaydet
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
