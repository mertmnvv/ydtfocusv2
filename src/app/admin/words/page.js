"use client";

import { useState, useEffect, useCallback } from "react";
import { addArchiveWord, deleteArchiveWord, searchArchiveWords, getArchiveWords } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

const CEFR_COLORS = {
  A1: "#30d158", A2: "#e2b714", B1: "#ff9f0a", B2: "#bf5af2", C1: "#ff375f", C2: "#ff2d55"
};

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
        <div className="aw-header">
          <div>
            <h3 className="section-title">Kelime Yönetimi</h3>
            <p className="aw-header-sub">Toplam {words.length} kelime listeleniyor</p>
          </div>
          <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "İptal" : "Yeni Kelime"}
          </button>
        </div>

        {showForm && (
          <div className="aw-form-container">
            <form onSubmit={handleAdd} className="aw-form">
              <div className="aw-form-row">
                <div className="aw-form-group">
                  <label>İngilizce</label>
                  <input
                    placeholder="Örn: Abandon"
                    value={form.word}
                    onChange={(e) => setForm({ ...form, word: e.target.value })}
                    required
                  />
                </div>
                <div className="aw-form-group">
                  <label>Türkçe Anlamı</label>
                  <input
                    placeholder="Örn: Terk etmek"
                    value={form.meaning}
                    onChange={(e) => setForm({ ...form, meaning: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="aw-form-row">
                <div className="aw-form-group aw-form-group-wide">
                  <label>Eş Anlamlılar</label>
                  <input
                    placeholder="Virgülle ayırın"
                    value={form.syn}
                    onChange={(e) => setForm({ ...form, syn: e.target.value })}
                  />
                </div>
                <div className="aw-form-group">
                  <label>CEFR Seviyesi</label>
                  <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {Object.keys(CEFR_COLORS).map(lv => <option key={lv} value={lv}>{lv}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="aw-save-btn">Arşive Ekle</button>
            </form>
          </div>
        )}

        <div className="aw-search">
          <i className="fa-solid fa-magnifying-glass"></i>
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
          <div className="aw-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kelime</th>
                  <th className="aw-hide-mobile">Türkçe Anlam</th>
                  <th>Seviye</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {words.map(w => (
                  <tr key={w.id}>
                    <td>
                      <div className="aw-word-cell">
                        <span className="aw-word-text">{w.word || w.phrase}</span>
                        <span className="aw-mobile-meaning">{w.meaning}</span>
                        {w.syn && w.syn !== "-" && <span className="aw-syn">{w.syn}</span>}
                      </div>
                    </td>
                    <td className="aw-hide-mobile aw-meaning-cell">{w.meaning}</td>
                    <td>
                      <span
                        className="aw-level-badge"
                        style={{
                          background: `${CEFR_COLORS[w.level] || "var(--border)"}22`,
                          color: CEFR_COLORS[w.level] || "var(--text-muted)",
                          borderColor: CEFR_COLORS[w.level] || "var(--border)"
                        }}
                      >
                        {w.level || "-"}
                      </span>
                    </td>
                    <td>
                      <button
                        className="aw-action-btn delete"
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
              <div className="aw-load-more-wrap">
                <button className="aw-load-more-btn" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? "Yükleniyor..." : "Daha Fazla Yükle"}
                </button>
              </div>
            )}

            {words.length === 0 && (
              <div className="aw-empty">Gösterilecek kelime bulunamadı.</div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-words-view { width: 100%; padding-bottom: 50px; }
        .aw-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .aw-header-sub { color: var(--text-muted); font-size: 0.8rem; margin-top: 4px; }

        .aw-form-container { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 15px; padding: 20px; margin: 20px 0; }
        .aw-form { display: flex; flex-direction: column; gap: 15px; }
        .aw-form-row { display: flex; gap: 15px; }
        .aw-form-group { display: flex; flex-direction: column; gap: 6px; flex: 1; }
        .aw-form-group-wide { flex: 2; }
        .aw-form-group label { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
        .aw-form-group input, .aw-form-group select { background: var(--bg-card); border: 1px solid var(--border); padding: 12px 14px; border-radius: 10px; color: var(--text); outline: none; font-size: 1rem; }
        .aw-form-group input:focus, .aw-form-group select:focus { border-color: var(--accent); }
        .aw-save-btn { background: var(--accent); color: #000; border: none; padding: 14px; border-radius: 10px; font-weight: 800; cursor: pointer; margin-top: 10px; }

        .aw-search { display: flex; align-items: center; gap: 10px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 15px; padding: 5px 5px 5px 15px; margin: 20px 0; }
        .aw-search i { color: var(--text-muted); }
        .aw-search input { flex: 1; background: none; border: none; color: var(--text); padding: 10px; outline: none; font-size: 1rem; }
        .aw-search button { background: var(--accent); color: #000; border: none; padding: 8px 20px; border-radius: 10px; font-weight: 700; cursor: pointer; }

        .aw-word-cell { display: flex; flex-direction: column; }
        .aw-word-text { font-weight: 800; font-size: 1.05rem; color: var(--text); }
        .aw-syn { color: var(--accent); font-size: 0.75rem; }
        .aw-mobile-meaning { display: none; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2px; }
        .aw-meaning-cell { color: var(--text-muted); font-weight: 600; }

        .aw-level-badge { padding: 4px 10px; border-radius: 6px; font-weight: 900; font-size: 0.75rem; border: 1px solid; }

        .aw-table-wrap { overflow-x: auto; }
        .aw-action-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 10px; border-radius: 8px; }
        .aw-action-btn.delete { color: var(--error); }

        .aw-load-more-wrap { margin-top: 20px; text-align: center; }
        .aw-load-more-btn { width: 100%; padding: 15px; background: var(--bg-elevated); border: 1px dashed var(--border); color: var(--text-muted); border-radius: 12px; cursor: pointer; font-weight: 700; }
        .aw-load-more-btn:hover:not(:disabled) { color: var(--text); border-color: var(--accent); }
        .aw-load-more-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .aw-empty { text-align: center; color: var(--text-muted); padding: 40px; }

        @media (max-width: 600px) {
          .aw-form-row { flex-direction: column; }
          .aw-header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .aw-header :global(.admin-btn) { width: 100%; }
          .aw-hide-mobile { display: none; }
          .aw-mobile-meaning { display: block; }
          .aw-form-container { padding: 15px; }
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
