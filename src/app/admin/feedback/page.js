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
    return <div className="admin-loading">Geri bildirimler yükleniyor...</div>;
  }

  return (
    <div className="admin-feedback-container">
      <div className="admin-card">
        <div className="card-header">
          <h3>Geri Bildirimler ({feedbacks.length})</h3>
        </div>
        <div className="feedback-list">
          {feedbacks.length === 0 ? (
            <p className="no-feedback">Henüz geri bildirim gelmedi.</p>
          ) : (
            feedbacks.map((fb) => (
              <div key={fb.id} className="feedback-item">
                <div className="fb-user-info">
                  <span className="fb-user-name">{fb.userName}</span>
                  <span className="fb-user-email">{fb.userEmail}</span>
                  <span className="fb-date">{new Date(fb.createdAt).toLocaleString("tr-TR")}</span>
                </div>
                <div className="fb-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i 
                      key={star} 
                      className={`fa-star ${star <= fb.rating ? "fa-solid active" : "fa-regular"}`}
                    ></i>
                  ))}
                </div>
                <div className="fb-comment">
                  {fb.comment}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        .admin-feedback-container {
          padding-bottom: 40px;
        }

        .admin-card {
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          overflow: hidden;
        }

        .card-header {
          padding: 24px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.02);
        }

        .card-header h3 {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
        }

        .feedback-list {
          display: flex;
          flex-direction: column;
        }

        .feedback-item {
          padding: 24px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          transition: background 0.2s;
        }

        .feedback-item:hover {
          background: rgba(255, 255, 255, 0.01);
        }

        .feedback-item:last-child {
          border-bottom: none;
        }

        .fb-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }

        .fb-user-name {
          font-weight: 700;
          color: #fff;
          font-size: 0.95rem;
        }

        .fb-user-email {
          color: #86868b;
          font-size: 0.85rem;
        }

        .fb-date {
          margin-left: auto;
          color: #48484a;
          font-size: 0.8rem;
        }

        .fb-rating {
          color: #3a3a3c;
          margin-bottom: 12px;
          display: flex;
          gap: 4px;
        }

        .fb-rating i.active {
          color: var(--accent);
        }

        .fb-comment {
          color: #e2e2e2;
          font-size: 1rem;
          line-height: 1.6;
          white-space: pre-wrap;
          background: rgba(255, 255, 255, 0.02);
          padding: 16px;
          border-radius: 12px;
          border-left: 3px solid var(--accent);
        }

        .no-feedback {
          padding: 60px;
          text-align: center;
          color: #86868b;
          font-size: 1rem;
        }

        .admin-loading {
          padding: 60px;
          text-align: center;
          color: var(--accent);
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .fb-user-info {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          .fb-date {
            margin-left: 0;
            margin-top: 4px;
          }
        }
      `}</style>
    </div>
  );
}
