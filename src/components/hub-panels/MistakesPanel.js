"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserMistakes, updateUserMistakes } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

export default function MistakesPanel({ onStartMistakesQuiz }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [myWords, setMyWords] = useState([]);
  const [wrongIds, setWrongIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearConfirm, setClearConfirm] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([getUserWords(user.uid), getUserMistakes(user.uid)])
      .then(([w, m]) => { setMyWords(w); setWrongIds(m || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user]);

  async function handleClearAll() {
    try {
      await updateUserMistakes(user.uid, []);
      setWrongIds([]);
      showNotification("Tüm hatalar sıfırlandı.", "success");
    } catch (err) {
      showNotification("Sıfırlama başarısız oldu.", "error");
    } finally {
      setClearConfirm(false);
    }
  }

  async function removeOne(wordText) {
    const updated = wrongIds.filter(w => w !== wordText);
    try {
      await updateUserMistakes(user.uid, updated);
      setWrongIds(updated);
      showNotification("Hata silindi.", "success");
    } catch (err) {
      showNotification("Silme başarısız.", "error");
    }
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div></div>;
  }

  const mistakeWords = wrongIds.map(wText => {
    // Hem ID bazlı hem de metin bazlı eşleşme ara (Legacy ve yeni ID formatı desteği)
    const found = myWords.find(w =>
      w.id === wText ||
      w.word === wText ||
      w.word?.toLowerCase() === wText?.toLowerCase()
    );
    return found ? { ...found, originalId: wText } : { word: wText, meaning: "—", originalId: wText };
  }).filter(Boolean);

  return (
    <div className="mistakes-page">
      <div className="mistakes-header">
        <p className="mistakes-subtitle">{wrongIds.length} kelime</p>
        {wrongIds.length > 0 && (
          <button className="mistakes-clear-btn" onClick={() => setClearConfirm(true)}>Tümünü Sil</button>
        )}
      </div>

      {mistakeWords.length === 0 ? (
        <div className="mistakes-empty">
          <h3>Hata Yok</h3>
          <p className="hint-text">Quiz&apos;lerde yanlış bildiğiniz kelimeler burada görünecek.</p>
        </div>
      ) : (
        <div className="mistakes-list">
          {mistakeWords.map((w, i) => (
            <div key={i} className="mistake-row">
              <div className="mistake-info">
                <span className="mistake-word">{w.word}</span>
                <span className="mistake-meaning">{w.meaning}</span>
                {w.syn && w.syn !== "-" && <span className="mistake-syn">Eş: {w.syn}</span>}
              </div>
              <button className="mistake-remove" onClick={() => removeOne(w.originalId)}>Sil</button>
            </div>
          ))}
        </div>
      )}

      {wrongIds.length >= 4 && (
        <button className="mistakes-cta" onClick={onStartMistakesQuiz}>Hata Testi Başlat</button>
      )}

      {clearConfirm && (
        <CustomDialog
          title="Hataları Sıfırla"
          message="Tüm hata kaydı listenizi temizlemek istediğinize emin misiniz?"
          onConfirm={handleClearAll}
          onCancel={() => setClearConfirm(false)}
        />
      )}

      <style jsx>{`
        .mistakes-page { max-width: 640px; margin: 0 auto; }
        .mistakes-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 12px; }
        .mistakes-subtitle { color: var(--text-muted); font-size: 0.85rem; }
        .mistakes-clear-btn {
          background: none; border: 1px solid rgba(255, 69, 58, 0.3); color: var(--error);
          padding: 10px 16px; border-radius: 10px; font-size: 0.82rem; font-weight: 700; cursor: pointer;
        }
        .mistakes-clear-btn:hover { background: rgba(255, 69, 58, 0.1); }
        .mistakes-empty { text-align: center; padding: 60px 20px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; }
        .mistakes-empty h3 { font-weight: 800; margin-bottom: 8px; }
        .mistakes-list { display: flex; flex-direction: column; gap: 8px; }
        .mistake-row {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px;
        }
        .mistake-info { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; }
        .mistake-word { font-weight: 800; color: var(--text); }
        .mistake-meaning { color: var(--accent); font-size: 0.88rem; font-weight: 600; }
        .mistake-syn { color: var(--archive); font-size: 0.78rem; }
        .mistake-remove {
          background: none; border: 1px solid rgba(255, 69, 58, 0.3); color: var(--error);
          padding: 6px 14px; border-radius: 8px; font-size: 0.78rem; font-weight: 700; cursor: pointer; flex-shrink: 0;
        }
        .mistake-remove:hover { background: rgba(255, 69, 58, 0.1); }
        .mistakes-cta {
          display: block; width: 100%; text-align: center; margin-top: 24px; padding: 16px; border: none;
          background: var(--accent); color: #000; font-weight: 800; border-radius: 14px; cursor: pointer;
          font-size: 0.95rem; font-family: var(--font);
        }
      `}</style>
    </div>
  );
}
