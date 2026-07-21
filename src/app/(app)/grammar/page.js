"use client";

import { useState, useEffect } from "react";
import { getGrammarTopics } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function GrammarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    getGrammarTopics()
      .then(setTopics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (authLoading || loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!user) {
    return (
      <div className="grammar-page">
        <div className="grammar-empty">
          <h3>Bu İçeriği Görmek İçin Kayıt Olmalısın</h3>
          <p className="hint-text">Kendi ilerlemenizi kaydetmek ve tüm içeriklere erişmek için ücretsiz hesap oluşturun.</p>
          <button onClick={() => router.push('/login')} className="btn-primary">Giriş Yap / Kayıt Ol</button>
        </div>
      </div>
    );
  }

  return (
    <div className="grammar-page">
      <h1 className="grammar-title">Gramer Ansiklopedisi</h1>
      <p className="grammar-subtitle">YDT/YDS/YÖKDİL için sınav bazlı gramer konuları</p>

      {topics.length === 0 ? (
        <div className="grammar-empty">
          <h3>Henüz İçerik Yok</h3>
          <p className="hint-text">Gramer konuları admin panelinden eklenebilir.</p>
        </div>
      ) : (
        <div className="grammar-list">
          {topics.map(topic => {
            const isOpen = expandedId === topic.id;
            return (
              <div key={topic.id} className="grammar-item">
                <button className="grammar-item-head" onClick={() => setExpandedId(isOpen ? null : topic.id)}>
                  <span className="grammar-item-title">{topic.sortOrder}. {topic.title}</span>
                  <span className="grammar-item-chevron">{isOpen ? "▾" : "▸"}</span>
                </button>
                {isOpen && (
                  <div className="grammar-item-body">
                    <div className="grammar-content" dangerouslySetInnerHTML={{ __html: topic.content?.replace(/\n/g, "<br/>") }} />
                    {topic.tactics && (
                      <div className="grammar-tactics">
                        <h4>ÖSYM Taktikleri</h4>
                        <p>{topic.tactics}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .grammar-page { max-width: 720px; margin: 0 auto; padding: 20px 0 60px; }
        .grammar-title { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.5px; color: var(--text); }
        .grammar-subtitle { color: var(--text-muted); font-size: 0.9rem; margin: 4px 0 28px; }
        .grammar-empty { text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; }
        .grammar-empty h3 { font-weight: 800; margin-bottom: 8px; font-size: 1.1rem; }
        .grammar-empty button { margin-top: 16px; padding: 14px 28px; border-radius: 12px; }
        .grammar-list { display: flex; flex-direction: column; gap: 10px; }
        .grammar-item { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .grammar-item-head {
          width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 18px 20px; background: none; border: none; cursor: pointer; text-align: left;
        }
        .grammar-item-title { font-weight: 700; color: var(--text); font-size: 0.95rem; }
        .grammar-item-chevron { color: var(--text-muted); font-size: 1rem; }
        .grammar-item-body { padding: 0 20px 20px; }
        .grammar-content { line-height: 1.8; color: var(--text); font-size: 0.9rem; }
        .grammar-tactics {
          margin-top: 16px; padding: 16px; background: rgba(255, 159, 10, 0.06);
          border: 1px solid rgba(255, 159, 10, 0.2); border-radius: 12px;
        }
        .grammar-tactics h4 { color: var(--warning); font-weight: 800; margin-bottom: 8px; font-size: 0.85rem; }
        .grammar-tactics p { color: var(--text-muted); line-height: 1.6; font-size: 0.88rem; }
      `}</style>
    </div>
  );
}
