"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

export default function AdminUsersPage() {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [roleConfirm, setRoleConfirm] = useState(null); // { uid, currentRole }

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data.sort((a, b) => (b.lastLogin?.seconds || 0) - (a.lastLogin?.seconds || 0)));
    } catch (err) {
      showNotification("Kullanıcı listesi yüklenemedi", "error");
    }
    setLoading(false);
  }

  async function handleRoleUpdate() {
    if (!roleConfirm) return;
    const { uid, currentRole } = roleConfirm;
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await updateUserRole(uid, newRole);
      setUsers(prev => prev.map(u => u.uid === uid || u.id === uid ? { ...u, role: newRole } : u));
      showNotification(`Kullanıcı rolü ${newRole} olarak güncellendi`, "success");
    } catch (err) {
      showNotification("Rol güncellenirken hata oluştu.", "error");
    } finally {
      setRoleConfirm(null);
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
                      onClick={() => setRoleConfirm({ uid: u.uid || u.id, currentRole: u.role })}
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

      {roleConfirm && (
        <CustomDialog
          title="Rolü Güncelle"
          message={`Bu kullanıcının rolünü ${roleConfirm.currentRole === "admin" ? "Standart Kullanıcı" : "Admin"} olarak değiştirmek istediğinize emin misiniz?`}
          onConfirm={handleRoleUpdate}
          onCancel={() => setRoleConfirm(null)}
        />
      )}
    </div>
  );
}
