"use client";

import { useState, useEffect } from "react";
import { getGrammarTopics } from "@/lib/firestore";

export default function GrammarPage() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getGrammarTopics()
      .then(setTopics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div><p>Yükleniyor...</p></div>;

  return (
    <div>
      <h2 className="section-title">YDT Gramer Ansiklopedisi</h2>

      {topics.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: "1.5rem", marginBottom: 12, color: "var(--text-muted)" }}>Gramer</div>
          <h3 style={{ fontWeight: 800, marginBottom: 8 }}>Henüz İçerik Yok</h3>
          <p className="hint-text">Gramer konuları admin panelinden eklenebilir.</p>
        </div>
      ) : (
        <div className="grammar-list">
          {topics.map(topic => (
            <div key={topic.id} className="glass-card grammar-item" style={{ cursor: "pointer" }}
              onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}>
              <div className="header-split">
                <h3 style={{ fontWeight: 800, color: "var(--accent)", fontSize: "1.1rem" }}>
                  {topic.sortOrder}. {topic.title}
                </h3>
                <span style={{ color: "var(--text-muted)", fontSize: "1.2rem" }}>
                  {expandedId === topic.id ? "▾" : "▸"}
                </span>
              </div>
              {expandedId === topic.id && (
                <div style={{ marginTop: 16 }}>
                  <div className="grammar-content" style={{ lineHeight: 1.8, color: "var(--text)" }}
                    dangerouslySetInnerHTML={{ __html: topic.content?.replace(/\n/g, "<br/>") }} />
                  {topic.tactics && (
                    <div style={{
                      marginTop: 16, padding: 16,
                      background: "rgba(255,159,10,0.05)", border: "1px solid rgba(255,159,10,0.2)",
                      borderRadius: 14,
                    }}>
                      <h4 style={{ color: "var(--warning)", fontWeight: 800, marginBottom: 8 }}>ÖSYM Taktikleri</h4>
                      <p style={{ color: "var(--text-muted)", lineHeight: 1.6 }}>{topic.tactics}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
