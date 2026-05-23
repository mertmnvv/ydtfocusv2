"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, updateUserWord } from "@/lib/firestore";
import Link from "next/link";
import { playSuccessSound, playErrorSound } from "@/lib/sounds";

export default function SrsFlashcardsPage() {
  const { user, loading: authLoading } = useAuth();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [aiSentence, setAiSentence] = useState(null);
  const [fetchingAi, setFetchingAi] = useState(false);
  const [cardExiting, setCardExiting] = useState(false);
  
  // Undo Mechanism
  const [undoData, setUndoData] = useState(null);
  const undoTimeoutRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadWords();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadWords = async () => {
    try {
      const allWords = await getUserWords(user.uid);
      const now = Date.now();
      // Yalnızca öğrenilmemiş veya tekrar vakti gelmiş kelimeler
      const due = allWords.filter(w => (w.level || 0) < 4 && (w.nextReview || 0) <= now);
      // Rastgele karıştır
      const shuffled = due.sort(() => Math.random() - 0.5);
      setWords(shuffled);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiContext = async (word, meaning) => {
    setFetchingAi(true);
    setAiSentence(null);
    try {
      const res = await fetch("/api/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: "You are an English teacher." },
            { role: "user", content: `Create a single B2-C1 level English example sentence for the word "${word}" (meaning: ${meaning}). Return ONLY the sentence.` }
          ]
        })
      });
      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        setAiSentence(data.choices[0].message.content.trim());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setFetchingAi(false);
    }
  };

  const handleCardClick = () => {
    if (!isFlipped && words[currentIndex]) {
      setIsFlipped(true);
      if (!aiSentence && !fetchingAi) {
        fetchAiContext(words[currentIndex].word, words[currentIndex].meaning);
      }
    }
  };

  const playAudio = (text, e) => {
    if (e) e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAssessment = async (knewIt) => {
    if (cardExiting) return;
    
    const currentWord = words[currentIndex];
    if (!currentWord) return;

    if (knewIt) playSuccessSound();
    else playErrorSound();

    // Snapshot for Undo
    const snapshot = {
      word: { ...currentWord },
      aiSentence: aiSentence,
      knewIt: knewIt
    };

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    setUndoData(snapshot);
    undoTimeoutRef.current = setTimeout(() => {
      setUndoData(null);
    }, 5000);

    // Calculate new SRS stats
    let newLevel = currentWord.level || 0;
    let correctCount = currentWord.correctCount || 0;
    let wrongCount = currentWord.wrongCount || 0;
    let nextReview = Date.now();

    if (knewIt) {
      newLevel = Math.min(4, newLevel + 1);
      correctCount += 1;
      nextReview = Date.now() + (newLevel + 1) * 24 * 60 * 60 * 1000;
    } else {
      newLevel = 0;
      wrongCount += 1;
      nextReview = Date.now() + 5 * 60 * 1000;
    }

    try {
      await updateUserWord(user.uid, currentWord.id, {
        level: newLevel,
        correctCount,
        wrongCount,
        nextReview
      });
    } catch (err) {
      console.error(err);
    }

    setCardExiting(true);
    setTimeout(() => {
      setCardExiting(false);
      setIsFlipped(false);
      setAiSentence(null);
      setCurrentIndex(prev => prev + 1);
    }, 300);
  };

  const handleUndo = async () => {
    if (!undoData) return;
    
    // Restore previous state in database
    const { word, aiSentence: savedAi } = undoData;
    
    try {
      await updateUserWord(user.uid, word.id, {
        level: word.level,
        correctCount: word.correctCount,
        wrongCount: word.wrongCount,
        nextReview: word.nextReview
      });
      
      setCurrentIndex(prev => Math.max(0, prev - 1));
      setIsFlipped(true); // Keep it flipped so they see the result again
      setAiSentence(savedAi);
      setUndoData(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    } catch (err) {
      console.error("Undo failed:", err);
    }
  };

  if (authLoading || loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!user) {
    return (
      <div className="glass-card" style={{ textAlign: "center", padding: "60px 20px", marginTop: 40, maxWidth: 500, margin: "40px auto" }}>
        <i className="fa-solid fa-lock" style={{ fontSize: '3rem', color: 'var(--accent)', marginBottom: 20 }}></i>
        <h3 style={{ fontWeight: 800, marginBottom: 12, fontSize: '1.5rem' }}>Flashcardlara Erişmek İçin Kayıt Olmalısın</h3>
        <p className="hint-text" style={{ marginBottom: 24 }}>Kelime bankanızdaki kelimelerle pratik yapmak için giriş yapmalısınız.</p>
        <button onClick={() => window.location.href='/login'} className="btn-primary" style={{ padding: '14px 32px' }}>Giriş Yap / Kayıt Ol</button>
      </div>
    );
  }

  if (words.length === 0 || currentIndex >= words.length) {
    return (
      <div className="fc-empty-state">
        <div className="glass-card result-card">
          <div className="result-icon-circle"><i className="fa-solid fa-check-double"></i></div>
          <h2>Harika İş Çıkardın!</h2>
          <p>Şu an tekrar etmen gereken kelime kalmadı.</p>
          <Link href="/dashboard" className="btn-primary" style={{ marginTop: 24, padding: "16px 32px", display: "inline-block" }}>
            Dashboard'a Dön
          </Link>
        </div>
        <style jsx>{`
          .fc-empty-state { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; text-align: center; }
          .result-card { padding: 40px; max-width: 400px; width: 100%; animation: popIn 0.5s ease; }
          .result-icon-circle { width: 80px; height: 80px; background: rgba(48, 209, 88, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary); margin: 0 auto 20px; font-size: 2rem; }
          .result-card h2 { font-size: 1.8rem; font-weight: 900; margin-bottom: 8px; }
          .result-card p { color: var(--text-muted); }
          @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="fc-srs-container">
      <div className="fc-header">
        <Link href="/dashboard" className="back-btn"><i className="fa-solid fa-arrow-left"></i> Dashboard</Link>
        <div className="fc-progress-bar">
          <div className="fc-progress-fill" style={{ width: `${((currentIndex) / words.length) * 100}%` }}></div>
        </div>
        <div className="fc-counter">{currentIndex + 1} / {words.length}</div>
      </div>

      <div className="fc-scene">
        <div className={`fc-card ${isFlipped ? 'is-flipped' : ''} ${cardExiting ? 'is-exiting' : ''}`} onClick={handleCardClick}>
          <div className="fc-card-face fc-front">
            <span className="fc-hint-text">Çevirmek için dokun</span>
            <div className="fc-word">{currentWord.word}</div>
            <button className="fc-audio-btn" onClick={(e) => playAudio(currentWord.word, e)}>
              <i className="fa-solid fa-volume-high"></i>
            </button>
          </div>
          <div className="fc-card-face fc-back">
            <div className="fc-word-small">{currentWord.word}</div>
            <div className="fc-meaning">{currentWord.meaning}</div>
            
            <div className="fc-ai-box">
              <div className="fc-ai-label"><i className="fa-solid fa-sparkles"></i> AI Context</div>
              {fetchingAi ? (
                <div className="fc-ai-loading"><div className="spinner-ring" style={{ width: 24, height: 24, borderWidth: 2 }}></div></div>
              ) : aiSentence ? (
                <div className="fc-ai-text">{aiSentence}</div>
              ) : (
                <div className="fc-ai-text" style={{ opacity: 0.5 }}>Yüklenemedi</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fc-controls" style={{ opacity: isFlipped ? 1 : 0, pointerEvents: isFlipped ? 'all' : 'none' }}>
        <button className="fc-action-btn fc-wrong" onClick={() => handleAssessment(false)}>
          <i className="fa-solid fa-xmark"></i> Bilemedim
        </button>
        <button className="fc-action-btn fc-correct" onClick={() => handleAssessment(true)}>
          <i className="fa-solid fa-check"></i> Bildim
        </button>
      </div>

      {undoData && (
        <div className="undo-toast">
          <span>Yanlışlıkla mı tıkladın?</span>
          <button className="undo-btn" onClick={handleUndo}>Geri Al</button>
        </div>
      )}

      <style jsx>{`
        .fc-srs-container { height: 100vh; display: flex; flex-direction: column; background: var(--bg); overflow: hidden; }
        .fc-header { display: flex; align-items: center; gap: 20px; padding: 24px 32px; z-index: 10; }
        .back-btn { color: var(--text-muted); font-size: 1rem; transition: 0.2s; font-weight: 700; display: flex; align-items: center; gap: 8px; text-decoration: none; }
        .back-btn:hover { color: var(--text); }
        .fc-progress-bar { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
        .fc-progress-fill { height: 100%; background: var(--accent); transition: width 0.3s; }
        .fc-counter { font-weight: 700; color: var(--text-muted); font-size: 0.9rem; }

        .fc-scene { flex: 1; display: flex; align-items: center; justify-content: center; perspective: 1000px; padding: 20px; z-index: 5; }
        .fc-card { width: 100%; max-width: 400px; height: 500px; position: relative; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; cursor: pointer; }
        .fc-card.is-flipped { transform: rotateY(180deg); }
        .fc-card.is-exiting { transform: scale(0.9) translateY(50px); opacity: 0; pointer-events: none; }
        
        .fc-card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: var(--glass); border: 1px solid rgba(255,255,255,0.1); border-radius: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.4); backdrop-filter: blur(20px); }
        .fc-back { transform: rotateY(180deg); justify-content: center; padding-top: 40px; }
        
        .fc-hint-text { position: absolute; top: 32px; font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .fc-word { font-size: 3.5rem; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; color: var(--text); }
        .fc-audio-btn { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); width: 64px; height: 64px; border-radius: 50%; color: var(--accent); font-size: 1.5rem; cursor: pointer; transition: 0.2s; }
        .fc-audio-btn:hover { background: var(--accent); color: #000; transform: scale(1.1); }
        
        .fc-word-small { font-size: 1.5rem; font-weight: 800; color: var(--text-muted); margin-bottom: 8px; }
        .fc-meaning { font-size: 2.5rem; font-weight: 900; color: var(--primary); margin-bottom: 30px; line-height: 1.1; }
        
        .fc-ai-box { background: rgba(0,0,0,0.2); border-radius: 20px; padding: 24px; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,0.05); min-height: 120px; }
        .fc-ai-label { font-size: 0.8rem; color: var(--accent); font-weight: 800; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        .fc-ai-text { font-size: 1.1rem; line-height: 1.6; font-style: italic; color: rgba(255,255,255,0.9); }
        .fc-ai-loading { display: flex; justify-content: center; padding: 20px 0; }

        .fc-controls { display: flex; justify-content: center; gap: 16px; padding: 32px; transition: opacity 0.3s; z-index: 10; }
        .fc-action-btn { flex: 1; max-width: 200px; padding: 20px; border-radius: 20px; font-size: 1.2rem; font-weight: 900; border: none; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 12px; }
        .fc-wrong { background: rgba(255, 69, 58, 0.1); color: #ff453a; border: 1px solid rgba(255, 69, 58, 0.3); }
        .fc-correct { background: rgba(48, 209, 88, 0.1); color: #30d158; border: 1px solid rgba(48, 209, 88, 0.3); }
        .fc-wrong:hover { background: #ff453a; color: #fff; transform: translateY(-4px); }
        .fc-correct:hover { background: #30d158; color: #fff; transform: translateY(-4px); }

        .undo-toast { position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%); background: var(--bg-elevated); border: 1px solid var(--border); padding: 12px 24px; border-radius: 100px; display: flex; align-items: center; gap: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); z-index: 100; }
        .undo-toast span { color: var(--text); font-weight: 700; font-size: 0.95rem; }
        .undo-btn { background: var(--accent); color: #000; border: none; padding: 8px 16px; border-radius: 100px; font-weight: 800; cursor: pointer; transition: 0.2s; }
        .undo-btn:hover { transform: scale(1.05); }

        @keyframes slideUp { from { transform: translate(-50%, 50px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }

        @media (max-width: 768px) {
          .fc-header { padding: 20px; }
          .fc-card { height: 450px; }
          .fc-word { font-size: 2.8rem; }
          .fc-meaning { font-size: 2rem; }
          .fc-controls { padding: 20px; gap: 12px; }
          .fc-action-btn { padding: 16px; font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}
