"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getArchiveWords, getArchiveWordsByLevel, searchArchiveWords, addUserWord, getUserWords } from "@/lib/firestore";

const CEFR_LEVELS = ["Tümü", "A1", "A2", "B1", "B2", "C1", "C2"];
const CEFR_COLORS = { A1: "#30d158", A2: "#e2b714", B1: "#ff9f0a", B2: "#bf5af2", C1: "#ff375f", C2: "#ff2d55" };

export default function ArchivePage() {
  const { user, requireAuth } = useAuth();
  const [words, setWords] = useState([]);
  const [myWords, setMyWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [activeLevel, setActiveLevel] = useState("Tümü");

  // Initial load
  useEffect(() => {
    if (user) {
      getUserWords(user.uid).then(uw => setMyWords(uw || [])).catch(console.error);
    }
    loadWords("Tümü");
  }, [user]);

  // When level tab changes
  async function loadWords(level) {
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
        // Fetch ALL words for this level (no pagination needed per-level)
        const levelWords = await getArchiveWordsByLevel(level);
        setWords(levelWords);
        setLastDoc(null);
        setHasMore(false);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadMore() {
    if (!lastDoc || activeLevel !== "Tümü") return;
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
      if (myWords.some(m => m.word?.toLowerCase() === w.word?.toLowerCase())) return alert("Zaten bankanda!");
      try {
        await addUserWord(user.uid, { word: w.word, meaning: w.meaning, syn: w.syn || "-" });
        setMyWords(p => [...p, { word: w.word }]);
        alert(`"${w.word}" eklendi!`);
      } catch { alert("Hata."); }
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

  return (
    <div>
      <h2 className="section-title">Akademik Sözlük</h2>

      {/* Search */}
      <div className="glass-card">
        <div style={{ display: "flex", gap: 10 }}>
          <input
            className="word-input"
            style={{ flex: 1 }}
            placeholder={activeLevel === "Tümü" ? "Kelime veya anlam ara..." : `${activeLevel} seviyesinde ara...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doSearch()}
          />
          <button className="btn-primary" onClick={doSearch}>Ara</button>
          {search && <button className="btn-ghost" onClick={clearSearch}>✕</button>}
        </div>
      </div>

      {/* CEFR Level Tabs */}
      <div className="archive-level-tabs">
        {CEFR_LEVELS.map(l => (
          <button
            key={l}
            className={`archive-tab ${activeLevel === l ? "active" : ""}`}
            style={activeLevel === l ? { background: CEFR_COLORS[l] || "var(--accent)", color: "#000" } : {}}
            onClick={() => loadWords(l)}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Word Count */}
      <div style={{ marginBottom: 12, fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 700 }}>
        {words.length} kelime {activeLevel !== "Tümü" && `(${activeLevel})`}
      </div>

      {/* Word List */}
      <div className="glass-card">
        {words.length === 0 && !loading && (
          <p className="hint-text" style={{ textAlign: "center", padding: 30 }}>
            {search ? "Arama sonucu bulunamadı." : activeLevel === "Tümü" ? "Arşivde kelime yok." : `${activeLevel} seviyesinde kelime bulunamadı.`}
          </p>
        )}
        <div className="archive-list">
          {words.map((w, i) => (
            <div key={w.id || i} className="archive-item">
              <div style={{ flex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <b style={{ marginRight: 2 }}>{w.word || w.phrase}</b>
                <button className="audio-btn" style={{ marginRight: 8 }} onClick={() => playAudio(w.word || w.phrase)} title="Dinle">🔊</button>
                <span className="meaning-text">{w.meaning}</span>
                {w.syn && w.syn !== "-" && <span className="syn-text" style={{ marginLeft: 8 }}>({w.syn})</span>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
                  {saved(w) ? "✓" : "+"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {loading && <div className="page-loading" style={{ minHeight: "15vh" }}><div className="spinner-ring"></div></div>}
        {hasMore && !loading && words.length > 0 && activeLevel === "Tümü" && (
          <button className="btn-ghost w-100" style={{ marginTop: 16 }} onClick={loadMore}>Daha Fazla Yükle</button>
        )}
      </div>
    </div>
  );
}
