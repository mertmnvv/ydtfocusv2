"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendFriendRequest, getOrCreateChat } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

export default function UserProfilePage() {
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const { showNotification } = useNotification();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const docRef = doc(db, "users", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, [id]);

  const handleAddFriend = async () => {
    try {
      await sendFriendRequest(user.uid, id);
      showNotification("Arkadaşlık isteği gönderildi!", "success");
    } catch (err) {
      showNotification("İstek gönderilemedi.", "error");
    }
  };

  const handleMessage = async () => {
    try {
      const chatId = await getOrCreateChat(user.uid, id);
      // Mesajlar kutusunu açmak için bir state tetiklenebilir veya sayfaya gidilebilir
      showNotification("Sohbet başlatıldı!", "success");
      router.push(`/messages?chat=${chatId}`);
    } catch (err) {
      showNotification("Sohbet başlatılamadı.", "error");
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;
  if (!profile) return <div className="page-error">Kullanıcı bulunamadı.</div>;

  const stats = profile.publicStats || {};

  return (
    <div className="profile-view-container">
      <div className="glass-card profile-main-card">
        <div className="profile-top">
          <div className="profile-avatar-large">
            {profile.displayName?.[0] || "?"}
          </div>
          <div className="profile-primary-info">
            <h1 className="profile-name">{profile.displayName || "Gizli Kullanıcı"}</h1>
            <div className="profile-status">
              <span className="status-dot"></span>
              {stats.streak || 0} Günlük Seri
            </div>
          </div>
          {user.uid !== id && (
            <div className="profile-actions">
              <button className="btn-primary" onClick={handleMessage}>Mesaj At</button>
              <button className="btn-ghost" onClick={handleAddFriend}>Arkadaş Ekle</button>
            </div>
          )}
        </div>

        <div className="profile-stats-grid">
          <div className="p-stat-card">
            <div className="p-stat-val">{stats.masteryCount || 0}</div>
            <div className="p-stat-label">Bilinen Kelime</div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-val">{stats.weeklyMinutes || 0}dk</div>
            <div className="p-stat-label">Haftalık Çalışma</div>
          </div>
          <div className="p-stat-card">
            <div className="p-stat-val">{stats.correct || 0}</div>
            <div className="p-stat-label">Toplam Doğru</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .profile-view-container { max-width: 700px; margin: 40px auto; padding: 0 20px; }
        .profile-main-card { padding: 40px; }
        .profile-top { display: flex; align-items: center; gap: 32px; margin-bottom: 40px; }
        .profile-avatar-large {
          width: 100px; height: 100px; border-radius: 30px; background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 900;
          border: 2px solid var(--accent); color: var(--accent);
          box-shadow: 0 10px 25px rgba(226, 183, 20, 0.15);
        }
        .profile-primary-info { flex: 1; }
        .profile-name { font-size: 2rem; font-weight: 900; margin-bottom: 8px; color: var(--text); }
        .profile-status { display: flex; align-items: center; gap: 8px; color: var(--accent); font-weight: 700; font-size: 0.9rem; }
        .status-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }
        .profile-actions { display: flex; flex-direction: column; gap: 12px; }
        .profile-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .p-stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; padding: 24px; text-align: center; box-shadow: 0 8px 20px rgba(0,0,0,0.05); }
        .p-stat-val { font-size: 1.5rem; font-weight: 900; color: var(--primary); margin-bottom: 4px; }
        .p-stat-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        @media (max-width: 600px) {
          .profile-top { flex-direction: column; text-align: center; }
          .profile-actions { width: 100%; }
          .profile-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
