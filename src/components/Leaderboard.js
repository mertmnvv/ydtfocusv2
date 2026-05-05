"use client";

import { useState, useEffect } from "react";
import { getLeaderboard } from "@/lib/firestore";
import ProfileModal from "./ProfileModal";

export default function Leaderboard() {
  const [category, setCategory] = useState("streak"); // streak, weeklyMinutes, dailyMinutes, masteryCount, weeklyReadings
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(category, 10).then(data => {
      setUsers(data || []);
      setLoading(false);
    });
  }, [category]);

  const categories = [
    { id: "streak", label: "Seri", icon: "fa-fire" },
    { id: "weeklyMinutes", label: "Haftalık", icon: "fa-calendar-week" },
    { id: "dailyMinutes", label: "Günlük", icon: "fa-clock" },
    { id: "masteryCount", label: "Kelime", icon: "fa-brain" },
    { id: "weeklyReadings", label: "Metin", icon: "fa-book-open" },
  ];

  const getScoreLabel = (u) => {
    const val = u.publicStats?.[category] || 0;
    if (category === "streak") return `${val} Gün`;
    if (category.includes("Minutes")) return `${val} dk`;
    if (category === "masteryCount") return `${val} Kelime`;
    if (category === "weeklyReadings") return `${val} Metin`;
    return val;
  };

  return (
    <div className="leaderboard-component">
      <div className="leaderboard-header">
        <h3 className="section-title">Liderlik Tablosu</h3>
        <div className="leaderboard-tabs-wrapper">
          <div className="leaderboard-tabs">
            {categories.map(cat => (
              <button 
                key={cat.id} 
                className={`tab-btn ${category === cat.id ? "active" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                <i className={`fa-solid ${cat.icon} tab-icon`}></i>
                <span className="tab-label">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <div className="mini-loading"><div className="spinner-ring sm"></div></div>
        ) : users.length === 0 ? (
          <div className="empty-msg">Bu kategoride henüz veri yok.</div>
        ) : (
          users.map((u, idx) => (
            <div key={u.id} className="leader-item glass-card" onClick={() => setSelectedUserId(u.id)}>
              <div className="leader-rank">
                {idx === 0 ? <i className="fa-solid fa-trophy" style={{ color: "#ffd60a" }}></i> : idx + 1}
              </div>
              <div className={`leader-avatar ${(u.role === 'premium' || u.role === 'admin') ? 'premium-glow' : ''}`}>
                {u.photoURL ? (
                  <img src={u.photoURL} alt={u.displayName} className="leader-avatar-img" />
                ) : (
                  u.displayName?.[0] || "?"
                )}
              </div>
              <div className="leader-info">
                <div className="leader-name">
                  {u.displayName || "Gizli Kullanıcı"}
                  {u.role === "admin" ? (
                    <i className="fa-solid fa-user-shield" style={{ color: "#ff453a", marginLeft: 6, fontSize: "0.8rem" }} title="Yönetici"></i>
                  ) : u.role === "premium" ? (
                    <i className="fa-solid fa-crown" style={{ color: "#ffd60a", marginLeft: 6, fontSize: "0.8rem" }} title="Premium Üye"></i>
                  ) : null}
                </div>
              </div>
              <div className="leader-score">
                <div className="score-val">{getScoreLabel(u)}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedUserId && (
        <ProfileModal 
          userId={selectedUserId} 
          onClose={() => setSelectedUserId(null)} 
        />
      )}

      <style jsx>{`
        .leaderboard-component { margin-top: 32px; }
        .leaderboard-header { margin-bottom: 20px; }
        .leaderboard-tabs-wrapper { 
          overflow-x: auto; 
          margin: 0 -16px; 
          padding: 4px 16px;
          -webkit-overflow-scrolling: touch;
        }
        .leaderboard-tabs-wrapper::-webkit-scrollbar { display: none; }
        
        .leaderboard-tabs { 
          display: flex; 
          gap: 8px; 
          margin-top: 12px; 
          min-width: max-content;
        }
        
        .tab-btn {
          padding: 10px 16px; border-radius: 14px; border: 1px solid var(--border);
          background: var(--glass); color: var(--text-muted); font-size: 0.8rem;
          font-weight: 700; transition: all 0.2s; cursor: pointer; 
          display: flex; align-items: center; gap: 8px;
        }
        .tab-btn:hover { border-color: var(--accent-muted); color: var(--text); }
        .tab-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }
        .tab-icon { font-size: 0.9rem; }
        
        .leader-item {
          display: flex; align-items: center; gap: 16px; padding: 14px 16px; margin-bottom: 10px;
          border-color: rgba(255, 255, 255, 0.05); transition: all 0.2s; cursor: pointer;
          border-radius: 16px;
        }
        .leader-item:hover { transform: translateY(-2px); border-color: var(--accent-muted); background: var(--glass-heavy); }
        
        .leader-rank { 
          font-size: 1.1rem; font-weight: 900; width: 30px; 
          color: var(--text-muted); display: flex; justify-content: center;
        }
        
        .leader-avatar {
          width: 42px; height: 42px; border-radius: 12px; background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.1rem;
          color: var(--text); border: 1px solid var(--border); overflow: hidden;
        }
        .leader-avatar-img { width: 100%; height: 100%; object-fit: cover; }
        
        .leader-avatar.premium-glow {
          border-color: #ffd60a;
          box-shadow: 0 0 12px rgba(255, 214, 10, 0.2);
        }
        
        .leader-info { flex: 1; }
        .leader-name { font-weight: 800; margin-bottom: 2px; font-size: 0.95rem; color: var(--text); display: flex; align-items: center; }
        
        .score-val { 
          font-weight: 900; color: var(--accent); font-size: 0.95rem; 
          background: rgba(var(--accent-rgb), 0.1); padding: 4px 10px; border-radius: 8px;
        }
        
        .mini-loading { display: flex; justify-content: center; padding: 40px; }
        .empty-msg { text-align: center; padding: 30px; color: var(--text-muted); font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
