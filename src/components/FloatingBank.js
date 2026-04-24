"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, deleteUserWord } from "@/lib/firestore";

export default function FloatingBank() {
  const { user, requireAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [words, setWords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !open) return;
    setLoading(true);
    getUserWords(user.uid)
      .then(w => setWords(w || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, open]);

  async function handleDelete(wordId) {
    try {
      await deleteUserWord(user.uid, wordId);
      setWords(prev => prev.filter(w => w.id !== wordId));
    } catch { /* silently fail */ }
  }

  function playAudio(text) {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  }

  const filtered = search.trim()
    ? words.filter(w =>
        w.word?.toLowerCase().includes(search.toLowerCase()) ||
        w.meaning?.toLowerCase().includes(search.toLowerCase())
      )
    : words;

  return (
    <>
      {/* FAB Button */}
      <button className="bank-fab" onClick={() => requireAuth(() => setOpen(!open))} title="Öğrenilen Kelimeler">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <span className="bank-fab-count">{words.length || "—"}</span>
      </button>

      {/* Centered Modal */}
      {open && (
        <div className="bank-modal-overlay" onClick={() => setOpen(false)}>
          <div className="bank-modal glass-card" onClick={e => e.stopPropagation()}>
            <div className="bank-modal-header">
              <h3>Öğrenilen Kelimeler</h3>
              <button className="bank-modal-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="bank-modal-search-box">
              <input
                className="bank-modal-search"
                placeholder="Öğrenilen kelimelerde ara..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="bank-modal-info">{filtered.length} kelime bulundu</div>

            <div className="bank-modal-list">
              {loading && <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}><div className="spinner-ring" style={{ margin: '0 auto 15px' }}></div>Yükleniyor...</div>}
              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
                  {search ? "Sonuç bulunamadı" : "Henüz hiç kelime öğrenmedin."}
                </div>
              )}
              {filtered.slice().reverse().map(w => (
                <div key={w.id} className="bank-modal-item">
                  <div className="bank-modal-item-info">
                    <span className="bank-modal-word">
                      {w.word}
                      <button className="audio-btn" onClick={() => playAudio(w.word)} title="Dinle">
                        <i className="fa-solid fa-volume-high"></i>
                      </button>
                    </span>
                    <span className="bank-modal-meaning">
                      {w.meaning}
                      {w.syn && w.syn !== "-" && <span style={{ marginLeft: 8, color: "var(--archive)" }}>(Eş: {w.syn})</span>}
                    </span>
                  </div>
                  <button className="bank-modal-del" onClick={() => handleDelete(w.id)}>
                    <i className="fa-solid fa-trash-can"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
          <style jsx>{`
            .bank-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
            .bank-modal { width: 100%; max-width: 600px; max-height: 85vh; display: flex; flex-direction: column; overflow: hidden; border-color: var(--accent); }
            .bank-modal-header { padding: 25px 30px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
            .bank-modal-close { background: none; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; }
            
            .bank-modal-search-box { padding: 20px 30px; }
            .bank-modal-search { width: 100%; background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px 15px; color: var(--text); font-size: 1rem; }
            .bank-modal-search:focus { outline: none; border-color: var(--accent); }

            .bank-modal-info { padding: 0 30px 10px; font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
            .bank-modal-list { flex: 1; overflow-y: auto; padding: 10px 30px 30px; }
            
            .bank-modal-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 15px; margin-bottom: 10px; border: 1px solid var(--border); }
            .bank-modal-item-info { display: flex; flex-direction: column; }
            .bank-modal-word { font-size: 1.1rem; font-weight: 800; color: var(--accent); display: flex; align-items: center; gap: 8px; }
            .bank-modal-meaning { font-size: 0.9rem; font-weight: 600; color: var(--text); opacity: 0.9; }
            .bank-modal-del { background: none; border: none; color: var(--error); opacity: 0.3; cursor: pointer; transition: 0.2s; }
            .bank-modal-del:hover { opacity: 1; }
            .audio-btn { background: none; border: none; font-size: 0.8rem; cursor: pointer; }
          `}</style>
        </div>
      )}
    </>
  );
}
