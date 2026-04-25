"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendFriendRequest, getOrCreateChat } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

export default function ProfileModal({ userId, onClose }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchProfile = async () => {
      setLoading(true);
      const docRef = doc(db, "users", userId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setProfile(snap.data());
      }
      setLoading(false);
    };
    fetchProfile();
  }, [userId]);

  const handleAddFriend = async () => {
    try {
      await sendFriendRequest(user.uid, userId);
      showNotification("Arkadaşlık isteği gönderildi!", "success");
    } catch (err) {
      showNotification("İstek gönderilemedi.", "error");
    }
  };

  const handleMessage = async () => {
    try {
      const chatId = await getOrCreateChat(user.uid, userId);
      showNotification("Sohbet merkezine gidiliyor...", "success");
      onClose(); // Modalı kapat
      // Buradan ChatHub'ı tetiklemek için bir event veya global state kullanılabilir
      window.dispatchEvent(new CustomEvent("focus-open-chat", { detail: { chatId } }));
    } catch (err) {
      showNotification("Sohbet başlatılamadı.", "error");
    }
  };

  if (!userId) return null;

  return (
    <div className="p-modal-overlay" onClick={onClose}>
      <div className="p-modal-content glass-card animate-popIn" onClick={e => e.stopPropagation()}>
        <button className="p-modal-close" onClick={onClose}>×</button>
        
        {loading ? (
          <div className="p-modal-loading"><div className="spinner-ring"></div></div>
        ) : profile ? (
          <div className="p-modal-body">
            <div className="p-modal-top">
              <div className="p-modal-avatar">
                {profile.displayName?.[0] || "?"}
              </div>
              <div className="p-modal-info">
                <h2 className="p-modal-name">{profile.displayName || "Gizli Kullanıcı"}</h2>
                <div className="p-modal-streak">
                  <span className="p-modal-dot"></span>
                  {profile.publicStats?.streak || 0} Günlük Seri
                </div>
              </div>
            </div>

            <div className="p-modal-stats">
              <div className="p-m-stat">
                <div className="p-m-val">{profile.publicStats?.masteryCount || 0}</div>
                <div className="p-m-label">Bilinen Kelime</div>
              </div>
              <div className="p-m-stat">
                <div className="p-m-val">{profile.publicStats?.weeklyMinutes || 0}dk</div>
                <div className="p-m-label">Haftalık Çalışma</div>
              </div>
              <div className="p-m-stat">
                <div className="p-m-val">{profile.publicStats?.correct || 0}</div>
                <div className="p-m-label">Toplam Doğru</div>
              </div>
            </div>

            {user.uid !== userId && (
              <div className="p-modal-actions">
                <button className="btn-primary" style={{ flex: 1 }} onClick={handleMessage}>Mesaj At</button>
                <button className="btn-ghost" style={{ flex: 1 }} onClick={handleAddFriend}>Arkadaş Ekle</button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-modal-error">Kullanıcı yüklenemedi.</div>
        )}
      </div>

      <style jsx>{`
        .p-modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 20000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
          backdrop-filter: blur(8px);
        }
        .p-modal-content {
          width: 100%; max-width: 440px; padding: 32px; position: relative;
          background: var(--bg-card); border-color: var(--accent-muted);
        }
        .p-modal-close {
          position: absolute; top: 16px; right: 16px; background: none; border: none;
          color: var(--text-muted); font-size: 2rem; cursor: pointer; line-height: 1;
        }
        .p-modal-loading { padding: 60px; display: flex; justify-content: center; }
        
        .p-modal-top { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; }
        .p-modal-avatar {
          width: 80px; height: 80px; border-radius: 24px; background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center; font-size: 2.5rem;
          font-weight: 900; color: var(--accent); border: 2px solid var(--accent);
          box-shadow: 0 10px 20px rgba(226, 183, 20, 0.1);
        }
        .p-modal-name { font-size: 1.5rem; font-weight: 900; margin-bottom: 4px; color: var(--text); }
        .p-modal-streak { display: flex; align-items: center; gap: 8px; color: var(--accent); font-weight: 700; font-size: 0.85rem; }
        .p-modal-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }
        
        .p-modal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
        .p-m-stat { background: var(--glass); border: 1px solid var(--border); border-radius: 16px; padding: 16px; text-align: center; }
        .p-m-val { font-size: 1.2rem; font-weight: 900; color: var(--primary); margin-bottom: 2px; }
        .p-m-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; }
        
        .p-modal-actions { display: flex; gap: 12px; }
        
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-popIn { animation: popIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      `}</style>
    </div>
  );
}
