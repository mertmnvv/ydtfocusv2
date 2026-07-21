"use client";

import { useEffect, useState } from "react";
import { getFeedbacks } from "@/lib/firestore";

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getFeedbacks();
        setFeedbacks(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Geri bildirimler yükleniyor...</p></div>;
  }

  return (
    <div className="admin-feedback-container">
      <div className="glass-card af-card">
        <div className="af-header">
          <h3 className="section-title">Geri Bildirimler ({feedbacks.length})</h3>
        </div>
        <div className="af-list">
          {feedbacks.length === 0 ? (
            <p className="af-empty">Henüz geri bildirim gelmedi.</p>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="af-item">
                <div className="af-user-info">
                  <span className="af-user-name">{fb.userName}</span>
                  <span className="af-user-email">{fb.userEmail}</span>
                  <span className="af-date">{new Date(fb.createdAt).toLocaleString("tr-TR")}</span>
                </div>
                <div className="af-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i
                      key={star}
                      className={`fa-star ${star <= fb.rating ? "fa-solid active" : "fa-regular"}`}
                    ></i>
                  ))}
                </div>
                <div className="af-comment">
                  {fb.comment}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-feedback-container { padding-bottom: 40px; }
        .af-card { padding: 0; overflow: hidden; }

        .af-header {
          padding: 24px 32px;
          border-bottom: 1px solid var(--border);
        }

        .af-list { display: flex; flex-direction: column; }

        .af-item {
          padding: 24px 32px;
          border-bottom: 1px solid var(--border);
        }
        .af-item:last-child { border-bottom: none; }

        .af-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .af-user-name { font-weight: 700; color: var(--text); font-size: 0.95rem; }
        .af-user-email { color: var(--text-muted); font-size: 0.85rem; }
        .af-date { margin-left: auto; color: var(--text-muted); font-size: 0.8rem; opacity: 0.7; }

        .af-rating { color: var(--border); margin-bottom: 12px; display: flex; gap: 4px; }
        .af-rating i.active { color: var(--accent); }

        .af-comment {
          color: var(--text);
          font-size: 1rem;
          line-height: 1.6;
          white-space: pre-wrap;
          background: var(--bg-elevated);
          padding: 16px;
          border-radius: 12px;
          border-left: 3px solid var(--accent);
        }

        .af-empty { padding: 60px; text-align: center; color: var(--text-muted); font-size: 1rem; }

        @media (max-width: 768px) {
          .af-user-info { flex-direction: column; align-items: flex-start; gap: 4px; }
          .af-date { margin-left: 0; margin-top: 4px; }
        }
      `}</style>
    </div>
  );
}
