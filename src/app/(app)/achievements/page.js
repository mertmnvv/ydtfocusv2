"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserWords, subscribeToUserStats, getUserHeroStats, checkAndGrantBadges } from "@/lib/firestore";
import { BADGES } from "@/constants/badges";

export default function AchievementsPage() {
  const { user, userProfile } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    let unsubWords = () => {};
    let unsubStats = () => {};

    const setup = async () => {
      try {
        const h = await getUserHeroStats(user.uid);
        
        unsubWords = subscribeToUserWords(user.uid, (wordList) => {
          if (isMounted) {
            setWords(wordList);
            setLoading(false);
          }
        });

        unsubStats = subscribeToUserStats(user.uid, (s) => {
          if (isMounted) {
            setStats(s || {});
            checkAndGrantBadges(user.uid, s, words.length, h.levels, words);
          }
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    setup();
    return () => {
      isMounted = false;
      unsubWords();
      unsubStats();
    };
  }, [user]);

  // Reactive badge check when data changes
  useEffect(() => {
    if (user && stats && words.length > 0) {
      getUserHeroStats(user.uid).then(h => {
        checkAndGrantBadges(user.uid, stats, words.length, h.levels, words);
      });
    }
  }, [words, stats]);

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  const earnedCount = userProfile?.badges?.length || 0;
  const totalCount = Object.keys(BADGES).length;
  const progressPct = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="achievements-page">
      <div className="ach-hero-card glass-card">
        <div className="ach-hero-content">
          <div className="ach-hero-main">
            <h1 className="ach-page-title">Gelişim Yolculuğu</h1>
            <p className="ach-page-desc">Akademik hedeflerini tamamla, yetkinliklerini kanıtla ve profesyonel rozetlerini topla.</p>
          </div>
          <div className="ach-progress-circle">
            <svg viewBox="0 0 36 36" className="circular-chart">
              <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className="circle" style={{ strokeDasharray: `${progressPct}, 100` }} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" className="percentage">%{progressPct}</text>
            </svg>
            <div className="ach-count-text">{earnedCount} / {totalCount} Rozet</div>
          </div>
        </div>
      </div>

      <div className="ach-grid-container">
        {Object.entries(
          Object.values(BADGES).reduce((acc, badge) => {
            if (!acc[badge.category]) acc[badge.category] = [];
            acc[badge.category].push(badge);
            return acc;
          }, {})
        ).map(([category, categoryBadges]) => (
          <div key={category} className="ach-category-section">
            <div className="ach-section-header">
              <h2 className="ach-section-title">{category}</h2>
              <div className="ach-filter-hint">{categoryBadges.length} Rozet</div>
            </div>

            <div className="ach-full-grid">
              {categoryBadges
                .sort((a, b) => a.difficulty - b.difficulty)
                .map(badge => {
                  const isEarned = userProfile?.badges?.includes(badge.id);
                  return (
                    <div 
                      key={badge.id} 
                      className={`ach-full-card ${isEarned ? 'earned' : 'locked'}`}
                      style={{ "--b-color": isEarned ? badge.color : "var(--border)" }}
                    >
                      <div className="ach-card-icon">
                        {isEarned ? (
                          <i className={`fa-solid ${badge.icon}`}></i>
                        ) : (
                          <i className="fa-solid fa-lock ach-lock-icon"></i>
                        )}
                      </div>
                      <div className="ach-card-info">
                        <div className="ach-card-top">
                          <span className="ach-card-name">{badge.name}</span>
                          <span className={`ach-difficulty-dot diff-${badge.difficulty}`} title={`Zorluk: ${badge.difficulty}/5`}></span>
                        </div>
                        <p className="ach-card-desc">
                          {isEarned ? badge.description : `Hedef: ${badge.requirement}`}
                        </p>
                        {isEarned && <div className="ach-earned-tag"><i className="fa-solid fa-check"></i> Kazanıldı</div>}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .achievements-page { padding: 20px; max-width: 1200px; margin: 0 auto; padding-bottom: 100px; }
        
        .ach-hero-card { 
          background: linear-gradient(135deg, rgba(10, 132, 255, 0.1), rgba(191, 90, 242, 0.05));
          padding: 40px; border-radius: 32px; margin-bottom: 40px; border: 1px solid rgba(10, 132, 255, 0.2);
        }
        .ach-hero-content { display: flex; align-items: center; justify-content: space-between; gap: 40px; }
        .ach-page-title { font-size: 2.5rem; font-weight: 900; margin-bottom: 12px; letter-spacing: -1px; }
        .ach-page-desc { font-size: 1.1rem; color: var(--text-muted); max-width: 500px; line-height: 1.6; }

        .ach-progress-circle { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .circular-chart { width: 120px; height: 120px; }
        .circle-bg { fill: none; stroke: var(--border); stroke-width: 2.8; }
        .circle { fill: none; stroke: var(--accent); stroke-width: 2.8; stroke-linecap: round; transition: stroke-dasharray 1s ease; }
        .percentage { fill: var(--text); font-size: 0.5rem; font-weight: 800; text-anchor: middle; }
        .ach-count-text { font-size: 0.9rem; font-weight: 800; color: var(--accent); }

        .ach-category-section { margin-bottom: 60px; }
        .ach-section-header { margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
        .ach-section-title { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: var(--accent); }
        .ach-filter-hint { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; }

        .ach-full-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .ach-full-card { 
          display: flex; gap: 20px; padding: 24px; background: var(--glass); border: 1px solid var(--border); border-radius: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; overflow: hidden;
        }
        .ach-full-card.earned { border-left: 6px solid var(--b-color); }
        .ach-full-card.locked { opacity: 0.5; filter: grayscale(1); border-style: dashed; }
        .ach-full-card:hover { transform: translateY(-5px); border-color: var(--b-color); opacity: 1; filter: grayscale(0); }

        .ach-card-icon { 
          width: 56px; height: 56px; border-radius: 18px; background: var(--bg-elevated); 
          display: flex; align-items: center; justify-content: center; font-size: 1.5rem; 
          color: var(--b-color); flex-shrink: 0; box-shadow: 0 8px 20px rgba(0,0,0,0.1);
        }
        .ach-lock-icon { font-size: 1.2rem; color: var(--text-muted); opacity: 0.4; }

        .ach-card-info { flex: 1; }
        .ach-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .ach-card-name { font-size: 1.1rem; font-weight: 800; color: var(--text); }
        .ach-difficulty-dot { width: 8px; height: 8px; border-radius: 50%; }
        .diff-1 { background: #34c759; }
        .diff-2 { background: #007aff; }
        .diff-3 { background: #ffcc00; }
        .diff-4 { background: #ff9500; }
        .diff-5 { background: #ff3b30; }

        .ach-card-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; font-weight: 500; margin-bottom: 12px; }
        .ach-earned-tag { font-size: 0.7rem; font-weight: 900; color: var(--accent); text-transform: uppercase; display: flex; align-items: center; gap: 4px; }

        @media (max-width: 768px) {
          .ach-hero-content { flex-direction: column; text-align: center; gap: 24px; padding: 20px; }
          .ach-page-title { font-size: 1.8rem; }
          .ach-full-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
