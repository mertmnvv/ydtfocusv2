"use client";

import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/firestore";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [archiveCount, setArchiveCount] = useState(0);
  const [phrasalCount, setPhrasalCount] = useState(0);
  const [grammarCount, setGrammarCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        // Kullanıcı listesi
        const users = await getAllUsers();
        setUserCount(users.length);
        setRecentUsers(users.sort((a, b) => {
          const aTime = a.lastLogin?.seconds || 0;
          const bTime = b.lastLogin?.seconds || 0;
          return bTime - aTime;
        }).slice(0, 5));

        // Koleksiyon sayıları
        try {
          const archiveSnap = await getCountFromServer(collection(db, "archive"));
          setArchiveCount(archiveSnap.data().count);
        } catch { setArchiveCount(0); }

        try {
          const pvSnap = await getCountFromServer(collection(db, "phrasalVerbs"));
          setPhrasalCount(pvSnap.data().count);
        } catch { setPhrasalCount(0); }

        try {
          const grammarSnap = await getCountFromServer(collection(db, "grammarTopics"));
          setGrammarCount(grammarSnap.data().count);
        } catch { setGrammarCount(0); }

      } catch (err) {
        console.error("Admin stats yükleme hatası:", err);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Yükleniyor...</p></div>;
  }

  return (
    <div>
      {/* İstatistik Kartları */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{userCount}</div>
          <div className="admin-stat-label">Toplam Kullanıcı</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{archiveCount}</div>
          <div className="admin-stat-label">Arşiv Kelimesi</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{phrasalCount}</div>
          <div className="admin-stat-label">Phrasal Verb</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{grammarCount}</div>
          <div className="admin-stat-label">Gramer Konusu</div>
        </div>
      </div>

      {/* Son Aktif Kullanıcılar */}
      <div className="glass-card">
        <h3 className="section-title">Son Aktif Kullanıcılar</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>İsim</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Son Giriş</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map(u => (
              <tr key={u.uid || u.id}>
                <td>{u.displayName || "-"}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`admin-badge ${u.role === "admin" ? "admin-badge-admin" : "admin-badge-user"}`}>
                    {u.role || "user"}
                  </span>
                </td>
                <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  {u.lastLogin?.seconds
                    ? new Date(u.lastLogin.seconds * 1000).toLocaleString("tr-TR")
                    : "-"
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
