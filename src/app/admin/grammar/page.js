"use client";

import { useState, useEffect } from "react";
import { getGrammarTopics, addGrammarTopic, deleteGrammarTopic } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

export default function AdminGrammarPage() {
  const { showNotification } = useNotification();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", sortOrder: 0, tactics: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadTopics();
  }, []);

  async function loadTopics() {
    setLoading(true);
    try {
      const data = await getGrammarTopics();
      setTopics(data);
    } catch (err) {
      console.error("Gramer yükleme hatası:", err);
    }
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title || !form.content) return showNotification("Başlık ve içerik gerekli!", "warning");
    try {
      await addGrammarTopic({
        title: form.title,
        content: form.content,
        sortOrder: parseInt(form.sortOrder) || 0,
        tactics: form.tactics,
      });
      setForm({ title: "", content: "", sortOrder: 0, tactics: "" });
      setShowForm(false);
      loadTopics();
      showNotification("Gramer konusu eklendi!", "success");
    } catch (err) {
      showNotification("Ekleme hatası.", "error");
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteConfirm) return;
    try {
      await deleteGrammarTopic(deleteConfirm);
      setTopics(prev => prev.filter(t => t.id !== deleteConfirm));
      showNotification("Gramer konusu silindi.", "success");
    } catch (err) {
      showNotification("Silme hatası.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  }

  return (
    <div className="admin-grammar-view">
      <div className="glass-card">
        <div className="ag-header">
          <h3 className="section-title">Gramer Yönetimi</h3>
          <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "İptal" : "Konu Ekle"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="ag-form">
            <input
              placeholder="Konu Başlığı (ör: Tenses - Zamanlar)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              className="ag-textarea-lg"
              placeholder="İçerik (HTML destekli)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <textarea
              className="ag-textarea-sm"
              placeholder="ÖSYM Taktikleri (opsiyonel)"
              value={form.tactics}
              onChange={(e) => setForm({ ...form, tactics: e.target.value })}
            />
            <input
              type="number"
              placeholder="Sıra Numarası"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <button type="submit" className="admin-btn">Kaydet</button>
          </form>
        )}

        {loading ? (
          <div className="page-loading"><div className="spinner-ring"></div></div>
        ) : (
          <div className="ag-topic-list">
            {topics.length === 0 ? (
              <p className="ag-empty">Henüz gramer konusu eklenmemiş.</p>
            ) : (
              topics.map((topic) => (
                <div key={topic.id} className="ag-topic-card">
                  <div className="ag-topic-head">
                    <h4 className="ag-topic-title">{topic.sortOrder}. {topic.title}</h4>
                    <button
                      className="admin-btn admin-btn-danger ag-delete-btn"
                      onClick={() => setDeleteConfirm(topic.id)}
                    >
                      Sil
                    </button>
                  </div>
                  <p className="ag-topic-content">{topic.content?.substring(0, 200)}...</p>
                  {topic.tactics && (
                    <p className="ag-topic-tactics">Taktik: {topic.tactics?.substring(0, 100)}...</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .ag-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ag-form { display: flex; flex-direction: column; gap: 12px; margin-top: 20px; max-width: 100%; }
        .ag-form input, .ag-form textarea {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px;
          padding: 12px 14px; color: var(--text); font-size: 0.95rem; outline: none; font-family: inherit;
        }
        .ag-form input:focus, .ag-form textarea:focus { border-color: var(--accent); }
        .ag-textarea-lg { min-height: 150px; resize: vertical; }
        .ag-textarea-sm { min-height: 80px; resize: vertical; }

        .ag-topic-list { margin-top: 20px; }
        .ag-empty { color: var(--text-muted); text-align: center; padding: 30px; }
        .ag-topic-card {
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 16px; padding: 20px; margin-bottom: 12px;
        }
        .ag-topic-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .ag-topic-title { color: var(--accent); font-weight: 700; }
        .ag-delete-btn { padding: 4px 12px; font-size: 0.8rem; }
        .ag-topic-content { color: var(--text-muted); font-size: 0.9rem; margin-top: 8px; }
        .ag-topic-tactics { color: var(--warning); font-size: 0.85rem; margin-top: 8px; }
      `}</style>

      {deleteConfirm && (
        <CustomDialog
          title="Konuyu Sil"
          message="Bu konuyu silmek istediğinize emin misiniz?"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
