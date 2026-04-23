"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "@/lib/firestore";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data.sort((a, b) => (b.lastLogin?.seconds || 0) - (a.lastLogin?.seconds || 0)));
    } catch (err) {
      console.error("Kullanıcı listesi hatası:", err);
    }
    setLoading(false);
  }

  async function toggleRole(uid, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(`Bu kullanıcıyı ${newRole} yapmak istediğinize emin misiniz?`)) return;
    try {
      await updateUserRole(uid, newRole);
      setUsers(prev => prev.map(u => u.uid === uid || u.id === uid ? { ...u, role: newRole } : u));
    } catch (err) {
      alert("Rol güncellenirken hata oluştu.");
    }
  }

  const filteredUsers = filter
    ? users.filter(u =>
        (u.displayName || "").toLowerCase().includes(filter.toLowerCase()) ||
        (u.email || "").toLowerCase().includes(filter.toLowerCase())
      )
    : users;

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Kullanıcılar yükleniyor...</p></div>;
  }

  return (
    <div>
      <div className="glass-card">
        <div className="header-split">
          <h3 className="section-title" style={{ marginBottom: 0 }}>👥 Kullanıcı Yönetimi</h3>
          <span style={{ color: "var(--text-muted)", fontSize: "0.9rem", fontWeight: 600 }}>
            {users.length} kullanıcı
          </span>
        </div>

        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "12px 16px",
              color: "var(--text)",
              width: "100%",
              fontSize: "0.95rem",
              fontFamily: "var(--font)",
              outline: "none",
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>İsim</th>
                <th>E-posta</th>
                <th>Rol</th>
                <th>Kayıt Tarihi</th>
                <th>Son Giriş</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.uid || u.id}>
                  <td style={{ fontWeight: 600 }}>{u.displayName || "-"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{u.email}</td>
                  <td>
                    <span className={`admin-badge ${u.role === "admin" ? "admin-badge-admin" : "admin-badge-user"}`}>
                      {u.role || "user"}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {u.createdAt?.seconds
                      ? new Date(u.createdAt.seconds * 1000).toLocaleDateString("tr-TR")
                      : "-"
                    }
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {u.lastLogin?.seconds
                      ? new Date(u.lastLogin.seconds * 1000).toLocaleString("tr-TR")
                      : "-"
                    }
                  </td>
                  <td>
                    <button
                      className={u.role === "admin" ? "admin-btn admin-btn-danger" : "admin-btn"}
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => toggleRole(u.uid || u.id, u.role)}
                    >
                      {u.role === "admin" ? "Admin'i Kaldır" : "Admin Yap"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
