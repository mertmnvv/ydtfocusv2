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
    <div className="admin-users-view">
      <div className="glass-card">
        <div className="au-header">
          <h3 className="section-title">Kullanıcı Yönetimi</h3>
          <div className="au-count">
            <div className="au-count-num">{users.length}</div>
            <div className="au-count-label">Kullanıcı</div>
          </div>
        </div>

        <div className="au-search-wrap">
          <input
            type="text"
            placeholder="İsim veya e-posta ile ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="word-input au-search-input"
          />
        </div>

        <div className="admin-table-scroll">
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
                    <div className="au-user-cell">
                      <span className="au-user-name">{u.displayName || "İsimsiz"}</span>
                      <span className="au-user-email">{u.email}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`admin-badge ${u.role === "admin" ? "admin-badge-admin" : u.role === "premium" ? "admin-badge-premium" : "admin-badge-user"}`}>
                      {u.role || "free"}
                    </span>
                  </td>
                  <td>
                    <div className="au-activity">
                      <span title="Kayıt"><i className="fa-regular fa-calendar"></i> {u.createdAt?.seconds ? new Date(u.createdAt.seconds * 1000).toLocaleDateString("tr-TR") : "-"}</span>
                      <span className="au-activity-recent" title="Son Giriş"><i className="fa-solid fa-clock-rotate-left"></i> {u.lastLogin?.seconds ? new Date(u.lastLogin.seconds * 1000).toLocaleString("tr-TR") : "-"}</span>
                    </div>
                  </td>
                  <td>
                    <div className="au-actions">
                      <select
                        className="au-role-select"
                        value={u.role || "free"}
                        onChange={(e) => handleRoleUpdate(u.uid || u.id, e.target.value)}
                      >
                        <option value="free">Standart</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        className="au-delete-btn"
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
          confirmColor="var(--error)"
          onConfirm={handleDeleteUser}
          onCancel={() => setUserToDelete(null)}
        />
      )}

      <style jsx>{`
        .au-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .au-count { text-align: right; }
        .au-count-num { color: var(--accent); font-weight: 800; font-size: 1.2rem; }
        .au-count-label { color: var(--text-muted); font-size: 0.7rem; text-transform: uppercase; }

        .au-search-wrap { margin: 20px 0; }
        .au-search-input { width: 100%; }

        .admin-table-scroll { overflow-x: auto; }

        .au-user-cell { display: flex; flex-direction: column; }
        .au-user-name { font-weight: 700; color: var(--text); }
        .au-user-email { color: var(--text-muted); font-size: 0.8rem; }

        .au-activity { font-size: 0.75rem; display: flex; flex-direction: column; gap: 2px; }
        .au-activity i { margin-right: 5px; }
        .au-activity-recent { color: var(--accent); }

        .au-actions { display: flex; align-items: center; gap: 10px; }
        .au-role-select {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text);
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          font-weight: 600;
        }
        .au-role-select:hover { border-color: var(--accent); }
        .au-role-select option { background: var(--bg-elevated); color: var(--text); }

        .admin-badge-premium { background: rgba(226, 183, 20, 0.2); color: var(--accent); }

        .au-delete-btn {
          background: rgba(255, 69, 58, 0.1);
          border: 1px solid rgba(255, 69, 58, 0.2);
          color: var(--error);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .au-delete-btn:hover {
          background: var(--error);
          color: #fff;
        }
      `}</style>
    </div>
  );
}
