"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getArchiveWords, getArchiveWordsByLevel, searchArchiveWords, addUserWord, getUserWords } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

const CEFR_LEVELS = ["Tümü", "A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_COLORS = { A1: "#30d158", A2: "#e2b714", B1: "#ff9f0a", B2: "#bf5af2", C1: "#ff375f", C2: "#ff2d55" };

export default function ArchivePanel() {
  const { user, requireAuth, loading: authLoading } = useAuth();
  const { showNotification } = useNotification();
  const [words, setWords] = useState([]);
  const [myWords, setMyWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeLevel, setActiveLevel] = useState("Tümü");

  useEffect(() => {
    if (user) {
      getUserWords(user.uid).then(uw => setMyWords(uw || [])).catch(console.error);
      loadWords("Tümü");
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function loadWords(level) {
    if (!user) return;
    setLoading(true);
    setActiveLevel(level);
    setSearch("");
    try {
      if (level === "Tümü") {
        const r = await getArchiveWords(50);
        setWords(r.words);
        setLastDoc(r.lastDoc);
        setHasMore(r.words.length === 50);
      } else {
        const levelWords = await getArchiveWordsByLevel(level);
        setWords(levelWords);
        setLastDoc(null);
        setHasMore(false);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadMore() {
    if (!lastDoc || activeLevel !== "Tümü" || !user) return;
    setLoading(true);
    try {
      const r = await getArchiveWords(50, lastDoc);
      setWords(p => [...p, ...r.words]);
      setLastDoc(r.lastDoc);
      setHasMore(r.words.length === 50);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function doSearch() {
    const term = search.trim();
    if (!term) {
      loadWords(activeLevel);
      return;
    }
    setLoading(true);
    try {
      const level = activeLevel === "Tümü" ? null : activeLevel;
      const results = await searchArchiveWords(term, level);
      setWords(results);
      setHasMore(false);
      setLastDoc(null);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function clearSearch() {
    setSearch("");
    loadWords(activeLevel);
  }

  function addToBank(w) {
    requireAuth(async () => {
      if (myWords.some(m => m.word?.toLowerCase() === w.word?.toLowerCase())) {
        return showNotification("Bu kelime zaten bankanda!", "warning");
      }
      try {
        await addUserWord(user.uid, { word: w.word, meaning: w.meaning, syn: w.syn || "-" });
        setMyWords(p => [...p, { word: w.word }]);
        showNotification(`"${w.word}" başarıyla eklendi!`, "success");
      } catch {
        showNotification("Ekleme sırasında bir hata oluştu.", "error");
      }
    });
  }

  const saved = (w) => myWords.some(m => m.word?.toLowerCase() === w.word?.toLowerCase());

  function playAudio(text) {
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      window.speechSynthesis.speak(u);
    }
  }

  if (authLoading || (loading && words.length === 0)) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!user) {
    return (
      <div className="archive-page">
        <div className="archive-empty-gate">
          <h3>Akademik Sözlüğe Erişmek İçin Kayıt Olmalısın</h3>
          <p className="hint-text">Kelime aramak ve kendi kelime bankanıza kelimeler eklemek için giriş yapmalısınız.</p>
          <button onClick={() => window.location.href='/login'} className="btn-primary">Giriş Yap / Kayıt Ol</button>
        </div>
      </div>
    );
  }

  return (
    <div className="archive-page">
      <div className="archive-search-row">
        <input
          className="archive-search-input"
          placeholder={activeLevel === "Tümü" ? "Kelime veya anlam ara..." : `${activeLevel} seviyesinde ara...`}
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
        />
        <button className="archive-search-btn" onClick={doSearch}>Ara</button>
        {search && <button className="archive-clear-btn" onClick={clearSearch}>✕</button>}
      </div>

      <div className="archive-level-tabs">
        {CEFR_LEVELS.map(l => (
          <button
            key={l}
            className={`archive-tab ${activeLevel === l ? "active" : ""}`}
            style={activeLevel === l ? { background: CEFR_COLORS[l] || "var(--accent)", color: "#000", borderColor: "transparent" } : {}}
            onClick={() => loadWords(l)}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="archive-count">
        {words.length} kelime {activeLevel !== "Tümü" && `(${activeLevel})`}
      </div>

      <div className="archive-list-card">
        {words.length === 0 && !loading && (
          <p className="hint-text archive-empty-text">
            {search ? "Arama sonucu bulunamadı." : activeLevel === "Tümü" ? "Arşivde kelime yok." : `${activeLevel} seviyesinde kelime bulunamadı.`}
          </p>
        )}
        <div className="archive-list">
          {words.map((w, i) => (
            <div key={w.id || i} className="archive-item">
              <div className="archive-item-info">
                <b>{w.word || w.phrase}</b>
                <button className="archive-audio-btn" onClick={() => playAudio(w.word || w.phrase)} title="Dinle">
                  <i className="fa-solid fa-volume-high"></i>
                </button>
                <span className="archive-meaning">{w.meaning}</span>
                {w.syn && w.syn !== "-" && <span className="archive-syn">({w.syn})</span>}
              </div>
              <div className="archive-item-actions">
                {w.level && (
                  <span className="archive-level-badge" style={{
                    background: `${CEFR_COLORS[w.level?.toUpperCase()] || "var(--text-muted)"}20`,
                    color: CEFR_COLORS[w.level?.toUpperCase()] || "var(--text-muted)",
                  }}>
                    {w.level}
                  </span>
                )}
                <button className={saved(w) ? "archive-add-btn saved" : "archive-add-btn"}
                  onClick={() => !saved(w) && addToBank(w)} disabled={saved(w)}>
                  {saved(w) ? <i className="fa-solid fa-check"></i> : <i className="fa-solid fa-plus"></i>}
                </button>
              </div>
            </div>
          ))}
        </div>
        {loading && <div className="page-loading" style={{ minHeight: "15vh" }}><div className="spinner-ring"></div></div>}
        {hasMore && !loading && words.length > 0 && activeLevel === "Tümü" && (
          <button className="archive-load-more" onClick={loadMore}>Daha Fazla Yükle</button>
        )}
      </div>

      <style jsx>{`
        .archive-page { max-width: 720px; margin: 0 auto; }
        .archive-empty-gate { text-align: center; padding: 60px 20px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 20px; max-width: 480px; margin: 0 auto; }
        .archive-empty-gate h3 { font-weight: 800; margin-bottom: 12px; font-size: 1.2rem; }
        .archive-empty-gate button { margin-top: 16px; padding: 14px 28px; border-radius: 12px; }

        .archive-search-row { display: flex; gap: 8px; margin-bottom: 16px; }
        .archive-search-input {
          flex: 1; background: var(--glass); border: 1px solid var(--border); border-radius: 12px;
          padding: 12px 14px; color: var(--text); font-size: 0.9rem; outline: none; font-family: var(--font);
        }
        .archive-search-input:focus { border-color: var(--accent); }
        .archive-search-btn { background: var(--accent); color: #000; border: none; border-radius: 12px; padding: 0 20px; font-weight: 700; cursor: pointer; }
        .archive-clear-btn { background: var(--glass); border: 1px solid var(--border); border-radius: 12px; padding: 0 16px; color: var(--text); cursor: pointer; }

        .archive-level-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
        .archive-tab {
          background: var(--glass); border: 1px solid var(--border); color: var(--text-muted);
          padding: 8px 14px; border-radius: 10px; font-size: 0.8rem; font-weight: 700; cursor: pointer;
        }
        .archive-tab.active { font-weight: 800; }

        .archive-count { font-size: 0.82rem; color: var(--text-muted); font-weight: 700; margin-bottom: 12px; }

        .archive-list-card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 18px; padding: 8px; }
        .archive-empty-text { text-align: center; padding: 30px; }
        .archive-list { display: flex; flex-direction: column; }
        .archive-item {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 14px 12px; border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .archive-item:last-child { border-bottom: none; }
        .archive-item-info { flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: var(--text); }
        .archive-audio-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px; }
        .archive-audio-btn:hover { color: var(--accent); }
        .archive-meaning { color: var(--text-muted); font-size: 0.88rem; }
        .archive-syn { color: var(--archive); font-size: 0.78rem; }
        .archive-item-actions { display: flex; gap: 8px; align-items: center; }
        .archive-level-badge { font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; }
        .archive-add-btn {
          width: 30px; height: 30px; border-radius: 8px; background: var(--glass); border: 1px solid var(--border);
          color: var(--accent); cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .archive-add-btn.saved { color: #30d158; cursor: default; }
        .archive-load-more {
          width: 100%; margin-top: 10px; padding: 12px; background: none; border: 1px solid var(--border);
          border-radius: 12px; color: var(--text); font-weight: 700; cursor: pointer;
        }
        .archive-load-more:hover { background: var(--glass); }
      `}</style>
    </div>
  );
}
