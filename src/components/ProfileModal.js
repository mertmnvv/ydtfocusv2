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

  const updatePhoto = async () => {
    const url = window.prompt("Yeni profil resmi URL'sini yapıştırın:");
    if (!url) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { photoURL: url });
      setProfile(prev => ({ ...prev, photoURL: url }));
      showNotification("Profil resmi güncellendi!", "success");
    } catch (err) {
      showNotification("Güncelleme başarısız.", "error");
    }
  };

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
              <div className={`p-modal-avatar ${(profile.role === 'premium' || profile.role === 'admin') ? 'premium-glow' : ''}`}>
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.displayName} className="p-modal-avatar-img" />
                ) : (
                  profile.displayName?.[0] || "?"
                )}
                {user.uid === userId && (
                  <button className="p-modal-avatar-edit" onClick={updatePhoto} title="Resmi Değiştir">
                    <i className="fa-solid fa-camera"></i>
                  </button>
                )}
              </div>
              <div className="p-modal-info">
                <div className="p-modal-title-group">
                  <h2 className="p-modal-name">{profile.displayName || "Gizli Kullanıcı"}</h2>
                  <div className="p-modal-badge">
                    {profile.role === "admin" ? (
                      <span className="badge-admin"><i className="fa-solid fa-user-shield"></i> Admin</span>
                    ) : profile.role === "premium" ? (
                      <span className="badge-premium"><i className="fa-solid fa-crown"></i> Premium</span>
                    ) : (
                      <span className="badge-standard">Standart</span>
                    )}
                  </div>
                </div>
                <div className="p-modal-streak">
                  <span className="p-modal-dot"></span>
                  {profile.publicStats?.streak || 0} Günlük Seri
                </div>
              </div>
            </div>

            <div className="p-modal-stats">
              <div className="p-m-stat">
                <div className="p-m-val">{profile.publicStats?.masteryCount || 0}</div>
                <div className="p-m-label">BİLİNEN KELİME</div>
              </div>
              <div className="p-m-stat">
                <div className="p-m-val">{profile.publicStats?.weeklyMinutes || 0}dk</div>
                <div className="p-m-label">HAFTALIK ÇALIŞMA</div>
              </div>
              <div className="p-m-stat">
                <div className="p-m-val">{profile.publicStats?.correct || 0}</div>
                <div className="p-m-label">TOPLAM DOĞRU</div>
              </div>
            </div>

            {user.uid !== userId && (
              <div className="p-modal-actions">
                <button className="p-modal-btn-primary" onClick={handleMessage}>
                  <i className="fa-solid fa-paper-plane"></i> Mesaj At
                </button>
                <button className="p-modal-btn-ghost" onClick={handleAddFriend}>
                  <i className="fa-solid fa-user-plus"></i> Arkadaş Ekle
                </button>
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
          background: var(--bg-card); backdrop-filter: blur(25px);
          border: 1px solid var(--border); border-radius: 32px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.3);
        }
        :global([data-theme='dark']) .p-modal-content {
          background: rgba(28, 28, 30, 0.8);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
        }
        .p-modal-close {
          position: absolute; top: 20px; right: 20px; background: var(--glass); 
          border: 1px solid var(--border); width: 36px; height: 36px; border-radius: 12px;
          color: var(--text-muted); font-size: 1.2rem; cursor: pointer; display: flex; 
          align-items: center; justify-content: center; transition: all 0.2s;
        }
        .p-modal-close:hover { background: var(--bg-elevated); color: var(--text); }
        .p-modal-loading { padding: 60px; display: flex; justify-content: center; }
        
        .p-modal-top { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; }
        .p-modal-avatar {
          width: 90px; height: 90px; border-radius: 28px; background: var(--bg-elevated);
          display: flex; align-items: center; justify-content: center; font-size: 2.8rem;
          font-weight: 900; color: var(--text); border: 1px solid var(--border);
          transition: all 0.3s; position: relative;
        }
        .p-modal-avatar.premium-glow {
          border-color: #ffd60a;
          box-shadow: 0 0 25px rgba(255, 214, 10, 0.25);
          background: linear-gradient(135deg, rgba(255, 214, 10, 0.15), var(--bg-elevated));
        }
        .p-modal-avatar-edit {
          position: absolute; bottom: -5px; right: -5px; width: 32px; height: 32px;
          border-radius: 50%; background: var(--accent); color: #000; border: 3px solid var(--bg-card);
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          font-size: 0.8rem; transition: all 0.2s;
        }
        .p-modal-avatar-edit:hover { transform: scale(1.1); }
        .p-modal-title-group { display: flex; flex-direction: column; gap: 4px; }
        .p-modal-name { font-size: 1.6rem; font-weight: 900; margin: 0; color: var(--text); letter-spacing: -0.5px; }
        .p-modal-badge { display: flex; margin-bottom: 4px; }
        .badge-premium { 
          background: rgba(255, 214, 10, 0.15); color: #ffd60a; padding: 4px 10px; 
          border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
          border: 1px solid rgba(255, 214, 10, 0.2); display: flex; align-items: center; gap: 5px;
        }
        .badge-admin {
          background: rgba(255, 69, 58, 0.15); color: #ff453a; padding: 4px 10px;
          border-radius: 8px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
          border: 1px solid rgba(255, 69, 58, 0.2); display: flex; align-items: center; gap: 5px;
        }
        .badge-standard {
          background: var(--glass); color: var(--text-muted); padding: 4px 10px;
          border-radius: 8px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          border: 1px solid var(--border);
        }
        .p-modal-streak { display: flex; align-items: center; gap: 8px; color: var(--accent); font-weight: 800; font-size: 0.9rem; }
        .p-modal-dot { width: 8px; height: 8px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 10px var(--accent); }
        
        .p-modal-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 32px; }
        .p-m-stat { background: var(--glass); border: 1px solid var(--border); border-radius: 20px; padding: 16px; text-align: center; }
        .p-m-val { font-size: 1.3rem; font-weight: 900; color: var(--text); margin-bottom: 2px; }
        .p-m-label { font-size: 0.6rem; color: var(--text-muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .p-modal-actions { display: flex; gap: 12px; }
        .p-modal-btn-primary, .p-modal-btn-ghost {
          flex: 1; padding: 14px; border-radius: 16px; font-weight: 800; font-size: 0.9rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
          transition: all 0.2s;
        }
        .p-modal-btn-primary { background: var(--accent); color: #000; border: none; }
        .p-modal-btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(226, 183, 20, 0.3); }
        .p-modal-btn-ghost { background: var(--glass); color: var(--text); border: 1px solid var(--border); }
        .p-modal-btn-ghost:hover { background: var(--bg-elevated); border-color: var(--accent-muted); }
        
        @keyframes popIn { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-popIn { animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
      `}</style>
    </div>
  );
}
