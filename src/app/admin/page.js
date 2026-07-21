"use client";

import { useState, useEffect } from "react";
import { getAllUsers } from "@/lib/firestore";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    freeUsers: 0,
    archive: 0,
    phrasal: 0,
    grammar: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const users = await getAllUsers();
        const premiumCount = users.filter(u => u.role === "premium").length;
        const adminCount = users.filter(u => u.role === "admin").length;

        const archiveSnap = await getCountFromServer(collection(db, "archive"));
        const pvSnap = await getCountFromServer(collection(db, "phrasalVerbs"));
        const grammarSnap = await getCountFromServer(collection(db, "grammarTopics"));

        setStats({
          totalUsers: users.length,
          premiumUsers: premiumCount + adminCount,
          freeUsers: users.length - (premiumCount + adminCount),
          archive: archiveSnap.data().count,
          phrasal: pvSnap.data().count,
          grammar: grammarSnap.data().count
        });

        setRecentUsers(users.sort((a, b) => (b.lastLogin?.seconds || 0) - (a.lastLogin?.seconds || 0)).slice(0, 8));
      } catch (err) {
        console.error("Admin stats error:", err);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Veriler hazırlanıyor...</p></div>;
  }

  return (
    <div className="admin-overview">
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.totalUsers}</div>
          <div className="admin-stat-label">Toplam Kullanıcı</div>
          <div className="admin-stat-sub">{stats.premiumUsers} premium · {stats.freeUsers} standart</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.archive}</div>
          <div className="admin-stat-label">Sözlük Kelimesi</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.phrasal}</div>
          <div className="admin-stat-label">Phrasal Verbs</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-num">{stats.grammar}</div>
          <div className="admin-stat-label">Gramer Konusu</div>
        </div>
      </div>

      <div className="glass-card">
        <h3 className="section-title">Son Giriş Yapanlar</h3>
        <div className="admin-table-scroll">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Son Görülme</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.uid || u.id}>
                  <td className="admin-cell-strong">{u.displayName || "İsimsiz"}</td>
                  <td className="admin-cell-muted">{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.role === "admin" ? "admin-badge-admin" : u.role === "premium" ? "admin-badge-premium" : "admin-badge-user"}`}>
                      {u.role || "free"}
                    </span>
                  </td>
                  <td className="admin-cell-accent">
                    {u.lastLogin?.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleString("tr-TR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .admin-overview { display: flex; flex-direction: column; gap: 24px; }
        .admin-table-scroll { overflow-x: auto; }
        .admin-stat-sub { margin-top: 8px; font-size: 0.78rem; color: var(--accent); font-weight: 600; }
        .admin-cell-strong { font-weight: 700; }
        .admin-cell-muted { color: var(--text-muted); font-size: 0.9rem; }
        .admin-cell-accent { color: var(--accent); font-size: 0.85rem; font-weight: 600; }
        .admin-badge-premium { background: rgba(226, 183, 20, 0.15); color: var(--accent); }
      `}</style>
    </div>
  );
}
