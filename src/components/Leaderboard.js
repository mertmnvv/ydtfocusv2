"use client";

import { useState, useEffect } from "react";
import { getLeaderboard } from "@/lib/firestore";

export default function Leaderboard() {
  const [category, setCategory] = useState("streak"); // streak, weeklyMinutes, masteryCount
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // category mapping for internal query
    const queryCat = category === "weeklyMinutes" ? "weeklyMinutes" : category;
    getLeaderboard(queryCat, 10).then(data => {
      setUsers(data || []);
      setLoading(false);
    });
  }, [category]);

  const categories = [
    { id: "streak", label: "Seri" },
    { id: "weeklyMinutes", label: "Haftalık Vakit" },
    { id: "masteryCount", label: "Bilinen Kelime" },
  ];

  return (
    <div className="leaderboard-component">
      <div className="leaderboard-header">
        <h3 className="section-title">Topluluk Sıralaması</h3>
        <div className="leaderboard-tabs">
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`tab-btn ${category === cat.id ? "active" : ""}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <div className="mini-loading"><div className="spinner-ring sm"></div></div>
        ) : users.length === 0 ? (
          <div className="empty-msg">Henüz veri yok.</div>
        ) : (
          users.map((u, idx) => (
            <div key={u.id} className="leader-item glass-card">
              <div className="leader-rank">{idx + 1}</div>
              <div className="leader-avatar">{u.displayName?.[0] || "?"}</div>
              <div className="leader-info">
                <div className="leader-name">{u.displayName || "Gizli Kullanıcı"}</div>
                <div className="leader-stats-row">
                  {u.publicStats?.lastTestTime > 0 && (
                    <span className="test-time">Son Test: {u.publicStats.lastTestTime}sn</span>
                  )}
                </div>
              </div>
              <div className="leader-score">
                <div className="score-val">
                  {category === "streak" && `${u.publicStats?.streak || 0} Günlük Seri`}
                  {category === "weeklyMinutes" && `${u.publicStats?.weeklyMinutes || 0} dk Bu Hafta`}
                  {category === "masteryCount" && `${u.publicStats?.masteryCount || 0} Kelime`}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .leaderboard-component { margin-top: 32px; }
        .leaderboard-header { margin-bottom: 20px; }
        .leaderboard-tabs { display: flex; gap: 8px; margin-top: 12px; }
        .tab-btn {
          flex: 1; padding: 12px; border-radius: 12px; border: 1px solid var(--border);
          background: var(--glass); color: var(--text-muted); font-size: 0.85rem;
          font-weight: 700; transition: all 0.2s; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }
        .tab-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
        .leader-item {
          display: flex; align-items: center; gap: 16px; padding: 16px; margin-bottom: 12px;
          border-color: rgba(255, 255, 255, 0.05); transition: transform 0.2s;
        }
        .leader-item:hover { transform: scale(1.01); border-color: var(--accent-muted); }
        .leader-rank { font-size: 1.2rem; font-weight: 900; width: 24px; color: var(--accent); opacity: 0.8; }
        .leader-avatar {
          width: 40px; height: 40px; border-radius: 12px; background: var(--border);
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem;
        }
        .leader-info { flex: 1; }
        .leader-name { font-weight: 800; margin-bottom: 4px; font-size: 0.95rem; }
        .leader-stats-row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .test-time { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
        .score-val { font-weight: 900; color: var(--text); font-size: 0.9rem; }
        .mini-loading { display: flex; justify-content: center; padding: 40px; }
      `}</style>
    </div>
  );
}
