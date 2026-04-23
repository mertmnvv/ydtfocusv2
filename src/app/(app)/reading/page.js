"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, addUserWord } from "@/lib/firestore";

export default function ReadingPage() {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [level, setLevel] = useState("B1");
  const [topic, setTopic] = useState("random");
  const [generating, setGenerating] = useState(false);
  const [myWords, setMyWords] = useState([]);
  const [wordInput, setWordInput] = useState("");
  const [meaningInput, setMeaningInput] = useState("");
  const [synInput, setSynInput] = useState("");
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const displayRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    getUserWords(user.uid).then(setMyWords).catch(console.error);
  }, [user]);

  // AI metin üretme
  async function generateAIText() {
    setGenerating(true);
    let prompt = "";
    const topicMap = {
      story: `Write a short fictional English story. Level: ${level} CEFR. Length: 120-180 words. Focus on a character overcoming a challenge. ONLY return the pure English text paragraph.`,
      science: `Write an English reading passage about a recent scientific discovery or nature. Level: ${level} CEFR. Length: 120-180 words. ONLY return the pure English text paragraph.`,
      exam: `Write a highly academic English reading passage like a YDT/TOEFL exam text. Level: ${level} CEFR. Topic: History, Sociology, or Psychology. Use advanced vocabulary and formal tone. Length: 150-200 words. ONLY return the pure text paragraph.`,
      random: `Write an English reading paragraph about interesting historical facts, psychology, or daily life. Level: ${level} CEFR. Length: 120-180 words. ONLY return the pure English text paragraph.`,
    };
    prompt = topicMap[topic] || topicMap.random;

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
      }
    } catch {
      setText("Yapay zeka bağlantısı sağlanamadı. Lütfen tekrar deneyin.");
    }
    setGenerating(false);
  }

  // Kelime detay çekme
  async function fetchDetails(word) {
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return;
    setWordInput(cleanWord);
    setMeaningInput("Aranıyor...");
    setSynInput("-");
    setFetchingDetails(true);

    try {
      const trans = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord }),
      });
      const transData = await trans.json();
      if (transData.en !== cleanWord) setWordInput(transData.en);
      setMeaningInput(transData.tr);

      const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${transData.en || cleanWord}`);
      if (dictRes.ok) {
        const dictData = await dictRes.json();
        let syns = [];
        dictData[0]?.meanings?.forEach(m => {
          if (m.synonyms?.length > 0) syns = [...syns, ...m.synonyms.filter(s => !s.includes(" ") && s.length < 15)];
        });
        if (syns.length > 0) setSynInput([...new Set(syns)].slice(0, 3).join(", "));
      }
    } catch {
      setSynInput("-");
    }
    setFetchingDetails(false);
  }

  // Kelime kaydetme
  async function saveWord() {
    if (!wordInput || !meaningInput || meaningInput === "Aranıyor...") return;
    if (myWords.some(w => w.word.toLowerCase() === wordInput.toLowerCase())) {
      return alert("Bu kelime zaten bankanızda!");
    }
    try {
      const id = await addUserWord(user.uid, {
        word: wordInput, meaning: meaningInput, syn: synInput || "-",
      });
      setMyWords(prev => [...prev, { id, word: wordInput, meaning: meaningInput, syn: synInput }]);
      setWordInput(""); setMeaningInput(""); setSynInput("");
    } catch {
      alert("Kelime kaydedilemedi.");
    }
  }

  // AI Quiz üretme
  async function generateQuiz() {
    if (!text || text.length < 50) return alert("Önce bir metin üretmelisiniz!");
    setQuizLoading(true);
    setQuizQuestions([]);

    const prompt = `Based on the text below, create exactly 3 multiple-choice questions. 
    Return ONLY a valid JSON object with key "questions" containing an array of 3 objects.
    Keys: "q", "a", "b", "c", "d", "correct" (value must be a, b, c, or d).
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
      alert("Quiz oluşturulurken hata oluştu. Tekrar deneyin.");
    }
    setQuizLoading(false);
  }

  function checkQuizAnswer(qIndex, selected) {
    setQuizQuestions(prev =>
      prev.map((q, i) => i === qIndex ? { ...q, answered: selected } : q)
    );
  }

  // Metin analiz render
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
            const isSaved = myWords.some(w => w.word.toLowerCase() === clean);
            let className = "hover-word";
            if (isSaved) className += " is-saved";
            return (
              <span key={ti} className={className} onClick={() => fetchDetails(clean)}>
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
      <h2 className="section-title">Metin Analizi</h2>

      {/* AI Metin Üretici */}
      <div className="glass-card">
        <div className="reading-controls">
          <select value={level} onChange={e => setLevel(e.target.value)} className="reading-select">
            <option value="A2">A2 — Kolay</option>
            <option value="B1">B1 — Orta</option>
            <option value="B2">B2 — İleri</option>
            <option value="C1">C1 — Akademik</option>
          </select>
          <select value={topic} onChange={e => setTopic(e.target.value)} className="reading-select">
            <option value="random">Rastgele</option>
            <option value="story">Hikaye</option>
            <option value="science">Bilim</option>
            <option value="exam">YDT Formatı</option>
          </select>
          <button onClick={generateAIText} className="btn-primary" disabled={generating}>
            {generating ? "Üretiliyor..." : "AI Metin Üret"}
          </button>
        </div>
      </div>

      {/* Metin Alanı */}
      <div className="glass-card">
        <textarea
          className="reading-textarea"
          placeholder="Yapay zeka ile metin üretin veya kendi metninizi yapıştırın..."
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
        />
      </div>

      {/* Analiz Çıktısı */}
      {text.trim() && (
        <div className="glass-card">
          <div className="header-split">
            <h3 className="section-title" style={{ marginBottom: 0, fontSize: "1.1rem" }}>
              Analiz Sonucu
            </h3>
            <span className="hint-text">Kelimeye tıkla → Detay gör → Bankana ekle</span>
          </div>
          <div className="reading-display" ref={displayRef}>
            {renderAnalysis()}
          </div>
        </div>
      )}

      {/* Kelime Ekleme */}
      <div className="glass-card">
        <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Kelime Ekle</h3>
        <div className="word-add-form">
          <input
            placeholder="Kelime"
            value={wordInput}
            onChange={e => setWordInput(e.target.value)}
            className="word-input"
          />
          <input
            placeholder="Anlam"
            value={meaningInput}
            onChange={e => setMeaningInput(e.target.value)}
            className="word-input"
          />
          <input
            placeholder="Eş Anlam"
            value={synInput}
            onChange={e => setSynInput(e.target.value)}
            className="word-input"
          />
          <button onClick={saveWord} className="btn-primary">
            {fetchingDetails ? "..." : "Kaydet"}
          </button>
        </div>
      </div>

      {/* AI Quiz */}
      {text.trim().length > 50 && (
        <div className="glass-card">
          <div className="header-split">
            <h3 className="section-title" style={{ marginBottom: 0, fontSize: "1.1rem" }}>
              AI Okuma Soruları
            </h3>
            <button onClick={generateQuiz} className="btn-primary" disabled={quizLoading}>
              {quizLoading ? "Hazırlanıyor..." : "Soru Üret"}
            </button>
          </div>

          {quizQuestions.map((q, i) => (
            <div key={i} className="quiz-card" style={{ marginTop: 16 }}>
              <p className="quiz-question">
                <span style={{ color: "var(--accent)", fontWeight: 800 }}>{i + 1}. </span>
                {q.q}
              </p>
              <div className="quiz-options-col">
                {["a", "b", "c", "d"].map(letter => {
                  let cls = "quiz-opt";
                  if (q.answered) {
                    if (letter === q.correct) cls += " correct-ans";
                    else if (letter === q.answered && letter !== q.correct) cls += " wrong-ans";
                  }
                  return (
                    <button
                      key={letter}
                      className={cls}
                      disabled={!!q.answered}
                      onClick={() => checkQuizAnswer(i, letter)}
                    >
                      <b style={{ color: "var(--accent)", marginRight: 8 }}>{letter.toUpperCase()})</b>
                      {q[letter]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Kelime Bankam */}
      <div className="glass-card">
        <h3 className="section-title" style={{ fontSize: "1.1rem" }}>
          Kelime Bankam ({myWords.length})
        </h3>
        <div className="word-list">
          {myWords.slice().reverse().slice(0, 20).map(w => (
            <div key={w.id} className="word-card-mini">
              <b>{w.word}</b>
              <span className="meaning-text">{w.meaning}</span>
              {w.syn && w.syn !== "-" && <span className="syn-text">{w.syn}</span>}
            </div>
          ))}
          {myWords.length === 0 && (
            <p className="hint-text" style={{ textAlign: "center", padding: 20 }}>
              Bankanız boş. Metindeki kelimelere tıklayarak ekleme yapabilirsiniz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
