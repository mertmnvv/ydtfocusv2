"use client";

import { useState, useEffect } from "react";
import { addArchiveWord, deleteArchiveWord, searchArchiveWords, getArchiveWords } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

export default function AdminWordsPage() {
  const { showNotification } = useNotification();
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ word: "", meaning: "", syn: "", level: "B1" });
  const [deleteConfirm, setDeleteConfirm] = useState(null); // id of word to delete

  useEffect(() => {
    loadWords();
  }, []);

  async function loadWords() {
    setLoading(true);
    try {
      const result = await getArchiveWords(100);
      setWords(result.words);
    } catch (err) {
      showNotification("Kelime yükleme hatası", "error");
    }
    setLoading(false);
  }

  async function handleSearch() {
    if (!search.trim()) { loadWords(); return; }
    setLoading(true);
    try {
      const results = await searchArchiveWords(search);
      setWords(results.slice(0, 100));
    } catch (err) {
      showNotification("Arama sırasında bir hata oluştu", "error");
    }
    setLoading(false);
  }

  async function handleAdd(e) {
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
  }

  async function handleDeleteConfirm() {
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
  }

  return (
    <div>
      <div className="glass-card">
        <div className="header-split">
          <h3 className="section-title" style={{ marginBottom: 0 }}>📚 Kelime Yönetimi</h3>
          <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ İptal" : "+ Kelime Ekle"}
          </button>
        </div>

        {/* Kelime Ekleme Formu */}
        {showForm && (
          <form onSubmit={handleAdd} className="admin-form" style={{ marginTop: 20 }}>
            <input
              placeholder="Kelime (İngilizce)"
              value={form.word}
              onChange={(e) => setForm({ ...form, word: e.target.value })}
              required
            />
            <input
              placeholder="Anlam (Türkçe)"
              value={form.meaning}
              onChange={(e) => setForm({ ...form, meaning: e.target.value })}
              required
            />
            <input
              placeholder="Eş Anlamlar (virgülle ayırın)"
              value={form.syn}
              onChange={(e) => setForm({ ...form, syn: e.target.value })}
            />
            <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="A1">A1</option>
              <option value="A2">A2</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>
            <button type="submit" className="admin-btn">✓ Kaydet</button>
          </form>
        )}

        {/* Arama */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, marginBottom: 16 }}>
          <input
            placeholder="Kelime veya anlam ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)",
              borderRadius: 12, padding: "12px 16px", color: "var(--text)",
              fontSize: "0.95rem", fontFamily: "var(--font)", outline: "none",
            }}
          />
          <button className="admin-btn" onClick={handleSearch}>Ara</button>
        </div>

        {/* Kelime Listesi */}
        {loading ? (
          <div className="page-loading"><div className="spinner-ring"></div></div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Kelime</th>
                  <th>Anlam</th>
                  <th>Eş Anlam</th>
                  <th>Seviye</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {words.map(w => (
                  <tr key={w.id}>
                    <td style={{ fontWeight: 700 }}>{w.word || w.phrase}</td>
                    <td style={{ color: "var(--text-muted)" }}>{w.meaning}</td>
                    <td style={{ color: "var(--archive)", fontSize: "0.85rem" }}>{w.syn || "-"}</td>
                    <td>
                      <span className="admin-badge admin-badge-user">{w.level || "-"}</span>
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-danger"
                        style={{ padding: "4px 10px", fontSize: "0.8rem" }}
                        onClick={() => setDeleteConfirm(w.id)}
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
                {words.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: 30 }}>
                      Kelime bulunamadı. Arşive veri yüklemek için seed scripti çalıştırın.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteConfirm && (
        <CustomDialog
          title="Kelimeyi Sil"
          message="Bu kelimeyi arşivden silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
