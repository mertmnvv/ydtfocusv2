"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserStats, updateLastReminderDate } from "@/lib/firestore";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";

export default function DashboardPage() {
  const { user, userProfile, isAdmin } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, studyTime: 0, weeklyMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [w, s] = await Promise.all([
          getUserWords(user.uid),
          getUserStats(user.uid),
        ]);
        
        if (!isMounted) return;
        const wordList = w || [];
        setWords(wordList);
        setStats({ ...(s || {}), streak: s?.streak || 0 });
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();
    return () => { isMounted = false; };
  }, [user]);

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  const total = words.length;
  const masteredCount = words.filter(w => w.level >= 4).length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  const dueCount = words.filter(w => (w.nextReview || 0) <= Date.now()).length;
  
  const levels = [
    { name: "Yeni", key: "level0", color: "#ff453a" },
    { name: "Adım 1", key: "level1", color: "#ff9f0a" },
    { name: "Adım 2", key: "level2", color: "#ffd60a" },
    { name: "Adım 3", key: "level3", color: "#30d158" },
    { name: "Hazine", key: "level4", color: "#0a84ff" },
  ];

  const levelWords = {
    level0: words.filter(w => !w.level || w.level === 0),
    level1: words.filter(w => w.level === 1),
    level2: words.filter(w => w.level === 2),
    level3: words.filter(w => w.level === 3),
    level4: words.filter(w => w.level >= 4),
  };

  const maxLevel = Math.max(...Object.values(levelWords).map(arr => arr.length), 1);

  return (
    <div className="dashboard-page profile-panel-view">
      <div className="profile-header minimal">
        <div className="profile-large-avatar sm">
          {userProfile?.displayName?.[0] || user?.email?.[0] || "U"}
        </div>
        <div className="profile-header-info">
          <h1 className="profile-name-small">{userProfile?.displayName || "Kullanıcı"}</h1>
          <div className="profile-badges sm">
            <span className="badge-item">YDT Öğrencisi</span>
            {isAdmin && <span className="badge-item admin-badge">Admin</span>}
          </div>
        </div>
      </div>

      <div className="dash-divider"></div>

      <div className="daily-focus-container">
        <div className="glass-card daily-focus-card">
          <div className="focus-content">
            <div className="focus-label">BUGÜNÜN HEDEFİ</div>
            <h2 className="focus-title">
              {dueCount > 0 ? `${dueCount} Kelime Seni Bekliyor` : "Harika! Bugün her şey taze."}
            </h2>
            <p className="focus-desc">
              {dueCount > 0 
                ? "Unutma eğrisine yenik düşmeden kelimelerini tekrar etmelisin."
                : "Tüm kelimelerin şu an güvende. Yeni kelimeler ekleyerek ilerleyebilirsin."}
            </p>
          </div>
          <Link href={dueCount > 0 ? "/srs" : "/archive"} className={`focus-btn ${dueCount > 0 ? "pulse-animation" : ""}`}>
            {dueCount > 0 ? "Akıllı Tekrarı Başlat" : "Sözlüğe Göz At"}
          </Link>
        </div>
      </div>

      <div className="dash-header">
        <h2 className="dash-title">Level Up</h2>
        <p className="dash-subtitle">Kişisel gelişim ve istatistiklerin.</p>
      </div>

      <div className="dash-bento-stats">
        <div className="dash-bento-card" style={{ background: "linear-gradient(135deg, rgba(255,159,10,0.1), transparent)", borderColor: "rgba(255,159,10,0.2)" }}>
          <div className="dash-bento-value" style={{ color: "#ff9f0a" }}>{stats.streak || 0} Gün</div>
          <div className="dash-bento-label">Çalışma Serisi</div>
        </div>
        <div className="dash-bento-card" style={{ background: "linear-gradient(135deg, rgba(48,209,88,0.1), transparent)", borderColor: "rgba(48,209,88,0.2)" }}>
          <div className="dash-bento-value" style={{ color: "var(--primary)" }}>{total}</div>
          <div className="dash-bento-label">Toplam Kelime</div>
        </div>
        <div className="dash-bento-card" style={{ gridColumn: "span 2", background: "linear-gradient(135deg, rgba(191,90,242,0.1), transparent)", borderColor: "rgba(191,90,242,0.2)" }}>
          <div className="dash-bento-value" style={{ color: "#bf5af2" }}>{stats.weeklyMinutes || 0} dk</div>
          <div className="dash-bento-label">Haftalık Çalışma Süresi</div>
        </div>
      </div>

      <div className="glass-card dash-goal-card">
        <div className="dash-goal-top">
          <span className="dash-goal-label">Bilinen Kelime Sayısı</span>
          <span className="dash-goal-numbers">{masteredCount} / {total}</span>
        </div>
        <div className="dash-goal-bar">
          <div className="dash-goal-fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
        </div>
        <div className="dash-goal-footer">
          <span className="dash-goal-pct">Kelimelerin %{pct} kadarı kalıcı hafızada</span>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="dash-section-title">Kelime Seviyeleri</h3>
        <p className="hint-text">Seviyeye tıklayıp kelimelerini görüntüle.</p>
        <div className="dash-levels">
          {levels.map(lv => {
            const count = levelWords[lv.key].length;
            const isExpanded = expandedLevel === lv.key;
            return (
              <div key={lv.key} className="dash-level-container">
                <div className="dash-level-row" onClick={() => setExpandedLevel(isExpanded ? null : lv.key)} style={{ cursor: "pointer" }}>
                  <span className="dash-level-badge" style={{ background: `${lv.color}22`, color: lv.color }}>{lv.name}</span>
                  <div className="dash-level-bar-bg">
                    <div className="dash-level-bar-fill" style={{ width: `${(count / maxLevel) * 100}%`, background: lv.color }}></div>
                  </div>
                  <span className="dash-level-count">{count}</span>
                  <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                </div>
                {isExpanded && (
                  <div className="dash-level-words">
                    {count === 0 ? <div className="dash-level-word-empty">Henüz kelime yok.</div> : levelWords[lv.key].map((w, i) => (
                      <div key={i} className="dash-level-word-item"><b>{w.word}</b> <span style={{ color: "var(--text-muted)" }}>{w.meaning}</span></div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Leaderboard />



      <style jsx>{`
        .daily-focus-container { margin-bottom: 32px; }
        .daily-focus-card {
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          background: linear-gradient(135deg, rgba(226, 183, 20, 0.1), rgba(10, 132, 255, 0.05));
          border: 1px solid rgba(226, 183, 20, 0.3); padding: 32px; border-radius: 24px;
        }
        .focus-content { flex: 1; }
        .focus-label { font-size: 0.7rem; font-weight: 800; color: var(--accent); letter-spacing: 1.5px; margin-bottom: 8px; }
        .focus-title { font-size: 1.6rem; font-weight: 900; margin-bottom: 8px; color: var(--text); letter-spacing: -0.5px; }
        .focus-desc { font-size: 0.95rem; color: var(--text-muted); line-height: 1.5; max-width: 400px; }
        .focus-btn {
          background: var(--accent); color: #000; padding: 16px 32px; border-radius: 16px;
          font-weight: 800; font-size: 1rem; text-decoration: none; transition: all 0.3s;
          box-shadow: 0 10px 30px rgba(226, 183, 20, 0.3); white-space: nowrap;
        }
        .focus-btn:hover { transform: translateY(-4px); box-shadow: 0 15px 40px rgba(226, 183, 20, 0.4); }
        .pulse-animation { animation: pulse-glow 2s infinite; }
        @keyframes pulse-glow {
          0% { transform: scale(1); box-shadow: 0 10px 30px rgba(226, 183, 20, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 15px 50px rgba(226, 183, 20, 0.6); }
          100% { transform: scale(1); box-shadow: 0 10px 30px rgba(226, 183, 20, 0.3); }
        }
        @media (max-width: 768px) {
          .daily-focus-card { flex-direction: column; text-align: center; padding: 24px; }
          .focus-btn { width: 100%; }
          .focus-desc { margin: 0 auto; }
        }
        .dash-level-word-item { padding: 12px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .dash-level-word-item:hover { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
