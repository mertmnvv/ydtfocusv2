"use client";

import { useState, useEffect } from "react";
import { getAllUsers, updateUserRole, deleteUserDoc } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";

export default function AdminUsersPage() {
  const { showNotification } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [roleConfirm, setRoleConfirm] = useState(null); // { uid, currentRole }
  const [userToDelete, setUserToDelete] = useState(null); // { uid, name }

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

  async function handleRoleUpdate(uid, newRole) {
    try {
      await updateUserRole(uid, newRole);
      setUsers(prev => prev.map(u => u.uid === uid || u.id === uid ? { ...u, role: newRole } : u));
      showNotification(`Kullanıcı rolü ${newRole} olarak güncellendi`, "success");
    } catch (err) {
      showNotification("Rol güncellenirken hata oluştu.", "error");
    }
  }
  
  async function handleDeleteUser() {
    if (!userToDelete) return;
    try {
      await deleteUserDoc(userToDelete.uid);
      setUsers(prev => prev.filter(u => u.uid !== userToDelete.uid && u.id !== userToDelete.uid));
      showNotification(`${userToDelete.name} silindi`, "success");
    } catch (err) {
      showNotification("Kullanıcı silinirken hata oluştu.", "error");
    }
    setUserToDelete(null);
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
          <h3 className="section-title" style={{ marginBottom: 0 }}>Kullanıcı Yönetimi</h3>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "var(--accent)", fontWeight: 800, fontSize: "1.2rem" }}>{users.length}</div>
            <div style={{ color: "var(--text-muted)", fontSize: "0.7rem", textTransform: "uppercase" }}>Kullanıcı</div>
          </div>
        </div>

        <div style={{ marginTop: 20, marginBottom: 20 }}>
          <input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="word-input"
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Aktivite</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.uid || u.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: 700 }}>{u.displayName || "İsimsiz"}</span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.role === "admin" ? "admin-badge-admin" : u.role === "premium" ? "admin-badge-premium" : "admin-badge-user"}`}>
                      {u.role || "free"}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: 2 }}>
                      <span title="Kayıt"><i className="fa-regular fa-calendar" style={{ marginRight: 5 }}></i> {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString("tr-TR") : "-"}</span>
                      <span title="Son Giriş" style={{ color: "var(--accent)" }}><i className="fa-solid fa-clock-rotate-left" style={{ marginRight: 5 }}></i> {u.lastLogin?.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleString("tr-TR") : "-"}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <select 
                        className="admin-select-sm"
                        value={u.role || "free"}
                        onChange={(e) => handleRoleUpdate(u.uid || u.id, e.target.value)}
                      >
                        <option value="free">Standart</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button 
                        className="admin-delete-btn"
                        onClick={() => setUserToDelete({ uid: u.uid || u.id, name: u.displayName || u.email })}
                        title="Kullanıcıyı Sil"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {userToDelete && (
        <CustomDialog
          title="Kullanıcıyı Sil"
          message={`"${userToDelete.name}" isimli kullanıcıyı veritabanından silmek istediğine emin misin? Bu işlem geri alınamaz.`}
          confirmText="Evet, Sil"
          confirmColor="#ff453a"
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      )}
      
      <style jsx>{`
        .admin-select-sm {
          background: #1a1a1b;
          border: 1px solid var(--border);
          color: #fff;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          font-weight: 600;
          transition: 0.2s;
        }
        .admin-select-sm:hover { border-color: var(--accent); }
        .admin-select-sm option {
          background: #1a1a1b;
          color: #fff;
          padding: 10px;
        }
        .admin-badge-premium { background: rgba(226, 183, 20, 0.2); color: var(--accent); }
        .admin-delete-btn {
          background: rgba(255, 69, 58, 0.1);
          border: 1px solid rgba(255, 69, 58, 0.2);
          color: #ff453a;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .admin-delete-btn:hover {
          background: #ff453a;
          color: #fff;
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
