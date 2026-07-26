"use client";

import { useState, useEffect } from "react";
import { getGiftCodes } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

export default function AdminGiftCodesPage() {
  const { showNotification } = useNotification();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getGiftCodes(100);
      setCodes(data);
    } catch (err) {
      showNotification("Hediye kodları yüklenemedi.", "error");
    }
    setLoading(false);
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Hediye kodları yükleniyor...</p></div>;
  }

  return (
    <div className="admin-gift-view">
      <div className="glass-card">
        <div className="gc-header">
          <div>
            <h3 className="section-title">Hediye Kodları</h3>
            <p className="gc-header-sub">
              Mobil çark/hediye premium akışında kullanıcıların birbirine devrettiği kodlar
              (bkz. functions/index.js, claimWheelPrize). Sadece görüntüleme amaçlıdır —
              kodlar yalnızca Cloud Functions tarafından yazılır/kullanılır, buradan
              düzenlenemez.
            </p>
          </div>
          <button className="admin-btn" onClick={load}>Yenile</button>
        </div>

        <div className="gc-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Kod</th>
                <th>Gönderen</th>
                <th>Gün</th>
                <th>Durum</th>
                <th>Oluşturulma</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id}>
                  <td className="gc-code">{c.code || c.id}</td>
                  <td className="gc-muted">{c.fromName || "-"}</td>
                  <td>{c.days ?? "-"}</td>
                  <td>
                    <span className={`admin-badge ${c.redeemed ? "admin-badge-premium" : "admin-badge-user"}`}>
                      {c.redeemed ? "Kullanıldı" : "Bekliyor"}
                    </span>
                  </td>
                  <td className="gc-muted">
                    {c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000).toLocaleString("tr-TR") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {codes.length === 0 && <div className="gc-empty">Henüz oluşturulmuş bir hediye kodu yok.</div>}
        </div>
      </div>

      <style jsx>{`
        .admin-gift-view { width: 100%; padding-bottom: 50px; }
        .gc-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .gc-header-sub { color: var(--text-muted); font-size: 0.85rem; margin-top: 6px; max-width: 560px; }
        .gc-table-wrap { overflow-x: auto; margin-top: 16px; }
        .gc-code { font-family: monospace; font-weight: 700; color: var(--text); }
        .gc-muted { color: var(--text-muted); font-size: 0.85rem; }
        .gc-empty { text-align: center; color: var(--text-muted); padding: 40px; }
        .admin-badge-premium { background: rgba(226, 183, 20, 0.2); color: var(--accent); }

        @media (max-width: 600px) {
          .gc-header { flex-direction: column; }
          .gc-header :global(.admin-btn) { width: 100%; }
        }
      `}</style>
    </div>
  );
}
