"use client";

import { useState, useEffect } from "react";
import { getSpinWheelConfig, saveSpinWheelConfig } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";

// Cloud Function (functions/index.js -> spinWheel) bu ağırlıklarla AYNI
// varsayılana düşüyor, config/spinWheel dökümanı boşsa. Panel ilk açıldığında
// döküman yoksa bu liste gösterilir (henüz kaydedilmemiş "mevcut sunucu
// davranışı" olarak) — Kaydet'e basılınca Firestore'a yazılır.
const DEFAULT_PRIZES = [
  { days: 0, label: "Bir Dahaki Sefere", weight: 50 },
  { days: 1, label: "1 Gün Premium", weight: 30 },
  { days: 3, label: "3 Gün Premium", weight: 15 },
  { days: 7, label: "7 Gün Premium", weight: 5 },
];

export default function AdminSpinWheelPage() {
  const { showNotification } = useNotification();
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [usingDefaults, setUsingDefaults] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const config = await getSpinWheelConfig();
      if (config?.prizes?.length) {
        setPrizes(config.prizes);
        setUsingDefaults(false);
      } else {
        setPrizes(DEFAULT_PRIZES);
        setUsingDefaults(true);
      }
    } catch (err) {
      showNotification("Çark ayarları yüklenemedi.", "error");
    }
    setLoading(false);
  }

  function updateField(index, field, value) {
    setPrizes((prev) =>
      prev.map((p, i) =>
        i === index
          ? { ...p, [field]: field === "label" ? value : Number(value) || 0 }
          : p
      )
    );
  }

  function addRow() {
    setPrizes((prev) => [...prev, { days: 0, label: "Yeni Ödül", weight: 1 }]);
  }

  function removeRow(index) {
    setPrizes((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (prizes.length === 0) {
      return showNotification("En az bir ödül dilimi olmalı.", "warning");
    }
    if (prizes.some((p) => !p.label.trim() || p.weight <= 0)) {
      return showNotification("Her dilimin etiketi ve pozitif bir ağırlığı olmalı.", "warning");
    }
    setSaving(true);
    try {
      await saveSpinWheelConfig(prizes);
      setUsingDefaults(false);
      showNotification("Çark ayarları kaydedildi. Yeni ağırlıklar bir sonraki çevirmeden itibaren geçerli.", "success");
    } catch (err) {
      showNotification("Kaydetme sırasında hata oluştu.", "error");
    }
    setSaving(false);
  }

  const totalWeight = prizes.reduce((sum, p) => sum + (p.weight || 0), 0);

  if (loading) {
    return <div className="page-loading"><div className="spinner-ring"></div><p>Çark ayarları yükleniyor...</p></div>;
  }

  return (
    <div className="admin-spin-view">
      <div className="glass-card">
        <div className="sw-header">
          <div>
            <h3 className="section-title">Çark Çevir Yönetimi</h3>
            <p className="sw-header-sub">
              Mobil uygulamadaki haftalık çarkın ödül ağırlıkları — gerçek kazanma olasılığı
              her zaman Cloud Function tarafında (sunucu), bu dökümana göre hesaplanır.
            </p>
          </div>
          <button className="admin-btn" onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>

        {usingDefaults && (
          <p className="sw-notice">
            Henüz özel bir ayar kaydedilmemiş — aşağıda sunucudaki varsayılan ağırlıklar gösteriliyor.
            Kaydet'e bastığınızda bu değerler Firestore'a yazılır ve o andan itibaren geçerli olur.
          </p>
        )}

        <div className="sw-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ödül Etiketi</th>
                <th>Premium Gün Sayısı</th>
                <th>Ağırlık</th>
                <th>Kazanma İhtimali</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((p, i) => (
                <tr key={i}>
                  <td>
                    <input
                      className="sw-input"
                      value={p.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="sw-input sw-input-num"
                      type="number"
                      min="0"
                      value={p.days}
                      onChange={(e) => updateField(i, "days", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      className="sw-input sw-input-num"
                      type="number"
                      min="1"
                      value={p.weight}
                      onChange={(e) => updateField(i, "weight", e.target.value)}
                    />
                  </td>
                  <td className="sw-pct">
                    {totalWeight > 0 ? `%${((p.weight / totalWeight) * 100).toFixed(1)}` : "-"}
                  </td>
                  <td>
                    <button className="sw-remove-btn" onClick={() => removeRow(i)} title="Sil">
                      Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="sw-add-btn" onClick={addRow}>+ Ödül Dilimi Ekle</button>
      </div>

      <style jsx>{`
        .admin-spin-view { width: 100%; padding-bottom: 50px; }
        .sw-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
        .sw-header-sub { color: var(--text-muted); font-size: 0.85rem; margin-top: 6px; max-width: 560px; }
        .sw-notice {
          background: rgba(226, 183, 20, 0.1); border: 1px solid rgba(226, 183, 20, 0.3);
          color: var(--accent); font-size: 0.85rem; padding: 12px 16px; border-radius: 10px; margin: 16px 0;
        }
        .sw-table-wrap { overflow-x: auto; margin-top: 16px; }
        .sw-input {
          background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;
          padding: 8px 10px; color: var(--text); font-size: 0.9rem; outline: none; width: 100%; min-width: 140px;
        }
        .sw-input:focus { border-color: var(--accent); }
        .sw-input-num { min-width: 80px; }
        .sw-pct { color: var(--accent); font-weight: 700; }
        .sw-remove-btn {
          background: rgba(255, 69, 58, 0.1); border: 1px solid rgba(255, 69, 58, 0.2);
          color: var(--error); border-radius: 8px; padding: 6px 12px; cursor: pointer; font-weight: 600;
        }
        .sw-remove-btn:hover { background: var(--error); color: #fff; }
        .sw-add-btn {
          margin-top: 16px; width: 100%; padding: 14px; background: var(--bg-elevated);
          border: 1px dashed var(--border); color: var(--text-muted); border-radius: 12px;
          cursor: pointer; font-weight: 700;
        }
        .sw-add-btn:hover { color: var(--text); border-color: var(--accent); }

        @media (max-width: 600px) {
          .sw-header { flex-direction: column; }
          .sw-header :global(.admin-btn) { width: 100%; }
        }
      `}</style>
    </div>
  );
}
