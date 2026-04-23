"use client";

import { useState, useEffect } from "react";
import { getGrammarTopics, addGrammarTopic, deleteGrammarTopic, updateGrammarTopic } from "@/lib/firestore";

export default function AdminGrammarPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", content: "", sortOrder: 0, tactics: "",
  });

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
    if (!form.title || !form.content) return alert("Başlık ve içerik gerekli!");
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
      alert("Gramer konusu eklendi!");
    } catch (err) {
      alert("Ekleme hatası.");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Bu konuyu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteGrammarTopic(id);
      setTopics(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      alert("Silme hatası.");
    }
  }

  return (
    <div>
      <div className="glass-card">
        <div className="header-split">
          <h3 className="section-title" style={{ marginBottom: 0 }}>📖 Gramer Yönetimi</h3>
          <button className="admin-btn" onClick={() => setShowForm(!showForm)}>
            {showForm ? "✕ İptal" : "+ Konu Ekle"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="admin-form" style={{ marginTop: 20, maxWidth: "100%" }}>
            <input
              placeholder="Konu Başlığı (ör: Tenses - Zamanlar)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="İçerik (HTML destekli)"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
              style={{ minHeight: 150 }}
            />
            <textarea
              placeholder="ÖSYM Taktikleri (opsiyonel)"
              value={form.tactics}
              onChange={(e) => setForm({ ...form, tactics: e.target.value })}
              style={{ minHeight: 80 }}
            />
            <input
              type="number"
              placeholder="Sıra Numarası"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
            />
            <button type="submit" className="admin-btn">✓ Kaydet</button>
          </form>
        )}

        {loading ? (
          <div className="page-loading"><div className="spinner-ring"></div></div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {topics.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 30 }}>
                Henüz gramer konusu eklenmemiş.
              </p>
            ) : (
              topics.map((topic, i) => (
                <div
                  key={topic.id}
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid var(--border)",
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 12,
                  }}
                >
                  <div className="header-split">
                    <h4 style={{ color: "var(--accent)", fontWeight: 700 }}>
                      {topic.sortOrder}. {topic.title}
                    </h4>
                    <button
                      className="admin-btn admin-btn-danger"
                      style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                      onClick={() => handleDelete(topic.id)}
                    >
                      Sil
                    </button>
                  </div>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: 8 }}>
                    {topic.content?.substring(0, 200)}...
                  </p>
                  {topic.tactics && (
                    <p style={{ color: "var(--warning)", fontSize: "0.85rem", marginTop: 8 }}>
                      ⚠️ Taktik: {topic.tactics?.substring(0, 100)}...
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
