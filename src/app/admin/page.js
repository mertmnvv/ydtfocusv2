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
    <div className="admin-dashboard-view">
      {/* Üst İstatistikler */}
      <div className="admin-bento-grid">
        <div className="admin-bento-item main-stat">
          <div className="bento-icon"><i className="fa-solid fa-users"></i></div>
          <div className="bento-val">{stats.totalUsers}</div>
          <div className="bento-label">Toplam Kullanıcı</div>
          <div className="bento-substats">
            <span>{stats.premiumUsers} Premium</span>
            <span>{stats.freeUsers} Standart</span>
          </div>
        </div>
        
        <div className="admin-bento-item archive-stat">
          <div className="bento-icon"><i className="fa-solid fa-book-bookmark"></i></div>
          <div className="bento-val">{stats.archive}</div>
          <div className="bento-label">Sözlük Kelimesi</div>
        </div>

        <div className="admin-bento-item pv-stat">
          <div className="bento-icon"><i className="fa-solid fa-bolt"></i></div>
          <div className="bento-val">{stats.phrasal}</div>
          <div className="bento-label">Phrasal Verbs</div>
        </div>

        <div className="admin-bento-item grammar-stat">
          <div className="bento-icon"><i className="fa-solid fa-graduation-cap"></i></div>
          <div className="bento-val">{stats.grammar}</div>
          <div className="bento-label">Gramer Konusu</div>
        </div>
      </div>

      <div style={{ marginTop: 30 }} className="glass-card">
        <h3 className="section-title">Son Giriş Yapanlar</h3>
        <div style={{ overflowX: "auto" }}>
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
                  <td style={{ fontWeight: 700 }}>{u.displayName || "İsimsiz"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.role === "admin" ? "admin-badge-admin" : u.role === "premium" ? "admin-badge-premium" : "admin-badge-user"}`}>
                      {u.role || "free"}
                    </span>
                  </td>
                  <td style={{ color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600 }}>
                    {u.lastLogin?.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleString("tr-TR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .admin-bento-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .admin-bento-item { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 25px; border-radius: 20px; position: relative; overflow: hidden; transition: 0.3s; }
        .admin-bento-item:hover { border-color: var(--accent); background: rgba(255,255,255,0.05); }
        .main-stat { grid-column: span 2; background: linear-gradient(135deg, rgba(226, 183, 20, 0.1), transparent); }
        .bento-icon { font-size: 1.5rem; color: var(--accent); margin-bottom: 15px; opacity: 0.6; }
        .bento-val { font-size: 2.5rem; font-weight: 900; line-height: 1; margin-bottom: 5px; }
        .bento-label { color: var(--text-muted); font-weight: 700; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
        .bento-substats { margin-top: 15px; display: flex; gap: 15px; font-size: 0.85rem; font-weight: 600; }
        .bento-substats span:first-child { color: var(--accent); }
        .admin-badge-premium { background: rgba(226, 183, 20, 0.2); color: var(--accent); }
        @media (max-width: 900px) { .admin-bento-grid { grid-template-columns: repeat(2, 1fr); } }
      `}</style>
    </div>
  );
}
