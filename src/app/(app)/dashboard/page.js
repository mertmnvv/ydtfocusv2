"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserWords, getUserStats } from "@/lib/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0, studyTime: 0 });
  const [loading, setLoading] = useState(true);
  const [expandedLevel, setExpandedLevel] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    Promise.all([
      getUserWords(user.uid),
      getUserStats(user.uid),
    ]).then(([w, s]) => {
      setWords(w || []);
      setStats(s || { correct: 0, wrong: 0, streak: 0, studyTime: 0 });
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  const total = words.length;
  const goal = 2000;
  const pct = Math.round((total / goal) * 100);
  const successRate = stats.correct + stats.wrong > 0
    ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100)
    : 0;

  const levels = [
    { name: "Tanışma", key: "new", color: "#ff453a" },
    { name: "Tekrar", key: "day1", color: "#ff9f0a" },
    { name: "Pekişme", key: "learning", color: "#ffd60a" },
    { name: "Kalıcı", key: "familiar", color: "#30d158" },
    { name: "Hazine", key: "master", color: "#0a84ff" },
  ];

  const levelWords = {
    new: words.filter(w => !w.level || w.level === 0),
    day1: words.filter(w => w.level === 1),
    learning: words.filter(w => w.level === 2),
    familiar: words.filter(w => w.level === 3),
    master: words.filter(w => w.level >= 4),
  };

  const maxLevel = Math.max(...Object.values(levelWords).map(arr => arr.length), 1);

  return (
    <div className="dashboard-page">
      {/* Başlık */}
      <div className="dash-header">
        <h2 className="dash-title">Level Up</h2>
        <p className="dash-subtitle">Kelime hedefine ne kadar yakınsın?</p>
      </div>

      {/* Ana Hedef */}
      <div className="glass-card dash-goal-card">
        <div className="dash-goal-top">
          <span className="dash-goal-label">YDT Kelime Hedefi</span>
          <span className="dash-goal-numbers">{total} / {goal}</span>
        </div>
        <div className="dash-goal-bar">
          <div className="dash-goal-fill" style={{ width: `${Math.min(pct, 100)}%` }}></div>
        </div>
        <span className="dash-goal-pct">%{pct}</span>
      </div>

      {/* Stat Kartları (Bento Grid) */}
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

      {/* Seviye Barları (Akordeon) */}
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

      {/* Hızlı Erişim */}
      <div className="dash-quick-actions">
        <Link href="/quiz" className="dash-action-btn dash-action-primary">
          Akıllı Tekrarı Başlat
        </Link>
        <Link href="/reading" className="dash-action-btn">
          Metin Oku
        </Link>
      </div>

    </div>
  );
}
