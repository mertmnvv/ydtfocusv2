"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { subscribeToUserWords, addUserWord, completeReadingPassage, subscribeToUserStats } from "@/lib/firestore";
import { AI_MODELS, buildReadingPassagePrompt, buildTextAnalysisPrompt, buildReadingQuizPrompt } from "@/constants/prompts";

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
  return (
    <Suspense fallback={<div className="page-loading"><div className="spinner-ring"></div></div>}>
      <ReadingContent />
    </Suspense>
  );
}

function ReadingContent() {
  const { user, requireAuth } = useAuth();
  const { showNotification } = useNotification();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState("random");
  const [generating, setGenerating] = useState(false);
  const [myWords, setMyWords] = useState([]);
  const [stats, setStats] = useState({ streak: 0 });
  const [passageTitle, setPassageTitle] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [sourceMode, setSourceMode] = useState("wikipedia"); // "wikipedia" | "ai"
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [wikiUrl, setWikiUrl] = useState("");
  const [keyVocab, setKeyVocab] = useState([]);
  const [grammarPatterns, setGrammarPatterns] = useState([]);
  const [isStudyFlipped, setIsStudyFlipped] = useState(false);
  const [studyHighlight, setStudyHighlight] = useState(null);
  const [flippedGrammarCards, setFlippedGrammarCards] = useState({});

  // Audio Player States
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [spokenWordIndex, setSpokenWordIndex] = useState(-1);
  const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
  const [processedPassage, setProcessedPassage] = useState([]); // { sentence: string, words: string[] }
  const audioRef = useRef(null);
  const [isBuffering, setIsBuffering] = useState(false);

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
      setSourceMode(sourceParam || "ai");
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
    const unsubscribeStats = subscribeToUserStats(user.uid, (s) => {
      setStats({ ...(s || {}), streak: s?.streak || 0 });
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
      unsubscribeStats();
      window.removeEventListener("focus-load-passage", handleLoadPassage);
    };
  }, [user]);

  // Sayfa içeriğini Focus AI'ya bildir
  useEffect(() => {
    if (text) {
      const paras = text.split(/\n\s*\n/).filter(p => p.trim());
      const structure = [];
      let globalSentenceIdx = 0;

      paras.forEach((para) => {
        const sentences = para.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [para];
        const paraSentences = [];
        sentences.forEach(s => {
          // Google TTS limiti (~200 karakter) için uzun cümleleri böl
          const chunks = s.length > 180 ? s.match(/.{1,180}(?:\s|$)|.{1,180}/g) || [s] : [s];

          chunks.forEach(chunk => {
            paraSentences.push({
              original: chunk,
              globalIdx: globalSentenceIdx++,
              tokens: chunk.split(/(\s+)/).map(t => ({
                text: t,
                isWord: t.trim() && !/^[^a-zA-Z0-9]+$/.test(t.trim())
              }))
            });
          });
        });
        structure.push(paraSentences);
      });
      setProcessedPassage(structure);
    } else {
      setProcessedPassage([]);
    }
    // Yeni metne geçince sesi durdur ve sıfırla
    stopReading();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

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

  useEffect(() => {
    window.speechSynthesis.getVoices();
    return () => { window.speechSynthesis.cancel(); };
  }, []);

  // Sesli Okuma Fonksiyonları (Edge-TTS API)
  async function startReading(startIdx = -1) {
    const allSentences = processedPassage.flat();
    const idx = startIdx >= 0 ? startIdx : currentSentenceIdx;

    if (idx >= allSentences.length) {
      stopReading();
      return;
    }

    if (isPaused && startIdx === -1 && audioRef.current) {
      audioRef.current.play();
      setIsPaused(false);
      setIsReading(true);
      return;
    }

    // Durdur ve temizle
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsBuffering(true);
    setCurrentSentenceIdx(idx);

    try {
      const sentenceObj = allSentences[idx];
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sentenceObj.original,
          voice: 'en-US-AndrewNeural' // Yüksek kaliteli erkek sesi
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "TTS sunucusuna ulaşılamadı");
      }

      const contentType = response.headers.get('Content-Type');
      if (!contentType || !contentType.includes('audio')) {
        throw new Error("Sunucu geçerli bir ses dosyası döndürmedi");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        if (audio.duration) {
          const progress = audio.currentTime / audio.duration;
          const wordTokens = sentenceObj.tokens.filter(t => t.isWord);
          const currentWordIdx = Math.floor(progress * wordTokens.length);
          setSpokenWordIndex(currentWordIdx);
        }
      };

      audio.onplay = () => {
        setIsReading(true);
        setIsPaused(false);
        setIsBuffering(false);
      };

      audio.onended = () => {
        setSpokenWordIndex(-1);
        if (idx < allSentences.length - 1) {
          startReading(idx + 1);
        } else {
          stopReading();
        }
      };

      audio.onerror = () => {
        console.error("Ses çalma hatası");
        setIsBuffering(false);
        stopReading();
      };

      audio.play();
    } catch (err) {
      console.error(err);
      setIsBuffering(false);
      showNotification("Ses yüklenemedi", "error");
    }
  }

  function stopReading() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsReading(false);
    setIsPaused(false);
    setIsBuffering(false);
    setSpokenWordIndex(-1);
    setCurrentSentenceIdx(0);
  }

  // Quiz Sonucunu Dinle ve Başarıyı Tetikle
  useEffect(() => {
    if (quizQuestions.length > 0 && !isFinished) {
      const allAnswered = quizQuestions.every(q => q.userAnswer);
      const allCorrect = quizQuestions.every(q => q.userAnswer === q.correct);

      if (allAnswered && allCorrect) {
        handleCompleteReading();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizQuestions]);

  async function generateAIText(selectedTopic) {
    const t = selectedTopic || topic;
    setTopic(t);
    setGenerating(true);

    let prompt = buildReadingPassagePrompt({ level, topic: t });

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
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
        setKeyVocab(parsed.key_vocabulary || []);
        setGrammarPatterns(parsed.grammar_patterns || []);
        setQuizQuestions([]);
        setShowTranslation(false);
        setIsStudyFlipped(false);
      }
    } catch (error) {
      console.error(error);
      setText("Bağlantı hatası.");
    }
    setGenerating(false);
    setIsFinished(false);
  }

  async function generateWikipediaText(selectedTopic) {
    const t = selectedTopic || topic;
    setTopic(t);
    setGenerating(true);
    setQuizQuestions([]);
    setShowTranslation(false);
    setTranslatedText("");
    setWikiUrl("");
    try {
      const wikiResp = await fetch("/api/wikipedia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t }),
      });
      const data = await wikiResp.json();
      if (data.error) {
        showNotification(data.error, "error");
        setText("");
        setGenerating(false);
      } else {
        setPassageTitle(data.title || "");
        setText(data.text || "");
        setTranslatedText(data.tr || "");
        setWikiUrl(data.url || "");

        // Wikipedia Metni için AI Analizi (Kelime ve Gramer)
        analyzeTextForStudyDeck(data.text);
      }
    } catch (error) {
      console.error(error);
      showNotification("Wikipedia bağlantı hatası.", "error");
      setGenerating(false);
    }
    setIsFinished(false);
  }

  async function analyzeTextForStudyDeck(passage) {
    if (!passage) return;
    const prompt = buildTextAnalysisPrompt(passage);

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0].message.content);
      setKeyVocab(parsed.key_vocabulary || []);
      setGrammarPatterns(parsed.grammar_patterns || []);
    } catch (err) {
      console.error("Analysis error:", err);
    }
    setGenerating(false);
  }

  async function handleCompleteReading() {
    if (!user || finishing || isFinished) return;
    setFinishing(true);
    try {
      await completeReadingPassage(user.uid);
      showNotification("Analiz başarıyla tamamlandı!", "success");
      setIsFinished(true);
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
    if (!user) {
      setShowResultCard(false);
      return requireAuth(() => {});
    }
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

    const prompt = buildReadingQuizPrompt(text);

    try {
      const response = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: AI_MODELS.FAST,
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

  function applySettings() {
    setSettingsOpen(false);
    if (sourceMode === "wikipedia") generateWikipediaText(topic);
    else generateAIText(topic);
  }

  function renderAnalysis() {
    if (!processedPassage.length) return null;

    return (
      <div className="reading-content-wrapper">
        {processedPassage.map((paraSentences, pi) => (
          <div key={pi} className="reading-paragraph">
            {paraSentences.map((sObj) => {
              const si = sObj.globalIdx;
              const isCurrentSentence = isReading || isPaused ? si === currentSentenceIdx : false;
              let wordCounter = 0;

              return (
                <span key={si} className={`reading-sentence ${isCurrentSentence ? 'sentence-active' : ''}`}>
                  {sObj.tokens.map((token, ti) => {
                    if (!token.isWord) return <span key={ti}>{token.text}</span>;

                    const clean = token.text.replace(/[^\p{L}]/gu, "").toLowerCase().trim();
                    const isSaved = myWords.some(w => w.word?.toLowerCase() === clean);
                    const isAcademic = YDT_ACADEMIC_WORDS.includes(clean);

                    const currentWordIdx = wordCounter;
                    wordCounter++;

                    const isStudyActive = studyHighlight && (
                      clean === studyHighlight.toLowerCase() ||
                      studyHighlight.toLowerCase().includes(clean) && clean.length > 3
                    );

                    const isAudioActive = isCurrentSentence && currentWordIdx === spokenWordIndex;

                    return (
                      <span key={ti} className={`hover-word
                        ${isSaved ? "is-saved" : ""}
                        ${isAcademic ? "academic-word" : ""}
                        ${isStudyActive ? "study-highlight-active" : ""}
                        ${isAudioActive ? "audio-highlight-active" : ""}
                      `}
                        onClick={() => lookupWord(clean)}>
                        {token.text}
                      </span>
                    );
                  })}
                </span>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  const topicOptions = sourceMode === "wikipedia" ? WIKI_TOPICS : TOPICS;
  const dueCount = myWords.filter(w => (w.nextReview || 0) <= Date.now()).length;

  return (
    <div className="reading-page">
      {user && (
        <div className="reading-status-strip">
          <span>{stats.streak || 0} gün seri</span>
          <span className="reading-status-dot">·</span>
          {dueCount > 0 ? (
            <Link href="/srs">{dueCount} kelime tekrarı bekliyor</Link>
          ) : (
            <span>Bugün her şey taze</span>
          )}
        </div>
      )}

      {/* Header: Geri / başlık / Ayarlar */}
      <div className="reading-header-bar">
        <Link href="/library" className="reading-header-back">Geri</Link>
        <h1 className="reading-header-title">{passageTitle || "Okuma"}</h1>
        <button className="reading-header-settings" onClick={() => setSettingsOpen(true)}>Ayarlar</button>
      </div>

      {text.trim() ? (
        <>
          <div className="reading-body">
            {renderAnalysis()}

            {showTranslation && translatedText && (
              <div className="reading-translation-block">
                <div className="reading-translation-label">Türkçe</div>
                {translatedText.split(/\n+/).map((p, i) => (
                  <p key={i} className="reading-translation-p">{p}</p>
                ))}
              </div>
            )}
          </div>

          {sourceMode === "wikipedia" && wikiUrl && (
            <div className="reading-source-credit">
              <a href={wikiUrl} target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-wikipedia-w"></i> Kaynak: Wikipedia — {passageTitle}
              </a>
            </div>
          )}

          {/* STUDY DECK (VOCAB & GRAMMAR) */}
          {(keyVocab.length > 0 || grammarPatterns.length > 0) && (
            <div className="study-deck-wrapper animate-fadeIn" style={{ marginTop: 40, marginBottom: 40 }}>
              <div className="study-deck-header">
                <div className="study-deck-title">
                  <i className={`fa-solid ${isStudyFlipped ? 'fa-book-open' : 'fa-list-check'}`}></i>
                  <span>{isStudyFlipped ? 'Grammar Patterns' : 'Key Vocabulary'}</span>
                </div>
                <button className="study-flip-toggle" onClick={() => setIsStudyFlipped(!isStudyFlipped)}>
                  {isStudyFlipped ? 'Kelime Kartlarına Dön' : 'Gramer Yapılarına Bak'}
                  <i className="fa-solid fa-rotate"></i>
                </button>
              </div>

              <div className={`study-deck-scene ${isStudyFlipped ? 'is-flipped' : ''}`}>
                <div className="study-deck-inner">
                  {/* FRONT: KEY VOCABULARY */}
                  <div className="study-deck-front">
                    <div className="vocab-grid">
                      {keyVocab.map((v, i) => (
                        <div key={i} className={`vocab-item-card animate-slideIn ${studyHighlight === v.word ? 'active-highlight' : ''}`}
                             style={{ animationDelay: `${i * 0.05}s`, cursor: 'pointer' }}
                             onClick={() => {
                               const targetWord = v.word;
                               setStudyHighlight(prev => prev === targetWord ? null : targetWord);
                               setTimeout(() => {
                                 const activeEl = document.querySelector('.study-highlight-active');
                                 if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                               }, 100);
                             }}>
                          <div className="vocab-card-header">
                            <button className="v-icon-btn" onClick={() => speakWord(v.word)}>
                              <i className="fa-solid fa-volume-high"></i>
                            </button>
                            <button className="v-icon-btn" onClick={() => {
                              setWordInput(v.word);
                              setMeaningInput(v.tr);
                              setSynInput("-");
                              setShowResultCard(true);
                            }}>
                              <i className="fa-solid fa-bookmark"></i>
                            </button>
                          </div>
                          <div className="vocab-card-body">
                            <div className="v-word-row">
                              <span className="v-type">{v.type}</span>
                              <h3 className="v-word">{v.word}</h3>
                            </div>
                            <p className="v-meaning">{v.tr}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BACK: GRAMMAR PATTERNS */}
                  <div className="study-deck-back">
                    <div className="grammar-list">
                      {grammarPatterns.map((g, i) => (
                        <div key={i} className={`grammar-card-scene ${flippedGrammarCards[i] ? 'g-is-flipped' : ''}`}
                             onClick={(e) => {
                               if (e.target.closest('.g-found-tag')) return;
                               setFlippedGrammarCards(prev => ({...prev, [i]: !prev[i]}));
                             }}>
                          <div className="grammar-card-inner">
                            <div className="grammar-card-front grammar-item-card">
                              <div className="grammar-card-header">
                                <h3 className="g-title">{g.title}</h3>
                                <span className="g-flip-hint"><i className="fa-solid fa-language"></i> Tıkla: Açıklama</span>
                              </div>
                              <p className="g-desc">{g.description}</p>
                              <div className="g-examples">
                                {g.examples?.map((ex, ei) => (
                                  <div key={ei} className="g-example-item">
                                    <p className="ex-en">{ex.en}</p>
                                    <p className="ex-tr">{ex.tr}</p>
                                  </div>
                                ))}
                              </div>
                              {g.found_in_text && (
                                <div className="g-found-tag" onClick={(e) => {
                                  e.stopPropagation();
                                  const targetText = g.found_in_text;
                                  setStudyHighlight(prev => prev === targetText ? null : targetText);
                                  setTimeout(() => {
                                    const activeEl = document.querySelector('.study-highlight-active');
                                    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  }, 100);
                                }}>
                                  <i className="fa-solid fa-magnifying-glass"></i> Metinde Göster
                                </div>
                              )}
                            </div>
                            <div className="grammar-card-back grammar-item-card academic-tr-bg">
                              <div className="grammar-card-header">
                                <h3 className="g-title" style={{ color: 'var(--accent)' }}>{g.title} (Açıklama)</h3>
                                <span className="g-flip-hint">Geri Dön <i className="fa-solid fa-rotate"></i></span>
                              </div>
                              <div className="g-tr-content">
                                <p>{g.description_tr || "Açıklama hazırlanıyor..."}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer: ipucu + tek CTA (quiz akışına götürür) */}
          <div className="reading-footer">
            <p className="reading-footer-hint">Kelimeye dokun, anlamını gör</p>
            <button
              onClick={generateQuiz}
              className="reading-footer-cta"
              disabled={quizLoading || isFinished || text.length < 50}
            >
              {quizLoading ? "Hazırlanıyor..." : isFinished ? "Test Tamamlandı" : "Anladım, Sınava Geç"}
            </button>
          </div>

          {isFinished && (
            <div className="glass-card animate-fadeIn" style={{ border: '1px solid var(--accent)', background: 'rgba(48, 209, 88, 0.1)', marginTop: 20 }}>
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
                  <p className="quiz-q-text"><b>{i + 1}.</b> {q.q}</p>
                  <div className="quiz-options-col">
                    {['a', 'b', 'c', 'd'].map(opt => {
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
        <div className="reading-empty-state">
          {generating ? "İçerik hazırlanıyor..." : "Ayarlar'dan bir kaynak ve konu seçip başla."}
        </div>
      )}

      {/* ───── AYARLAR SHEET ───── */}
      {(settingsOpen || !text.trim()) && (
        <div
          className="reading-settings-overlay"
          onClick={() => text.trim() && setSettingsOpen(false)}
        >
          <div className="reading-settings-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle"></div>

            <div className="settings-block">
              <div className="settings-label">KAYNAK</div>
              <div className="segmented">
                <button
                  className={`segmented-btn ${sourceMode === "wikipedia" ? "active" : ""}`}
                  onClick={() => { setSourceMode("wikipedia"); setTopic("random"); }}
                >
                  Wikipedia
                </button>
                <button
                  className={`segmented-btn ${sourceMode === "ai" ? "active" : ""}`}
                  onClick={() => { setSourceMode("ai"); setTopic("random"); }}
                >
                  AI Üret
                </button>
              </div>
            </div>

            {sourceMode === "ai" && (
              <div className="settings-block">
                <div className="settings-label">SEVİYE</div>
                <div className="segmented">
                  {["A2", "B1", "B2", "C1"].map((lv) => (
                    <button
                      key={lv}
                      className={`segmented-btn ${level === lv ? "active" : ""}`}
                      onClick={() => setLevel(lv)}
                    >
                      {lv}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="settings-block">
              <div className="settings-label">KONU</div>
              <select className="settings-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
                {topicOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            <button className="settings-submit-btn" onClick={applySettings} disabled={generating}>
              {generating ? "Hazırlanıyor..." : "Metni Getir"}
            </button>

            {text.trim() && (
              <>
                <div className="settings-divider"></div>

                <button className="settings-toggle-row" onClick={() => setShowTranslation(!showTranslation)}>
                  <span>Türkçe Göster</span>
                  <span className={`mini-toggle ${showTranslation ? "on" : ""}`}><span className="mini-toggle-dot"></span></span>
                </button>

                <button
                  className="settings-audio-btn"
                  onClick={() => (isReading ? stopReading() : startReading())}
                  disabled={isBuffering}
                >
                  {isBuffering ? "Yükleniyor..." : isReading ? "Sesli Okumayı Durdur" : "Sesli Oku"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {showResultCard && (
        <div className="responsive-lookup-overlay" onClick={() => setShowResultCard(false)}>
          <div className="responsive-lookup-card animate-slideUp" onClick={e => e.stopPropagation()}>
            <div className="sheet-handle"></div>
            <div className="card-header-minimal">
              <span>Hızlı Sözlük</span>
              <button onClick={() => setShowResultCard(false)} className="btn-close-minimal">Kapat</button>
            </div>

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

      <style jsx>{`
        .reading-page {
          max-width: 760px;
          margin: 0 auto;
          padding-bottom: 60px;
        }

        .reading-status-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 4px 0;
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-muted);
        }
        .reading-status-strip a {
          color: var(--accent);
          font-weight: 700;
          text-decoration: none;
        }
        .reading-status-strip a:hover { text-decoration: underline; }
        .reading-status-dot { opacity: 0.5; }

        /* Header */
        .reading-header-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 16px 4px;
          border-bottom: 1px solid var(--border);
          margin-bottom: 8px;
        }
        .reading-header-back {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
          text-decoration: none;
          flex-shrink: 0;
        }
        .reading-header-back:hover { color: var(--text); }
        .reading-header-title {
          flex: 1;
          text-align: center;
          font-size: 0.95rem;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
        }
        .reading-header-settings {
          background: none;
          border: none;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--accent);
          cursor: pointer;
          flex-shrink: 0;
        }

        /* Body */
        .reading-body {
          padding: 36px 24px;
          font-size: 17px;
          line-height: 1.9;
          color: var(--text);
        }
        .reading-translation-block {
          margin-top: 28px;
          padding-top: 24px;
          border-top: 1px dashed var(--border);
        }
        .reading-translation-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
        }
        .reading-translation-p {
          font-size: 15px;
          line-height: 1.8;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .reading-source-credit { text-align: center; margin: 4px 0 20px; }
        .reading-source-credit a {
          font-size: 0.75rem; color: var(--text-muted); text-decoration: none;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .reading-source-credit a:hover { color: var(--accent); }

        .reading-empty-state {
          text-align: center;
          padding: 80px 20px;
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        /* Footer */
        .reading-footer {
          text-align: center;
          padding: 24px 20px 8px;
        }
        .reading-footer-hint {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        .reading-footer-cta {
          background: var(--accent);
          color: #000;
          font-weight: 800;
          font-size: 0.9rem;
          padding: 14px 32px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
        }
        .reading-footer-cta:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Settings Sheet */
        .reading-settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(6px);
          z-index: 5000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .reading-settings-sheet {
          width: 100%;
          max-width: 480px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px 24px 0 0;
          padding: 20px 24px 28px;
          box-shadow: 0 -20px 50px rgba(0, 0, 0, 0.35);
        }
        @media (min-width: 640px) {
          .reading-settings-overlay { align-items: center; }
          .reading-settings-sheet { border-radius: 24px; }
        }
        .settings-block { margin-bottom: 18px; }
        .settings-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          color: var(--text-muted);
          margin-bottom: 8px;
        }
        .segmented {
          display: flex;
          gap: 6px;
          background: var(--glass);
          border-radius: 12px;
          padding: 4px;
        }
        .segmented-btn {
          flex: 1;
          background: none;
          border: none;
          padding: 10px;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
        }
        .segmented-btn.active { background: var(--accent); color: #000; }
        .settings-select {
          width: 100%;
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.9rem;
          color: var(--text);
        }
        .settings-submit-btn {
          width: 100%;
          background: var(--accent);
          color: #000;
          font-weight: 800;
          font-size: 0.9rem;
          padding: 14px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
        }
        .settings-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .settings-divider { height: 1px; background: var(--border); margin: 18px 0; }
        .settings-toggle-row {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: none;
          border: none;
          padding: 10px 0;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
        }
        .mini-toggle {
          width: 34px; height: 20px; border-radius: 20px; background: var(--glass);
          border: 1px solid var(--border); position: relative; display: inline-block;
        }
        .mini-toggle-dot {
          position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%;
          background: var(--text-muted); transition: all 0.2s;
        }
        .mini-toggle.on { background: var(--accent); border-color: var(--accent); }
        .mini-toggle.on .mini-toggle-dot { background: #000; transform: translateX(14px); }
        .settings-audio-btn {
          width: 100%;
          background: none;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 12px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text);
          cursor: pointer;
          margin-top: 10px;
        }
        .settings-audio-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Study Deck */
        .study-deck-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .study-deck-title { display: flex; align-items: center; gap: 10px; font-weight: 900; color: #fff; font-size: 1.1rem; }
        .study-deck-title i { color: var(--accent); }
        .study-flip-toggle {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
          color: #fff; padding: 8px 16px; border-radius: 12px; font-size: 0.75rem; font-weight: 700;
          display: flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s;
        }
        .study-flip-toggle:hover { background: rgba(255,255,255,0.1); border-color: var(--accent); }
        .study-flip-toggle i { font-size: 0.8rem; }

        .study-deck-scene { perspective: 1500px; display: grid; position: relative; margin-bottom: 40px; }
        .study-deck-inner {
          display: grid;
          grid-template-columns: 1fr;
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .study-deck-scene.is-flipped .study-deck-inner { transform: rotateY(180deg); }

        .study-deck-front, .study-deck-back {
          grid-area: 1 / 1;
          backface-visibility: hidden;
          border-radius: 24px;
          height: fit-content;
        }
        .study-deck-back { transform: rotateY(180deg); }

        /* Vocabulary Cards */
        .vocab-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        .vocab-item-card {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 20px; transition: all 0.3s ease;
        }
        .vocab-item-card:hover { transform: translateY(-4px); border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.05); }
        .vocab-card-header { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
        .v-icon-btn {
          background: none; border: none; color: #666; cursor: pointer; font-size: 0.9rem; transition: color 0.2s;
        }
        .v-icon-btn:hover { color: var(--accent); }
        .v-word-row { margin-bottom: 8px; }
        .v-type { font-size: 0.65rem; color: #888; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
        .v-word { font-size: 1.2rem; font-weight: 900; color: #fff; margin: 2px 0; }
        .v-meaning { font-size: 0.9rem; color: #aaa; margin: 0; line-height: 1.4; }

        /* Grammar Cards */
        .grammar-card-scene {
          perspective: 1200px;
          cursor: pointer;
          margin-bottom: 8px;
        }
        .grammar-card-inner {
          display: grid;
          grid-template-areas: "stack";
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .grammar-card-scene.g-is-flipped .grammar-card-inner { transform: rotateY(180deg); }

        .grammar-card-front, .grammar-card-back {
          grid-area: stack;
          width: 100%;
          backface-visibility: hidden;
          border-radius: 16px;
        }

        .grammar-card-front { z-index: 2; transform: rotateY(0deg); }

        .grammar-card-back {
          transform: rotateY(180deg);
          z-index: 1;
          background: rgba(226, 183, 20, 0.08) !important;
        }

        .grammar-list { display: flex; flex-direction: column; gap: 10px; }
        .grammar-item-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 16px 20px;
          position: relative;
        }
        .academic-tr-bg { background: rgba(226, 183, 20, 0.05) !important; border-color: rgba(226, 183, 20, 0.2) !important; }
        .g-flip-hint { font-size: 0.65rem; color: var(--accent); font-weight: 700; text-transform: uppercase; }
        .g-tr-content { font-size: 0.95rem; color: #fff; line-height: 1.6; padding: 10px 0; }
        .grammar-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .g-title { font-size: 1.1rem; font-weight: 900; color: #fff; margin: 0; }
        .g-desc { font-size: 0.9rem; color: #aaa; line-height: 1.6; margin-bottom: 20px; }
        .g-examples { display: flex; flex-direction: column; gap: 12px; }
        .g-example-item { padding-left: 12px; border-left: 3px solid var(--accent); }
        .ex-en { font-size: 0.95rem; font-weight: 700; color: #fff; margin-bottom: 4px; }
        .ex-tr { font-size: 0.85rem; color: #888; font-style: italic; }

        .g-found-tag {
          display: inline-flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800;
          color: var(--accent); background: rgba(226,183,20,0.1); padding: 4px 10px; border-radius: 8px;
          margin-top: 8px; text-transform: uppercase;
        }

        /* Highlight Styles */
        :global(.study-highlight-active) {
          background: rgba(226,183,20,0.3) !important;
          color: #fff !important;
          border-radius: 4px;
          box-shadow: 0 0 15px rgba(226,183,20,0.4);
          transition: all 0.3s ease;
          padding: 2px 0;
        }
        .vocab-item-card.active-highlight, .grammar-item-card.active-highlight {
          border-color: var(--accent);
          background: rgba(226,183,20,0.08);
          transform: scale(1.02);
        }

        .reading-sentence {
          transition: background 0.3s ease;
          border-radius: 8px;
          padding: 4px 6px;
          margin: 2px -4px;
          display: inline;
          line-height: 1.9;
        }
        .sentence-active {
          background: rgba(0, 162, 255, 0.15) !important;
          box-shadow: 0 0 0 2px rgba(0, 162, 255, 0.1);
        }

        :global(.audio-highlight-active) {
          background: #00a2ff !important;
          box-shadow: 0 0 20px rgba(0, 162, 255, 0.7);
          border-radius: 4px;
          color: #fff !important;
          transition: all 0.05s ease;
          position: relative;
          z-index: 10;
          padding: 0 4px;
          margin: 0 -2px;
        }

        @media (max-width: 640px) {
          .reading-body {
            padding: 16px 18px;
            font-size: 14px;
            line-height: 1.8;
          }
          .reading-sentence { line-height: 1.8; }
          .vocab-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
