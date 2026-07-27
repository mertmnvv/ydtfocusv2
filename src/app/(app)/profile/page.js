"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FeedbackModal from "@/components/FeedbackModal";
import { subscribeToUserStats, subscribeToUserWords } from "@/lib/firestore";

export default function ProfilePage() {
  const { user, userProfile, logout, isAdmin, isPremium, requireAuth, setPremiumModalOpen } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [stats, setStats] = useState({});
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const unsubStats = subscribeToUserStats(user.uid, (s) => setStats(s || {}));
    const unsubWords = subscribeToUserWords(user.uid, (words) => setWordCount(words.length));
    return () => { unsubStats(); unsubWords(); };
  }, [user]);

  if (!user) {
    return (
      <div className="profile-page-empty">
        <h3>Profilini görmek için giriş yapmalısın</h3>
        <p className="hint-text">Hesap bilgilerin, planın ve ayarların burada listelenir.</p>
        <button onClick={() => requireAuth(() => {})} className="btn-primary">
          Giriş Yap / Kayıt Ol
        </button>
      </div>
    );
  }

  const planLabel = isAdmin ? "Yönetici" : isPremium ? "Elite Üye" : "Standart Üye";
  const badgeCount = userProfile?.badges?.length || 0;
  const streak = stats?.streak || 0;
  const dailyMinutes = stats?.dailyMinutes || 0;

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div className={`profile-page-avatar ${isPremium ? "premium-glow" : ""}`}>
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Profil" className="avatar-img" />
          ) : (
            userProfile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "?"
          )}
        </div>
        <div className="profile-page-info">
          <div className="profile-page-name">{userProfile?.displayName || user?.email?.split("@")[0] || "Kullanıcı"}</div>
          <div className="profile-page-plan">{planLabel}</div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="profile-stats-row">
        <div className="profile-stat-card">
          <div className="profile-stat-value profile-stat-fire">{streak}</div>
          <div className="profile-stat-label">Günlük Seri</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{badgeCount}</div>
          <div className="profile-stat-label">Rozet</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{wordCount}</div>
          <div className="profile-stat-label">Kelime</div>
        </div>
        <div className="profile-stat-card">
          <div className="profile-stat-value">{dailyMinutes}</div>
          <div className="profile-stat-label">Dk Bugün</div>
        </div>
      </div>

      <div className="profile-page-list">
        <a href="/achievements" className="profile-page-item">
          <span>Rozetlerim</span>
          <span className="profile-page-item-arrow">›</span>
        </a>
        <a href="/hero" className="profile-page-item">
          <span>Zero to Hero</span>
          <span className="profile-page-item-arrow">›</span>
        </a>
        <button className="profile-page-item" onClick={() => setShowFeedback(true)}>
          <span>Geri Bildirim</span>
          <span className="profile-page-item-arrow">›</span>
        </button>
        {!isPremium && (
          <button className="profile-page-item" onClick={() => setPremiumModalOpen(true)}>
            <span>Elite&apos;e Geç</span>
            <span className="profile-page-item-arrow">›</span>
          </button>
        )}
        {isAdmin && (
          <a href="/admin" className="profile-page-item">
            <span>Yönetici Paneli</span>
            <span className="profile-page-item-arrow">›</span>
          </a>
        )}
      </div>

      <button className="profile-page-logout" onClick={logout}>
        Çıkış Yap
      </button>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  );
}
