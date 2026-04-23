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

  useEffect(() => {
    if (!user) return;
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

  // Spaced repetition seviyeleri
  const levels = [
    { name: "Tanışma", key: "new", color: "#ff453a" },
    { name: "Tekrar", key: "day1", color: "#ff9f0a" },
    { name: "Pekişme", key: "learning", color: "#ffd60a" },
    { name: "Kalıcı", key: "familiar", color: "#30d158" },
    { name: "Hazine", key: "master", color: "#0a84ff" },
  ];

  const levelCounts = {
    new: words.filter(w => !w.nextReview).length,
    day1: words.filter(w => w.level === 1).length,
    learning: words.filter(w => w.level === 2).length,
    familiar: words.filter(w => w.level === 3).length,
    master: words.filter(w => w.level >= 4).length,
  };

  const maxLevel = Math.max(...Object.values(levelCounts), 1);

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

      {/* Stat Kartları */}
      <div className="dash-stats-grid">
        <div className="dash-stat-card">
          <div className="dash-stat-value">{total}</div>
          <div className="dash-stat-label">Banka</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value">{stats.correct}</div>
          <div className="dash-stat-label">Doğru</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value">{stats.wrong}</div>
          <div className="dash-stat-label">Yanlış</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: "var(--accent)" }}>%{successRate}</div>
          <div className="dash-stat-label">Başarı</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: "#ff9f0a" }}>{stats.streak || 0}</div>
          <div className="dash-stat-label">Seri</div>
        </div>
        <div className="dash-stat-card">
          <div className="dash-stat-value" style={{ color: "#bf5af2" }}>{stats.dailyMinutes || stats.studyTime || 0} dk</div>
          <div className="dash-stat-label">Çalışma</div>
        </div>
      </div>

      {/* Seviye Barları */}
      <div className="glass-card">
        <h3 className="dash-section-title">Kelime Seviyeleri</h3>
        <div className="dash-levels">
          {levels.map(lv => (
            <div key={lv.key} className="dash-level-row">
              <span className="dash-level-badge" style={{ background: `${lv.color}22`, color: lv.color }}>{lv.name}</span>
              <div className="dash-level-bar-bg">
                <div className="dash-level-bar-fill" style={{
                  width: `${(levelCounts[lv.key] / maxLevel) * 100}%`,
                  background: lv.color,
                }}></div>
              </div>
              <span className="dash-level-count">{levelCounts[lv.key]}</span>
            </div>
          ))}
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
        <Link href="/linefocus" className="dash-action-btn">
          Linefocus
        </Link>
      </div>
    </div>
  );
}
