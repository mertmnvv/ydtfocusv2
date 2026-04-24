"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserStats, updateLastReminderDate } from "@/lib/firestore";
import Link from "next/link";
import CustomDialog from "@/components/CustomDialog";

export default function DashboardPage() {
  const { user, userProfile, isAdmin } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, studyTime: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState(null);
  const [showReminder, setShowReminder] = useState(false);

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
        setStats(s || { correct: 0, wrong: 0, streak: 0, studyTime: 0 });

        // Daily Reminder Logic
        const lastReminder = userProfile?.lastReminderDate;
        const today = new Date().toDateString();
        if (lastReminder !== today) {
          const dueCount = wordList.filter(w => (w.nextReview || 0) <= Date.now()).length;
          if (dueCount > 0) {
            setTimeout(() => {
              if (isMounted) setShowReminder(true);
            }, 1500);
            updateLastReminderDate(user.uid);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [user, userProfile]);

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  const total = words.length;
  const masteredCount = words.filter(w => w.level >= 4).length;
  const pct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  
  const levels = [
    { name: "Yeni", key: "level0", color: "#ff453a", desc: "Henüz öğrenilmeye başlanmadı" },
    { name: "Adım 1", key: "level1", color: "#ff9f0a", desc: "İlk tekrar yapıldı" },
    { name: "Adım 2", key: "level2", color: "#ffd60a", desc: "Hafızaya giriyor" },
    { name: "Adım 3", key: "level3", color: "#30d158", desc: "Pekişmeye başladı" },
    { name: "Hazine", key: "level4", color: "#0a84ff", desc: "Kalıcı hafızaya alındı" },
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

      <div className="dash-header">
        <h2 className="dash-title">Level Up</h2>
        <p className="dash-subtitle">Kişisel gelişim ve istatistiklerin.</p>
      </div>

      <div className="glass-card dash-goal-card">
        <div className="dash-goal-top">
          <span className="dash-goal-label">Öğrenme Oranı (Mastery)</span>
          <span className="dash-goal-numbers">{masteredCount} / {total} Kelime</span>
        </div>
        <div className="dash-goal-bar">
          <div className="dash-goal-fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
        </div>
        <div className="dash-goal-footer">
          <span className="dash-goal-pct">Kelimelerin %{pct} kadarı kalıcı hafızada</span>
        </div>
      </div>

      <div className="dash-bento-stats">
        <div className="dash-bento-card" style={{ background: "linear-gradient(135deg, rgba(48,209,88,0.1), transparent)", borderColor: "rgba(48,209,88,0.2)" }}>
          <div className="dash-bento-value" style={{ color: "var(--primary)" }}>{total}</div>
          <div className="dash-bento-label">Bankadaki Kelimeler</div>
        </div>
        <div className="dash-bento-card" style={{ background: "linear-gradient(135deg, rgba(255,159,10,0.1), transparent)", borderColor: "rgba(255,159,10,0.2)" }}>
          <div className="dash-bento-value" style={{ color: "#ff9f0a" }}>{stats.streak || 0}</div>
          <div className="dash-bento-label">Çalışma Serisi (Gün)</div>
        </div>
        <div className="dash-bento-card" style={{ gridColumn: "span 2", background: "linear-gradient(135deg, rgba(191,90,242,0.1), transparent)", borderColor: "rgba(191,90,242,0.2)" }}>
          <div className="dash-bento-value" style={{ color: "#bf5af2" }}>{stats.dailyMinutes || stats.studyTime || 0} dk</div>
          <div className="dash-bento-label">Aktif Çalışma Süresi</div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="dash-section-title">Kelime Seviyeleri</h3>
        <p className="hint-text" style={{ marginBottom: 16 }}>İçeriğini görmek için bir seviyeye tıklayın.</p>
        <div className="dash-levels">
          {levels.map(lv => {
            const count = levelWords[lv.key].length;
            const isExpanded = expandedLevel === lv.key;
            return (
              <div key={lv.key} className="dash-level-container">
                <div 
                  className="dash-level-row" 
                  onClick={() => setExpandedLevel(isExpanded ? null : lv.key)}
                  style={{ cursor: "pointer" }}
                >
                  <span className="dash-level-badge" style={{ background: `${lv.color}22`, color: lv.color }}>{lv.name}</span>
                  <div className="dash-level-bar-bg">
                    <div className="dash-level-bar-fill" style={{
                      width: `${(count / maxLevel) * 100}%`,
                      background: lv.color,
                    }}></div>
                  </div>
                  <span className="dash-level-count">{count}</span>
                  <span style={{ marginLeft: 8, fontSize: "0.8rem", color: "var(--text-muted)", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                </div>
                
                {isExpanded && (
                  <div className="dash-level-words">
                    {count === 0 ? (
                      <div className="dash-level-word-empty">Bu seviyede kelime yok.</div>
                    ) : (
                      levelWords[lv.key].map((w, i) => (
                        <div key={i} className="dash-level-word-item">
                          <b>{w.word}</b> <span style={{ color: "var(--text-muted)" }}>{w.meaning}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="dash-quick-actions">
        <Link href="/srs" className="dash-action-btn dash-action-primary">
          Tekrarı Başlat
        </Link>
        <Link href="/reading" className="dash-action-btn">
          Okuma Pratiği
        </Link>
      </div>

      {showReminder && (
        <CustomDialog
          title="Günlük Tekrar"
          message="Bugün tekrar etmeniz gereken kelimeler var. Hafızanızı tazelemek için akıllı tekrarı tamamlayın."
          confirmText="Başla"
          cancelText="Daha Sonra"
          onConfirm={() => {
            setShowReminder(false);
            window.location.href = "/srs";
          }}
          onCancel={() => setShowReminder(false)}
        />
      )}
    </div>
  );
}
