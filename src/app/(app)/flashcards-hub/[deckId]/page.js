"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateUserDeck } from "@/lib/firestore";
import { motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function SwipeGamePage() {
  const { user } = useAuth();
  const params = useParams();
  const deckId = params.deckId;

  const [cards, setCards] = useState([]);
  const [deckName, setDeckName] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [direction, setDirection] = useState(0);
  const [results, setResults] = useState({ known: 0, unknown: 0 });
  const [unknownPile, setUnknownPile] = useState([]);
  const [finished, setFinished] = useState(false);

  // Drag physics & Visual Reactions
  const controls = useAnimation();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  
  // Opacity maps for visual feedback while dragging
  const rightOpacity = useTransform(x, [20, 150], [0, 1]);
  const leftOpacity = useTransform(x, [-20, -150], [0, 1]);

  useEffect(() => {
    if (user && deckId) loadDeck();
  }, [user, deckId]);

  const loadDeck = async () => {
    try {
      const ref = doc(db, "users", user.uid, "flashcardDecks", deckId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setDeckName(data.name || "Deste");
        const shuffled = [...(data.cards || [])].sort(() => Math.random() - 0.5);
        setCards(shuffled);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSwipe = useCallback(async (dir) => {
    if (direction !== 0) return; // Prevent double trigger
    setDirection(dir);
    setFlipped(false);

    // Animate out
    await controls.start({
      x: dir === 1 ? window.innerWidth : -window.innerWidth,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeIn" }
    });

    const card = cards[currentIndex];
    if (dir === 1) {
      setResults(p => ({ ...p, known: p.known + 1 }));
    } else {
      setResults(p => ({ ...p, unknown: p.unknown + 1 }));
      setUnknownPile(p => [...p, card]);
    }

    if (currentIndex + 1 >= cards.length) {
      setFinished(true);
      if (user) {
        const updatedCards = cards.map((c, i) => {
          if (i === currentIndex) return { ...c, status: dir === 1 ? "known" : "unknown" };
          return c;
        });
        updateUserDeck(user.uid, deckId, {
          cards: updatedCards,
          lastStudied: Date.now(),
          totalStudied: (results.known + results.unknown + 1)
        }).catch(console.error);
      }
    } else {
      setCurrentIndex(p => p + 1);
      // Reset position and animate pop-up for the new top card
      x.set(0);
      y.set(0);
      controls.set({ x: 0, y: 0, opacity: 1, scale: 0.95, y: 20 });
      controls.start({ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
    setDirection(0);
  }, [currentIndex, cards, results, user, deckId, controls, direction, x, y]);

  const onDragEnd = useCallback(async (e, info) => {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 100;
    
    if (offset > threshold || velocity > 500) {
      handleSwipe(1);
    } else if (offset < -threshold || velocity < -500) {
      handleSwipe(-1);
    } else {
      // Snap back securely using animation controls
      controls.start({ x: 0, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
    }
  }, [handleSwipe, controls]);

  const playAudio = (text, e) => {
    if (e) e.stopPropagation();
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (cards.length === 0) {
    return (
      <div className="sg-empty">
        <div className="glass-card" style={{ padding: 40, textAlign: "center", maxWidth: 400 }}>
          <h2>Bu deste boş</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Önce desteye kelime eklemelisin.</p>
          <Link href="/flashcards-hub" className="sg-back-link">← Geri Dön</Link>
        </div>
        <style jsx>{`
          .sg-empty { height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
          .sg-back-link { display: inline-block; margin-top: 20px; color: var(--accent); font-weight: 700; }
        `}</style>
      </div>
    );
  }

  if (finished) {
    const total = results.known + results.unknown;
    const pct = total > 0 ? Math.round((results.known / total) * 100) : 0;
    return (
      <div className="sg-result">
        <div className="sg-result-card">
          <div className="sg-result-icon">
            <i className={`fa-solid ${pct >= 80 ? "fa-trophy" : pct >= 50 ? "fa-fire" : "fa-book-open"}`}></i>
          </div>
          <h2>Çalışma Tamamlandı!</h2>
          <p className="sg-deck-label">{deckName}</p>
          <div className="sg-result-stats">
            <div className="sg-rs known"><span className="sg-rs-val">{results.known}</span><span className="sg-rs-label">Bildim</span></div>
            <div className="sg-rs pct"><span className="sg-rs-val">%{pct}</span><span className="sg-rs-label">Başarı</span></div>
            <div className="sg-rs unknown"><span className="sg-rs-val">{results.unknown}</span><span className="sg-rs-label">Bilemedim</span></div>
          </div>
          {unknownPile.length > 0 && (
            <div className="sg-unknown-list">
              <h4>Tekrar Etmen Gerekenler</h4>
              {unknownPile.map((c, i) => (
                <div key={i} className="sg-unknown-item">
                  <strong>{c.word}</strong> <span>{c.meaning}</span>
                </div>
              ))}
            </div>
          )}
          <Link href="/flashcards-hub" className="sg-done-btn">Hub'a Dön</Link>
        </div>
        <style jsx>{`
          .sg-result { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); padding: 20px; }
          .sg-result-card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 28px; padding: 40px; max-width: 440px; width: 100%; text-align: center; animation: popIn .5s ease; backdrop-filter: blur(20px); }
          .sg-result-icon { width: 72px; height: 72px; border-radius: 50%; background: rgba(226,183,20,.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.8rem; color: var(--accent); }
          .sg-result-card h2 { font-size: 1.7rem; font-weight: 900; margin-bottom: 4px; }
          .sg-deck-label { color: var(--text-muted); font-weight: 700; font-size: .9rem; margin-bottom: 24px; }
          .sg-result-stats { display: flex; justify-content: center; gap: 24px; margin-bottom: 24px; }
          .sg-rs { display: flex; flex-direction: column; align-items: center; gap: 4px; }
          .sg-rs-val { font-size: 1.8rem; font-weight: 900; }
          .sg-rs-label { font-size: .75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
          .sg-rs.known .sg-rs-val { color: var(--primary); }
          .sg-rs.unknown .sg-rs-val { color: #ff453a; }
          .sg-rs.pct .sg-rs-val { color: var(--accent); }
          .sg-unknown-list { background: rgba(0,0,0,.2); border-radius: 16px; padding: 16px; text-align: left; margin-bottom: 24px; max-height: 200px; overflow-y: auto; }
          .sg-unknown-list h4 { font-size: .8rem; color: var(--text-muted); text-transform: uppercase; margin-bottom: 10px; letter-spacing: .5px; }
          .sg-unknown-item { padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,.05); font-size: .9rem; display: flex; gap: 8px; }
          .sg-unknown-item strong { color: var(--text); }
          .sg-unknown-item span { color: var(--text-muted); }
          .sg-done-btn { display: inline-block; margin-top: 8px; padding: 16px 40px; border-radius: 14px; background: var(--accent); color: #000; font-weight: 800; font-size: 1rem; text-decoration: none; transition: .2s; }
          .sg-done-btn:hover { transform: translateY(-2px); }
          @keyframes popIn { from { transform: scale(.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        `}</style>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="sg-page">
      {/* Header */}
      <div className="sg-header">
        <Link href="/flashcards-hub" className="sg-exit"><i className="fa-solid fa-arrow-left"></i></Link>
        <div className="sg-progress">
          <div className="sg-progress-fill" style={{ width: `${((currentIndex) / cards.length) * 100}%` }}></div>
        </div>
        <span className="sg-count">{currentIndex + 1}/{cards.length}</span>
      </div>

      {/* Swipe Area */}
      <div className="sg-arena" style={{ position: "relative", width: "100%", maxWidth: 460, margin: "0 auto", height: "60vh", minHeight: 480, maxHeight: 600 }}>
        {cards.length > currentIndex + 2 && (
          <div className="sg-stack-layer" style={{ transform: "translateY(24px) scale(0.92)", zIndex: -2, opacity: 0.3 }}></div>
        )}

        {/* Tinder Stack Architecture: Render top 2 cards */}
        {cards.slice(currentIndex, currentIndex + 2).reverse().map((c, idx, arr) => {
          const isTop = idx === arr.length - 1; // reversed array means last element is top

          if (!isTop) {
            // Static Back Card
            return (
              <motion.div
                key={c.word + "_back"}
                className="sg-swipe-card"
                style={{ position: "absolute", zIndex: 0, scale: 0.95, y: 20, opacity: 0.8 }}
              >
                <div className="sg-card-inner">
                  <div className="sg-face sg-front">
                    <div className="sg-word">{c.word}</div>
                  </div>
                </div>
              </motion.div>
            );
          }

          // Active Top Card
          return (
            <motion.div
              key={c.word + "_front"}
              className="sg-swipe-card"
              style={{ x, y, rotate, position: "absolute", zIndex: 10 }}
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              dragElastic={0.9}
              onDragEnd={onDragEnd}
              onClick={() => setFlipped(!flipped)}
              animate={controls}
              whileDrag={{ scale: 1.05, cursor: "grabbing" }}
            >
              <div className={`sg-card-inner ${flipped ? "flipped" : ""}`}>
                {/* Front Face */}
                <div className="sg-face sg-front">
                  {/* Visual Drag Reactions (Tinder style) */}
                  <motion.div className="sg-reaction right" style={{ opacity: rightOpacity }}>
                    BİLDİM
                  </motion.div>
                  <motion.div className="sg-reaction left" style={{ opacity: leftOpacity }}>
                    BİLEMEDİM
                  </motion.div>
                  
                  <span className="sg-hint">Kartı çevirmek için dokun</span>
                  <div className="sg-word">{c.word}</div>
                  <button className="sg-audio" onClick={(e) => playAudio(c.word, e)}>
                    <i className="fa-solid fa-volume-high"></i>
                  </button>
                  <span className="sg-swipe-hint"><span className="left">← BİLEMEDİM</span>  |  <span className="right">BİLDİM →</span></span>
                </div>
                {/* Back Face */}
                <div className="sg-face sg-back">
                  {/* Visual Drag Reactions on back as well */}
                  <motion.div className="sg-reaction right" style={{ opacity: rightOpacity }}>
                    BİLDİM
                  </motion.div>
                  <motion.div className="sg-reaction left" style={{ opacity: leftOpacity }}>
                    BİLEMEDİM
                  </motion.div>

                  <div className="sg-back-word">{c.word}</div>
                  <div className="sg-back-meaning">{c.meaning}</div>
                  {c.sentence && (
                    <div className="sg-sentence-box">
                      <div className="sg-sentence-label"><i className="fa-solid fa-quote-left"></i> Örnek Cümle</div>
                      <div className="sg-sentence-text">{c.sentence}</div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="sg-actions">
        <button className="sg-act sg-unknown" onClick={() => handleSwipe(-1)}>
          <i className="fa-solid fa-xmark"></i>
        </button>
        <button className="sg-act sg-flip" onClick={() => setFlipped(!flipped)}>
          <i className="fa-solid fa-rotate"></i>
        </button>
        <button className="sg-act sg-known" onClick={() => handleSwipe(1)}>
          <i className="fa-solid fa-check"></i>
        </button>
      </div>

      <style jsx global>{`
        /* Native Full-Screen Feel */
        .sg-page { height: 100dvh; display: flex; flex-direction: column; background: var(--bg); overflow: hidden; position: relative; }
        
        .sg-header { display: flex; align-items: center; gap: 16px; padding: 20px 24px; position: relative; z-index: 100; }
        .sg-exit { color: var(--text-muted); font-size: 1.4rem; transition: .2s; text-decoration: none; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
        .sg-exit:hover { color: var(--text); background: var(--bg-elevated); }
        
        .sg-progress { flex: 1; height: 6px; background: var(--bg-elevated); border-radius: 4px; overflow: hidden; }
        .sg-progress-fill { height: 100%; background: var(--accent); transition: width .4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 4px; }
        .sg-count { font-weight: 700; color: var(--text-muted); font-size: .9rem; min-width: 44px; text-align: right; }

        .sg-arena { flex: 1; display: flex; align-items: center; justify-content: center; perspective: 1200px; padding: 20px; position: relative; z-index: 10; width: 100%; height: 100%; }
        
        /* Clean Stack Layers */
        .sg-stack-layer { position: absolute; width: 100%; max-width: 460px; height: 60vh; min-height: 480px; max-height: 600px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 32px; transition: all .4s cubic-bezier(0.34, 1.56, 0.64, 1); pointer-events: none; }
        
        .sg-swipe-card { width: 100%; max-width: 460px; height: 60vh; min-height: 480px; max-height: 600px; cursor: grab; user-select: none; -webkit-user-select: none; z-index: 10; position: relative; }
        .sg-swipe-card:active { cursor: grabbing; }
        .sg-card-inner { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform .6s cubic-bezier(.4,0,.2,1); }
        .sg-card-inner.flipped { transform: rotateY(180deg); }
        
        /* Glassmorphism Faces (Native Integration) */
        .sg-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; background: var(--bg-elevated); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid var(--border); border-radius: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 32px; text-align: center; box-shadow: 0 16px 40px rgba(0,0,0,.3); overflow: hidden; }
        
        .sg-back { transform: rotateY(180deg); justify-content: center; }

        .sg-hint { position: absolute; top: 32px; font-size: .75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; font-weight: 700; }
        
        .sg-word { font-size: 3.5rem; font-weight: 800; letter-spacing: -1px; color: var(--text); margin-bottom: 32px; line-height: 1.1; }
        
        .sg-audio { width: 64px; height: 64px; border-radius: 50%; background: var(--bg); border: 1px solid var(--border); color: var(--accent); font-size: 1.5rem; cursor: pointer; transition: all .3s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; align-items: center; justify-content: center; }
        .sg-audio:hover { background: var(--accent); color: #000; transform: scale(1.1); }
        
        .sg-swipe-hint { position: absolute; bottom: 32px; font-size: .75rem; color: var(--text-muted); font-weight: 600; opacity: .8; display: flex; gap: 24px; align-items: center; letter-spacing: 1px; }
        .sg-swipe-hint span.left { color: #ff453a; }
        .sg-swipe-hint span.right { color: #30d158; }
        
        /* Drag Reaction Overlays */
        .sg-reaction { position: absolute; top: 40px; padding: 8px 16px; border-radius: 12px; font-weight: 900; font-size: 1.5rem; text-transform: uppercase; letter-spacing: 2px; z-index: 20; pointer-events: none; }
        .sg-reaction.right { left: 40px; color: #30d158; border: 4px solid #30d158; transform: rotate(-15deg); background: rgba(48,209,88,.1); }
        .sg-reaction.left { right: 40px; color: #ff453a; border: 4px solid #ff453a; transform: rotate(15deg); background: rgba(255,69,58,.1); }

        .sg-back-word { font-size: 1.2rem; font-weight: 600; color: var(--text-muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .sg-back-meaning { font-size: 2.5rem; font-weight: 800; color: var(--accent); margin-bottom: 40px; line-height: 1.2; text-shadow: 0 4px 12px rgba(226,183,20,.15); }
        
        .sg-sentence-box { background: rgba(0,0,0,.2); border-radius: 20px; padding: 24px; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,.03); }
        .sg-sentence-label { font-size: .7rem; color: var(--accent); font-weight: 700; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; letter-spacing: 1px; }
        .sg-sentence-text { font-size: 1.1rem; line-height: 1.6; font-style: italic; color: rgba(255,255,255,.8); font-weight: 400; }

        .sg-actions { display: flex; justify-content: center; gap: 24px; padding: 32px; position: relative; z-index: 100; }
        .sg-act { width: 72px; height: 72px; border-radius: 50%; border: none; cursor: pointer; font-size: 1.6rem; transition: all .3s cubic-bezier(0.34, 1.56, 0.64, 1); display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border: 1px solid var(--border); }
        .sg-unknown { color: #ff453a; }
        .sg-unknown:hover { background: #ff453a; color: #fff; transform: scale(1.1); }
        .sg-flip { color: var(--text-muted); font-size: 1.4rem; width: 60px; height: 60px; margin-top: 6px; }
        .sg-flip:hover { background: var(--bg-elevated); color: var(--text); transform: scale(1.1); }
        .sg-known { color: #30d158; }
        .sg-known:hover { background: #30d158; color: #fff; transform: scale(1.1); }

        @media (max-width: 768px) {
          .sg-header { padding: 12px 16px; }
          .sg-arena { padding: 10px; flex: 1; }
          .sg-swipe-card, .sg-stack-layer { height: 50vh; min-height: 340px; max-width: calc(100vw - 32px); }
          .sg-face { padding: 20px 16px; }
          .sg-word { font-size: 2.2rem; margin-bottom: 20px; }
          .sg-back-meaning { font-size: 1.6rem; margin-bottom: 20px; }
          .sg-sentence-box { padding: 14px; }
          .sg-sentence-text { font-size: 0.95rem; }
          .sg-actions { padding: 12px 20px 24px; gap: 12px; }
          .sg-act { width: 56px; height: 56px; font-size: 1.2rem; }
          .sg-flip { width: 48px; height: 48px; font-size: 1.1rem; }
          .sg-reaction { font-size: 1.1rem; padding: 4px 10px; }
          .sg-reaction.right { left: 15px; top: 15px; }
          .sg-reaction.left { right: 15px; top: 15px; }
        }
      `}</style>
    </div>
  );
}
