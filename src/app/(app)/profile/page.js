"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import FeedbackModal from "@/components/FeedbackModal";

export default function ProfilePage() {
  const { user, userProfile, logout, isAdmin, isPremium, requireAuth, setPremiumModalOpen } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);

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

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div className={`profile-page-avatar ${isPremium ? "premium-glow" : ""}`}>
          {userProfile?.photoURL ? (
            <img src={userProfile.photoURL} alt="Profil" className="avatar-img" />
          ) : (
            userProfile?.displayName?.[0] || user?.email?.[0] || "U"
          )}
        </div>
        <div className="profile-page-info">
          <div className="profile-page-name">{userProfile?.displayName || "Misafir"}</div>
          <div className="profile-page-plan">{planLabel}</div>
        </div>
      </div>

      <div className="profile-page-list">
        <a href="/dashboard?tab=leaderboard" className="profile-page-item">
          <span>Rozetlerim</span>
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
