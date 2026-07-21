"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { subscribeToUserWords, subscribeToUserStats, getUserHeroStats, checkAndGrantBadges } from "@/lib/firestore";
import { BADGES } from "@/constants/badges";
import Leaderboard from "@/components/Leaderboard";

export default function AchievementsPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && stats && words.length > 0) {
      getUserHeroStats(user.uid).then(h => {
        checkAndGrantBadges(user.uid, stats, words.length, h.levels, words);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, stats, user]);

  if (authLoading || loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  if (!user) {
    return (
      <div className="achievements-page">
        <div className="ach-gate">
          <h3>Rozetlerini Görmek İçin Kayıt Olmalısın</h3>
          <p className="hint-text">Sistemdeki ilerlemelerinize göre kazandığınız başarıları görüntülemek için giriş yapın.</p>
          <button onClick={() => window.location.href='/login'} className="btn-primary">Giriş Yap / Kayıt Ol</button>
        </div>
      </div>
    );
  }

  const earnedCount = userProfile?.badges?.length || 0;
  const totalCount = Object.keys(BADGES).length;
  const progressPct = Math.round((earnedCount / totalCount) * 100);

  return (
    <div className="achievements-page">
      <div className="ach-header">
        <div>
          <h1 className="ach-title">Rozetler</h1>
          <p className="ach-subtitle">Akademik hedeflerini tamamla, rozetlerini topla.</p>
        </div>
        <div className="ach-progress-summary">
          <span className="ach-progress-count">{earnedCount}/{totalCount}</span>
          <div className="ach-progress-bar"><div className="ach-progress-fill" style={{ width: `${progressPct}%` }}></div></div>
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

      <div className="ach-leaderboard-section">
        <div className="ach-leaderboard-header">
          <h2 className="ach-section-title">Liderlik Tablosu</h2>
          <p className="ach-filter-hint">En iyi öğrenciler arasındaki yerini gör.</p>
        </div>
        <Leaderboard />
      </div>

      <style jsx>{`
        .achievements-page { max-width: 1000px; margin: 0 auto; padding: 20px 0 100px; }

        .ach-gate { max-width: 480px; margin: 60px auto; text-align: center; padding: 60px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; }
        .ach-gate h3 { font-weight: 800; margin-bottom: 12px; font-size: 1.2rem; }
        .ach-gate button { margin-top: 16px; padding: 14px 28px; border-radius: 12px; }

        .ach-header { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; margin-bottom: 36px; flex-wrap: wrap; }
        .ach-title { font-size: 1.8rem; font-weight: 900; letter-spacing: -1px; color: var(--text); }
        .ach-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 6px; }
        .ach-progress-summary { min-width: 160px; }
        .ach-progress-count { font-size: 0.85rem; font-weight: 800; color: var(--accent); display: block; margin-bottom: 6px; text-align: right; }
        .ach-progress-bar { height: 6px; background: var(--glass); border-radius: 4px; overflow: hidden; width: 160px; }
        .ach-progress-fill { height: 100%; background: var(--accent); transition: width 1s ease; }

        .ach-category-section { margin-bottom: 48px; }
        .ach-section-header { margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
        .ach-section-title { font-size: 0.9rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: var(--accent); }
        .ach-filter-hint { font-size: 0.78rem; color: var(--text-muted); font-weight: 600; }

        .ach-full-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
        .ach-full-card {
          display: flex; gap: 16px; padding: 18px 20px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
          transition: all 0.25s ease; position: relative;
        }
        .ach-full-card.earned { border-left: 3px solid var(--b-color); }
        .ach-full-card.locked { opacity: 0.5; filter: grayscale(1); border-style: dashed; }
        .ach-full-card:hover { border-color: var(--b-color); opacity: 1; filter: grayscale(0); }

        .ach-card-icon {
          width: 46px; height: 46px; border-radius: 14px; background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
          color: var(--b-color); flex-shrink: 0;
        }
        .ach-lock-icon { font-size: 1rem; color: var(--text-muted); opacity: 0.5; }

        .ach-card-info { flex: 1; min-width: 0; }
        .ach-card-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; }
        .ach-card-name { font-size: 0.95rem; font-weight: 800; color: var(--text); }
        .ach-difficulty-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .diff-1 { background: #34c759; }
        .diff-2 { background: #007aff; }
        .diff-3 { background: #ffcc00; }
        .diff-4 { background: #ff9500; }
        .diff-5 { background: #ff3b30; }

        .ach-card-desc { font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 8px; }
        .ach-earned-tag { font-size: 0.68rem; font-weight: 800; color: var(--accent); text-transform: uppercase; display: flex; align-items: center; gap: 4px; }

        .ach-leaderboard-section { padding-top: 20px; border-top: 1px solid var(--border); }
        .ach-leaderboard-header { margin-bottom: 20px; }
        .ach-leaderboard-header p { margin-top: 4px; }

        @media (max-width: 768px) {
          .ach-header { flex-direction: column; align-items: flex-start; }
          .ach-full-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
