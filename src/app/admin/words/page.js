"use client";

import { useState, useEffect, useCallback } from "react";
import { addArchiveWord, deleteArchiveWord, searchArchiveWords, getArchiveWords } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

export default function AdminWordsPage() {
  const { showNotification } = useNotification();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ word: "", meaning: "", syn: "", level: "B1" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const CEFR_COLORS = { 
    A1: "#30d158", A2: "#e2b714", B1: "#ff9f0a", B2: "#bf5af2", C1: "#ff375f", C2: "#ff2d55" 
  };

  // Hoisting fix: Declarations before usage
  const loadWords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getArchiveWords(50);
      setWords(result.words);
      setLastDoc(result.lastDoc);
      setHasMore(result.words.length === 50);
    } catch (err) {
      if (showNotification) showNotification("Kelime yükleme hatası", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const loadMore = async () => {
    if (!lastDoc || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await getArchiveWords(50, lastDoc);
      setWords(prev => [...prev, ...result.words]);
      setLastDoc(result.lastDoc);
      setHasMore(result.words.length === 50);
    } catch (err) {
      if (showNotification) showNotification("Daha fazla kelime yüklenemedi", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) { loadWords(); return; }
    setLoading(true);
    try {
      const results = await searchArchiveWords(search);
      setWords(results);
      setHasMore(false);
      setLastDoc(null);
    } catch (err) {
      if (showNotification) showNotification("Arama sırasında bir hata oluştu", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.word || !form.meaning) return showNotification("Kelime ve anlam gerekli!", "warning");
    try {
      await addArchiveWord(form);
      setForm({ word: "", meaning: "", syn: "", level: "B1" });
      setShowForm(false);
      loadWords();
      showNotification("Kelime başarıyla eklendi!", "success");
    } catch (err) {
      showNotification("Kelime eklenirken hata oluştu.", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteArchiveWord(deleteConfirm);
      setWords(prev => prev.filter(w => w.id !== deleteConfirm));
      showNotification("Kelime başarıyla silindi.", "success");
    } catch (err) {
      showNotification("Silme işlemi başarısız.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="admin-words-view">
      <div className="glass-card">
        <div className="header-split admin-header-mobile">
          <div>
            <h3 className="section-title" style={{ marginBottom: 4 }}>Kelime Yönetimi</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>Toplam {words.length} kelime listeleniyor</p>
          </div>
          <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ İptal" : "+ Yeni Kelime"}
          </button>
        </div>

        {showForm && (
          <div className="admin-form-container">
            <form onSubmit={handleAdd} className="admin-form-modern">
              <div className="form-row mobile-stack">
                <div className="form-group">
                  <label>İngilizce</label>
                  <input
                    placeholder="Örn: Abandon"
                    value={form.word}
                    onChange={(e) => setForm({ ...form, word: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Türkçe Anlamı</label>
                  <input
                    placeholder="Örn: Terk etmek"
                    value={form.meaning}
                    onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-row mobile-stack">
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Eş Anlamlılar</label>
                  <input
                    placeholder="Virgülle ayırın"
                    value={form.syn}
                    onChange={(e) => setForm({ ...form, syn: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>CEFR Seviyesi</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {Object.keys(CEFR_COLORS).map(lv => <option key={lv} value={lv}>{lv}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="admin-btn-save">✓ Arşive Ekle</button>
            </form>
          </div>
        )}

        <div className="admin-search-wrapper">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            placeholder="Arşivde kelime veya anlam ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}>Ara</button>
        </div>

        {loading ? (
          <div className="page-loading"><div className="spinner-ring"></div></div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kelime</th>
                  <th className="hide-mobile">Türkçe Anlam</th>
                  <th>Seviye</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {words.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span className="mobile-word-text">{w.word || w.phrase}</span>
                        <span className="mobile-only-meaning">{w.meaning}</span>
                        {w.syn && w.syn !== "-" && <span className="syn-subtext">{w.syn}</span>}
                      </div>
                    </td>
                    <td className="hide-mobile" style={{ color: "var(--text-muted)", fontWeight: 600 }}>{w.meaning}</td>
                    <td>
                      <span className="level-badge-modern" style={{ 
                        background: `${CEFR_COLORS[w.level] || "var(--border)"}22`,
                        color: CEFR_COLORS[w.level] || "var(--text-muted)",
                        borderColor: CEFR_COLORS[w.level] || "var(--border)"
                      }}>
                        {w.level || "-"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-action-btn delete"
                        onClick={() => setDeleteConfirm(w.id)}
                        title="Sil"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!loading && hasMore && (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <button className="admin-btn-load-more" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
                </button>
              </div>
            )}
            
            {words.length === 0 && (
              <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
                Gösterilecek kelime bulunamadı.
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-words-view { width: 100%; padding-bottom: 50px; }
        .admin-form-container { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 15px; padding: 20px; margin: 20px 0; }
        .admin-form-modern { display: flex; flex-direction: column; gap: 15px; }
        .form-row { display: flex; gap: 15px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .form-group label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .form-group input, .form-group select { background: var(--bg-card); border: 1px solid var(--border); padding: 12px 14px; border-radius: 10px; color: #fff; outline: none; font-size: 1rem; }
        .form-group input:focus { border-color: var(--accent); }
        .admin-btn-save { background: var(--accent); color: #000; border: none; padding: 14px; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 10px; transition: 0.2s; }
        
        .admin-search-wrapper { display: flex; align-items: center; background: rgba(255,255,255,0.05); border: 1px solid var(--border); border-radius: 15px; padding: 5px 5px 5px 15px; margin: 20px 0; }
        .admin-search-wrapper input { flex: 1; background: none; border: none; color: #fff; padding: 10px; outline: none; font-size: 1rem; }
        .admin-search-wrapper button { background: var(--accent); color: #000; border: none; padding: 8px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .search-icon { color: var(--text-muted); opacity: 0.5; }

        .level-badge-modern { padding: 4px 10px; border-radius: 6px; font-weight: 900; font-size: 0.75rem; border: 1px solid; }
        .admin-action-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 10px; border-radius: 8px; transition: 0.2s; }
        .admin-action-btn.delete { color: var(--error); }
        
        .admin-btn-load-more { width: 100%; padding: 15px; background: rgba(255,255,255,0.05); border: 1px dashed var(--border); color: var(--text-muted); border-radius: 12px; cursor: pointer; font-weight: 700; transition: 0.2s; }
        .admin-btn-load-more:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #fff; border-color: var(--accent); }
        .admin-btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }

        .mobile-word-text { font-weight: 800; font-size: 1.05rem; }
        .syn-subtext { color: var(--archive); font-size: 0.75rem; }
        .mobile-only-meaning { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2px; }

        @media (max-width: 600px) {
          .mobile-stack { flex-direction: column; }
          .admin-header-mobile { flex-direction: column; align-items: flex-start !important; gap: 15px; }
          .admin-header-mobile button { width: 100%; }
          .hide-mobile { display: none; }
          .admin-table th, .admin-table td { padding: 12px 10px; }
          .admin-form-container { padding: 15px; }
        }
      `}</style>

      {deleteConfirm && (
        <CustomDialog
          title="Kelimeyi Sil"
          message="Bu kelimeyi arşivden silmek istediğinize emin miyiz?"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
