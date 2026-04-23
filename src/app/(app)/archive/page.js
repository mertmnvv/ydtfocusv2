"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getArchiveWords, searchArchiveWords, addUserWord, getUserWords } from "@/lib/firestore";

export default function ArchivePage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [myWords, setMyWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([loadInitial(), getUserWords(user.uid)])
      .then(([_, uw]) => setMyWords(uw))
      .catch(console.error);
  }, [user]);

  async function loadInitial() {
    setLoading(true);
    try {
      const r = await getArchiveWords(50);
      setWords(r.words); setLastDoc(r.lastDoc); setHasMore(r.words.length === 50);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function loadMore() {
    if (!lastDoc) return;
    setLoading(true);
    try {
      const r = await getArchiveWords(50, lastDoc);
      setWords(p => [...p, ...r.words]); setLastDoc(r.lastDoc); setHasMore(r.words.length === 50);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function doSearch() {
    if (!search.trim()) { loadInitial(); return; }
    setLoading(true);
    try {
      const r = await searchArchiveWords(search);
      setWords(r); setHasMore(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function addToBank(w) {
    if (myWords.some(m => m.word?.toLowerCase() === w.word?.toLowerCase())) return alert("Zaten bankanda!");
    try {
      await addUserWord(user.uid, { word: w.word, meaning: w.meaning, syn: w.syn || "-" });
      setMyWords(p => [...p, { word: w.word }]);
      alert(`"${w.word}" eklendi!`);
    } catch { alert("Hata."); }
  }

  const saved = (w) => myWords.some(m => m.word?.toLowerCase() === w.word?.toLowerCase());

  return (
    <div>
      <h2 className="section-title">Akademik Sözlük</h2>
      <div className="glass-card">
        <div style={{ display: "flex", gap: 10 }}>
          <input className="word-input" style={{ flex: 1 }} placeholder="Kelime veya anlam ara..."
            value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} />
          <button className="btn-primary" onClick={doSearch}>Ara</button>
          {search && <button className="btn-ghost" onClick={() => { setSearch(""); loadInitial(); }}>✕</button>}
        </div>
      </div>
      <div className="glass-card">
        {words.length === 0 && !loading && (
          <p className="hint-text" style={{ textAlign: "center", padding: 30 }}>Arşivde kelime yok. Admin panelinden seed yapın.</p>
        )}
        <div className="archive-list">
          {words.map((w, i) => (
            <div key={w.id || i} className="archive-item">
              <div style={{ flex: 1 }}>
                <b style={{ marginRight: 10 }}>{w.word || w.phrase}</b>
                <span className="meaning-text">{w.meaning}</span>
                {w.syn && w.syn !== "-" && <span className="syn-text" style={{ marginLeft: 8 }}>({w.syn})</span>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {w.level && <span className="archive-level-badge">{w.level}</span>}
                <button className={saved(w) ? "archive-add-btn saved" : "archive-add-btn"}
                  onClick={() => !saved(w) && addToBank(w)} disabled={saved(w)}>
                  {saved(w) ? "✓" : "+"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {loading && <div className="page-loading" style={{ minHeight: "15vh" }}><div className="spinner-ring"></div></div>}
        {hasMore && !loading && words.length > 0 && (
          <button className="btn-ghost w-100" style={{ marginTop: 16 }} onClick={loadMore}>Daha Fazla Yükle</button>
        )}
      </div>
    </div>
  );
}
