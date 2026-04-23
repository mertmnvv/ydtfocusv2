"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserMistakes, updateUserMistakes } from "@/lib/firestore";

export default function MistakesPage() {
  const { user } = useAuth();
  const [myWords, setMyWords] = useState([]);
  const [wrongIds, setWrongIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getUserWords(user.uid), getUserMistakes(user.uid)])
      .then(([w, m]) => { setMyWords(w); setWrongIds(m || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function clearAll() {
    if (!confirm("Tüm hataları sıfırlamak istediğinize emin misiniz?")) return;
    try {
      await updateUserMistakes(user.uid, []);
      setWrongIds([]);
    } catch (err) {
      console.error("Silme hatası:", err);
      alert("Silme işlemi başarısız oldu.");
    }
  }

  async function removeOne(wordText) {
    const updated = wrongIds.filter(w => w !== wordText);
    try {
      await updateUserMistakes(user.uid, updated);
      setWrongIds(updated);
    } catch (err) {
      console.error("Tekil silme hatası:", err);
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div></div>;
  }

  const mistakeWords = wrongIds.map(wText => {
    const found = myWords.find(w => w.word === wText || w.word?.toLowerCase() === wText?.toLowerCase());
    return found ? { ...found, originalId: wText } : { word: wText, meaning: "—", originalId: wText };
  }).filter(Boolean);

  return (
    <div className="mistakes-page">
      <div className="header-split">
        <h2 className="section-title">Hatalarım ({wrongIds.length})</h2>
        {wrongIds.length > 0 && (
          <button className="btn-ghost" style={{ color: "var(--error)", borderColor: "var(--error)" }} onClick={clearAll}>
            Tümünü Sil
          </button>
        )}
      </div>

      {mistakeWords.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 40 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Hata Yok</h3>
          <p className="hint-text">Quiz&apos;lerde yanlış bildiğiniz kelimeler burada görünecek.</p>
        </div>
      ) : (
        <div className="glass-card">
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {mistakeWords.map((w, i) => (
              <div key={i} className="mistake-card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, flexWrap: "wrap" }}>
                  <span className="mistake-word">{w.word}</span>
                  <span className="mistake-meaning">{w.meaning}</span>
                  {w.syn && w.syn !== "-" && (
                    <span style={{ color: "var(--archive)", fontSize: "0.8rem" }}>Eş: {w.syn}</span>
                  )}
                </div>
                <button
                  onClick={() => removeOne(w.originalId)}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,69,58,0.3)",
                    color: "var(--error)",
                    padding: "6px 12px",
                    borderRadius: 8,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }}
                >
                  Sil
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {wrongIds.length >= 4 && (
        <a href="/quiz" className="btn-primary" style={{ display: "block", textAlign: "center", marginTop: 20, padding: 16 }}>
          Hata Testi Başlat
        </a>
      )}
    </div>
  );
}
