"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, deleteUserWord } from "@/lib/firestore";

export default function FloatingBank() {
  const { user } = useAuth();
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

  const filtered = search.trim()
    ? words.filter(w =>
        w.word?.toLowerCase().includes(search.toLowerCase()) ||
        w.meaning?.toLowerCase().includes(search.toLowerCase())
      )
    : words;

  if (!user) return null;

  return (
    <>
      {/* FAB Button */}
      <button className="bank-fab" onClick={() => setOpen(!open)} title="Kelime Bankası">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
        <span className="bank-fab-count">{words.length || "—"}</span>
      </button>

      {/* Drawer */}
      {open && (
        <div className="bank-drawer-overlay" onClick={() => setOpen(false)}>
          <div className="bank-drawer" onClick={e => e.stopPropagation()}>
            <div className="bank-drawer-header">
              <h3>Kelime Bankası</h3>
              <button className="bank-drawer-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <input
              className="bank-drawer-search"
              placeholder="Ara..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />

            <div className="bank-drawer-count">{filtered.length} kelime</div>

            <div className="bank-drawer-list">
              {loading && <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>Yükleniyor...</div>}
              {!loading && filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
                  {search ? "Sonuç bulunamadı" : "Banka boş"}
                </div>
              )}
              {filtered.slice().reverse().map(w => (
                <div key={w.id} className="bank-drawer-item">
                  <div className="bank-drawer-item-info">
                    <span className="bank-drawer-word">{w.word}</span>
                    <span className="bank-drawer-meaning">{w.meaning}</span>
                  </div>
                  <button className="bank-drawer-del" onClick={() => handleDelete(w.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
