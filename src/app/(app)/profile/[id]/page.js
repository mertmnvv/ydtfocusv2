"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function UserProfilePage() {
  const { id } = useParams();
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

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;
  if (!profile) return <div className="page-error">Kullanıcı bulunamadı.</div>;

  const stats = profile.publicStats || {};

  return (
    <div className="profile-view-page">
      <div className="profile-view-header">
        <div className="profile-view-avatar">{profile.displayName?.[0] || "?"}</div>
        <div>
          <h1 className="profile-view-name">{profile.displayName || "Gizli Kullanıcı"}</h1>
          <div className="profile-view-streak">{stats.streak || 0} günlük seri</div>
        </div>
      </div>

      <div className="profile-view-stats">
        <div className="profile-view-stat">
          <div className="profile-view-stat-val">{stats.masteryCount || 0}</div>
          <div className="profile-view-stat-label">Bilinen Kelime</div>
        </div>
        <div className="profile-view-stat">
          <div className="profile-view-stat-val">{stats.weeklyMinutes || 0}dk</div>
          <div className="profile-view-stat-label">Haftalık Çalışma</div>
        </div>
        <div className="profile-view-stat">
          <div className="profile-view-stat-val">{stats.correct || 0}</div>
          <div className="profile-view-stat-label">Toplam Doğru</div>
        </div>
      </div>

      <style jsx>{`
        .profile-view-page { max-width: 480px; margin: 0 auto; padding: 40px 20px; }
        .profile-view-header { display: flex; align-items: center; gap: 20px; margin-bottom: 32px; }
        .profile-view-avatar {
          width: 72px; height: 72px; border-radius: 20px; background: var(--bg-elevated);
          border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem; font-weight: 800; color: var(--accent); flex-shrink: 0;
        }
        .profile-view-name { font-size: 1.4rem; font-weight: 800; color: var(--text); }
        .profile-view-streak { color: var(--accent); font-weight: 700; font-size: 0.85rem; margin-top: 4px; }
        .profile-view-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .profile-view-stat { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 18px 10px; text-align: center; }
        .profile-view-stat-val { font-size: 1.3rem; font-weight: 900; color: var(--text); margin-bottom: 2px; }
        .profile-view-stat-label { font-size: 0.68rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase; }
        @media (max-width: 480px) {
          .profile-view-header { flex-direction: column; text-align: center; }
        }
      `}</style>
    </div>
  );
}
