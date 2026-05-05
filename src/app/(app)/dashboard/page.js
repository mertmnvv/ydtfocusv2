"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserStats, updateLastReminderDate, checkAndGrantBadges, getUserHeroStats, subscribeToUserWords, subscribeToUserStats } from "@/lib/firestore";
import { BADGES } from "@/constants/badges";
import Link from "next/link";
import Leaderboard from "@/components/Leaderboard";
import CustomDialog from "@/components/CustomDialog";
import PremiumModal from "@/components/PremiumModal";

export default function DashboardPage() {
  const { user, userProfile, isAdmin, isPremium } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, studyTime: 0, weeklyMinutes: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showAllBadgesPop, setShowAllBadgesPop] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubWords = () => { };
    let unsubStats = () => { };

    const setupListeners = async () => {
      try {
        const h = await getUserHeroStats(user.uid);

        // Real-time Kelime Takibi
        unsubWords = subscribeToUserWords(user.uid, (wordList) => {
          if (!isMounted) return;
          setWords(wordList);
          setLoading(false);
          // Rozetleri kontrol et (Stats gelince de yapılacak)
        });

        // Real-time Stats Takibi
        unsubStats = subscribeToUserStats(user.uid, (s) => {
          if (!isMounted) return;
          setStats({ ...(s || {}), streak: s?.streak || 0 });

          // İki veri de güncelken rozet kontrolü yap
          // (words state'inden alabiliriz çünkü subscribe zaten çalışıyor)
          checkAndGrantBadges(user.uid, s, words.length, h.levels, words);
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    setupListeners();
    return () => {
      isMounted = false;
      unsubWords();
      unsubStats();
    };
  }, [user]); // words bağımlılığını checkAndGrantBadges için useEffect dışında yönetebiliriz ama şimdilik burada kalsın veya useCallback kullanabiliriz.

  // Words değiştiğinde de rozeti kontrol etmek için:
  useEffect(() => {
    if (user && stats && words.length > 0) {
      getUserHeroStats(user.uid).then(h => {
        checkAndGrantBadges(user.uid, stats, words.length, h.levels, words);
      });
    }
  }, [words, stats]);

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

  const isIdFormat = (str) => /^\d{10,15}_[a-z0-9]{3,10}$/.test(str);
  const cleanWords = words.filter(w => !isIdFormat(w.word || ""));

  const levelWords = {
    level0: cleanWords.filter(w => !w.level || w.level === 0),
    level1: cleanWords.filter(w => w.level === 1),
    level2: cleanWords.filter(w => w.level === 2),
    level3: cleanWords.filter(w => w.level === 3),
    level4: cleanWords.filter(w => w.level >= 4),
  };

  const maxLevel = Math.max(...Object.values(levelWords).map(arr => arr.length), 1);

  return (
    <div className="dashboard-page profile-panel-view">
      <div className="profile-header minimal">
        <div className="profile-large-avatar sm">
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt={userProfile.displayName} className="avatar-img" />
          ) : (
            userProfile?.displayName?.[0] || user?.email?.[0] || "U"
          )}
        </div>
        <div className="profile-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="profile-name-small" style={{ margin: 0 }}>{userProfile?.displayName || "Kullanıcı"}</h1>
            <div className="plan-badge-wrapper" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isPremium ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span className="premium-plan-badge">
                    <i className="fa-solid fa-crown"></i> {userProfile?.premiumType === "yearly" ? "Yıllık" : "Aylık"} Elite
                  </span>
                  {userProfile?.premiumUntil && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Bitiş: {new Date(userProfile.premiumUntil).toLocaleDateString('tr-TR')}
                    </span>
                  )}
                </div>
              ) : (
                <span className="standard-plan-badge">Standart Üye</span>
              )}

              {/* Dashboard Header Badges */}
              {userProfile?.badges && userProfile.badges.length > 0 && (
                <div className="dash-mini-badges-container" style={{ position: 'relative' }}>
                  <div className="dash-mini-badges">
                    {userProfile.badges.slice(-3).map(bId => {
                      const badge = BADGES[bId];
                      if (!badge) return null;
                      return (
                        <div key={bId} className="dash-badge-icon" style={{ color: badge.color }} title={badge.name}>
                          <i className={`fa-solid ${badge.icon}`}></i>
                        </div>
                      );
                    })}
                    {userProfile.badges.length > 3 && (
                      <button
                        className="dash-badge-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllBadgesPop(!showAllBadgesPop);
                        }}
                      >
                        +{userProfile.badges.length - 3}
                      </button>
                    )}
                  </div>

                  {showAllBadgesPop && (
                    <>
                      <div className="pop-overlay" onClick={() => setShowAllBadgesPop(false)} />
                      <div className="badges-full-pop animate-popIn">
                        <div className="pop-header">Tüm Rozetlerin</div>
                        <div className="pop-list">
                          {userProfile.badges.map(bId => {
                            const badge = BADGES[bId];
                            if (!badge) return null;
                            return (
                              <div key={bId} className="pop-item">
                                <i className={`fa-solid ${badge.icon}`} style={{ color: badge.color }}></i>
                                <span>{badge.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="profile-badges sm">
            <span className="badge-item">YDT Öğrencisi</span>
            {isAdmin && <span className="badge-item admin-badge">Admin</span>}
            {!isPremium && (
              <button className="buy-premium-mini-btn" onClick={() => setShowPremiumModal(true)}>
                Premium&apos;a Geç
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="dash-divider"></div>

      <div className="daily-focus-container">
        <div className="glass-card daily-focus-card minimal">
          <div className="focus-content">
            <div className="focus-label">BUGÜNÜN HEDEFİ</div>
            {dueCount > 0 ? (
              <>
                <h2 className="focus-title">{dueCount} Kelime Seni Bekliyor</h2>
                <p className="focus-desc">Unutma eğrisine yenik düşmeden kelimelerini şimdi tazelemelisin.</p>
              </>
            ) : (
              <>
                <h2 className="focus-title">Harika! Bugün her şey taze.</h2>
                <p className="focus-desc">Tüm kelimelerin şu an güvende. Yeni kelimeler ekleyerek ilerleyebilirsin.</p>
              </>
            )}
          </div>
          <Link 
            href={dueCount > 0 ? "/srs" : "/archive"} 
            className={`focus-btn ${dueCount > 0 ? 'quiz-btn pulse-animation' : 'archive-btn'}`}
          >
            {dueCount > 0 ? (
              <>
                <i className="fa-solid fa-bolt"></i> Focus Quiz'e Başla
              </>
            ) : (
              "Sözlüğe Göz At"
            )}
          </Link>
        </div>
      </div>

      <div className="dash-header">
        <h2 className="dash-title">Level Up</h2>
        <p className="dash-subtitle">Kişisel gelişim ve istatistiklerin.</p>
      </div>
      
      <div className="stats-view-container animate-fadeIn">
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

        {/* Leaderboard integrated at the bottom */}
        <div className="dash-header" style={{ marginTop: 40 }}>
          <h2 className="dash-title">Liderlik Tablosu</h2>
          <p className="dash-subtitle">En iyi öğrenciler arasındaki yerini gör.</p>
        </div>
        <div className="leaderboard-view-container" style={{ paddingBottom: 40 }}>
          <Leaderboard />
        </div>
      </div>



      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

      <style jsx>{`
        .plan-badge-wrapper { display: flex; }
        .premium-plan-badge { 
          background: linear-gradient(135deg, #ffd60a, #ff9f0a); color: #000; 
          padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 800;
          display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 12px rgba(255, 214, 10, 0.3);
        }
        .standard-plan-badge {
          background: rgba(255,255,255,0.05); color: var(--text-muted);
          padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700;
          border: 1px solid var(--border);
        }
        .dash-mini-badges { display: flex; align-items: center; gap: 6px; margin-left: 6px; }
        .dash-badge-icon { font-size: 0.9rem; opacity: 0.85; transition: 0.2s; }
        .dash-badge-icon:hover { transform: scale(1.2); opacity: 1; }
        .dash-badge-more { 
          font-size: 0.7rem; font-weight: 900; color: var(--text-muted); background: var(--bg-elevated);
          padding: 1px 6px; border-radius: 4px; border: 1px solid var(--border);
          cursor: pointer; transition: 0.2s;
        }
        .dash-badge-more:hover { border-color: var(--accent); color: var(--accent); }

        .badges-full-pop {
          position: absolute; top: 35px; right: 0; z-index: 100;
          background: var(--bg-elevated); border: 1px solid var(--border);
          border-radius: 16px; padding: 16px; min-width: 240px;
          box-shadow: 0 15px 45px rgba(0,0,0,0.6);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .pop-overlay { position: fixed; inset: 0; z-index: 99; }
        .pop-header { font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; margin-bottom: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; letter-spacing: 0.5px; }
        .pop-list { display: flex; flex-direction: column; gap: 4px; max-height: 300px; overflow-y: auto; padding-right: 8px; }
        .pop-item { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; font-weight: 700; color: var(--text); padding: 8px 0; border-radius: 8px; transition: 0.2s; white-space: nowrap; }
        .pop-item i { width: 22px; text-align: center; font-size: 1.1rem; flex-shrink: 0; }
        .buy-premium-mini-btn {
          background: transparent; border: 1px solid var(--accent); color: var(--accent);
          padding: 3px 12px; border-radius: 8px; font-size: 0.7rem; font-weight: 800;
          cursor: pointer; transition: all 0.2s; margin-left: 8px;
        }
        .buy-premium-mini-btn:hover { background: var(--accent); color: #000; }
        .daily-focus-container { margin-bottom: 32px; }
        .daily-focus-card {
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          background: linear-gradient(135deg, rgba(226, 183, 20, 0.1), rgba(48, 209, 88, 0.05));
          border: 1px solid rgba(226, 183, 20, 0.3); padding: 32px; border-radius: 24px;
        }
        .daily-focus-card.minimal { padding: 32px 40px; }
        .focus-content { flex: 1; }
        .focus-label { font-size: 0.75rem; font-weight: 800; color: var(--accent); letter-spacing: 2px; margin-bottom: 12px; }
        .focus-title { font-size: 1.8rem; font-weight: 900; margin-bottom: 8px; color: var(--text); letter-spacing: -1px; }
        .focus-desc { font-size: 1rem; color: var(--text-muted); line-height: 1.5; max-width: 460px; }
        
        .focus-btn {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          padding: 18px 32px; border-radius: 20px;
          font-weight: 800; font-size: 1rem; text-decoration: none; transition: all 0.3s;
          white-space: nowrap; border: 1px solid transparent;
        }
        .focus-btn:hover { transform: translateY(-4px); }
        .focus-btn.quiz-btn { background: var(--accent); color: #000; box-shadow: 0 10px 25px rgba(226, 183, 20, 0.2); }
        .focus-btn.quiz-btn:hover { background: #fff; transform: translateY(-5px); box-shadow: 0 15px 35px rgba(226, 183, 20, 0.3); }
        .focus-btn.archive-btn { background: var(--glass); border-color: var(--border); color: var(--text); }
        .focus-btn.archive-btn:hover { background: rgba(255,255,255,0.1); }
        
        .pulse-animation { animation: pulse-glow 2s infinite; }
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 0 0 rgba(226, 183, 20, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(226, 183, 20, 0); }
          100% { box-shadow: 0 0 0 0 rgba(226, 183, 20, 0); }
        }
        @media (max-width: 768px) {
          .daily-focus-card { flex-direction: column; text-align: center; padding: 32px 24px !important; }
          .focus-btn { width: 100%; }
          .focus-desc { margin: 0 auto; }
        }
        .dash-level-word-item { padding: 12px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .dash-level-word-item:hover { background: rgba(255,255,255,0.05); }

        /* --- Glassmorphism Dashboard Tabs --- */
        .dash-tabs-nav { 
          display: flex !important; 
          gap: 12px !important; 
          margin: 0 20px 24px !important; 
          justify-content: center;
        }
        .dash-tab-btn { 
          flex: 1; 
          display: flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px !important; 
          border-radius: 16px !important; 
          font-size: 0.8rem !important; 
          font-weight: 600 !important; 
          text-decoration: none !important; 
          color: rgba(255, 255, 255, 0.4) !important;
          background: rgba(255, 255, 255, 0.02) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.06) !important;
          transition: all 0.2s ease;
        }
        .dash-tab-btn.active { 
          background: rgba(226, 183, 20, 0.1) !important; 
          color: var(--accent) !important; 
          border-color: rgba(226, 183, 20, 0.3) !important;
          font-weight: 800 !important;
        }
        .dash-tab-btn i { font-size: 0.9rem; opacity: 0.8; }

        @media (max-width: 640px) {
          .dash-bento-stats { 
            grid-template-columns: 1fr; 
            margin: 0 20px 24px;
          }
          .profile-header.minimal { padding: 20px 20px 0; }
          .dash-tabs-nav { gap: 10px !important; margin: 0 20px 24px !important; }
          .glass-card {
            margin: 0 20px 16px;
            padding: 20px !important;
            border-radius: 24px !important;
          }
        }
      `}</style>
    </div>
  );
}
