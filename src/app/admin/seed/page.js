"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { batchAddArchiveWords, batchAddPhrasalVerbs, clearCollection } from "@/lib/firestore";
import { useNotification } from "@/context/NotificationContext";
import CustomDialog from "@/components/CustomDialog";
import { useRef } from "react";

export default function AdminSeedPage() {
  const { isAdmin } = useAuth();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'add' or 'clear'
  const fileInputRef = useRef(null);

  const parseFile = async (file) => {
    const text = await file.text();
    let archiveData = [];
    let phrasalData = [];

    if (file.name.endsWith(".json")) {
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) archiveData = json;
        else {
          archiveData = json.archiveData || [];
          phrasalData = json.phrasalData || [];
        }
      } catch (e) { throw new Error("Geçersiz JSON formatı."); }
    } else {
      // JS Regex parsing (same as API route)
      const archiveRegex = /\{\s*word:\s*"([^"]+)"\s*,\s*meaning:\s*"([^"]+)"\s*(?:,\s*syn:\s*"([^"]*)")?\s*(?:,\s*level:\s*"([^"]*)")?\s*\}/g;
      const archiveSection = text.match(/const\s+ydtArchiveData\s*=\s*\[([\s\S]*?)\];/);
      if (archiveSection) {
        let m;
        while ((m = archiveRegex.exec(archiveSection[1])) !== null) {
          archiveData.push({ word: m[1], meaning: m[2], syn: m[3] || "", level: m[4] || "" });
        }
      }

      const phrasalRegex = /\{\s*phrase:\s*"([^"]+)"\s*,\s*meaning:\s*"([^"]+)"\s*(?:,\s*syn:\s*"([^"]*)")?\s*\}/g;
      const phrasalSection = text.match(/const\s+ydtPhrasalVerbs\s*=\s*\[([\s\S]*?)\];/);
      if (phrasalSection) {
        let m;
        while ((m = phrasalRegex.exec(phrasalSection[1])) !== null) {
          phrasalData.push({ phrase: m[1], meaning: m[2], syn: m[3] || "" });
        }
      }

      const oxfordRegex = /const\s+(oxfordMegaPack\d+)\s*=\s*\[([\s\S]*?)\];/g;
      let oxMatch;
      while ((oxMatch = oxfordRegex.exec(text)) !== null) {
        const wordRegex = /\{\s*word:\s*"([^"]+)"\s*,\s*meaning:\s*"([^"]+)"\s*(?:,\s*syn:\s*"([^"]*)")?\s*(?:,\s*level:\s*"([^"]*)")?\s*\}/g;
        let wm;
        while ((wm = wordRegex.exec(oxMatch[2])) !== null) {
          archiveData.push({ word: wm[1], meaning: wm[2], syn: wm[3] || "", level: wm[4] || "" });
        }
      }
    }
    return { archiveData, phrasalData };
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSeeding(true);
    setStatus("Dosya analiz ediliyor...");

    try {
      const { archiveData, phrasalData } = await parseFile(file);
      const total = archiveData.length + phrasalData.length;

      if (total === 0) throw new Error("Dosyada geçerli veri bulunamadı.");

      if (pendingAction === "clear") {
        setStatus("Veritabanı temizleniyor...");
        await clearCollection("archive");
        await clearCollection("phrasalVerbs");
      }

      setStatus(`${archiveData.length} kelime ve ${phrasalData.length} phrasal verb yükleniyor...`);
      if (archiveData.length > 0) await batchAddArchiveWords(archiveData);
      if (phrasalData.length > 0) await batchAddPhrasalVerbs(phrasalData);

      setStatus(`İşlem başarılı. Toplam ${total} öğe güncellendi.`);
      showNotification("Yükleme tamamlandı.", "success");
    } catch (err) {
      setStatus(`Hata: ${err.message}`);
      showNotification("İşlem başarısız.", "error");
    }

    setSeeding(false);
    e.target.value = ""; // Reset file input
  };

  const triggerUpload = (action) => {
    setPendingAction(action);
    fileInputRef.current.click();
  };

  if (!isAdmin) return null;

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".js,.json"
        style={{ display: "none" }}
      />

      <div className="glass-card">
        <h3 className="section-title" style={{ fontSize: "1.1rem" }}>Veri Yönetimi</h3>
        <p className="hint-text" style={{ marginBottom: 24 }}>
          Eski projeden gelen .js veya .json dosyalarınızı buraya yükleyerek veritabanını güncelleyebilirsiniz.
        </p>

        <div className="admin-stats-grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Temizle ve Yükle */}
          <div className="glass-card" style={{ 
            textAlign: "center", border: "1px solid rgba(255,69,58,0.2)", background: "rgba(255,69,58,0.02)" 
          }}>
            <h4 style={{ color: "var(--error)", marginBottom: 12 }}>Sıfırla ve Yükle</h4>
            <p className="hint-text" style={{ fontSize: "0.85rem", marginBottom: 20 }}>
              Tüm mevcut verileri siler ve dosyayı sıfırdan yükler.
            </p>
            <button 
              className="btn-primary" 
              style={{ background: "var(--error)" }} 
              onClick={() => setShowConfirm(true)} 
              disabled={seeding}
            >
              Dosya Seç
            </button>
          </div>

          {/* Sadece Ekle */}
          <div className="glass-card" style={{ 
            textAlign: "center", border: "1px solid rgba(10,132,255,0.2)", background: "rgba(10,132,255,0.02)" 
          }}>
            <h4 style={{ color: "var(--primary)", marginBottom: 12 }}>Üzerine Ekle</h4>
            <p className="hint-text" style={{ fontSize: "0.85rem", marginBottom: 20 }}>
              Mevcut verileri korur ve dosyadaki yeni verileri ekler.
            </p>
            <button className="btn-primary" onClick={() => triggerUpload("add")} disabled={seeding}>
              Dosya Seç
            </button>
          </div>
        </div>

        {/* Status */}
        {status && (
          <div style={{
            marginTop: 24, padding: 16,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid var(--border)",
            borderRadius: 14, fontWeight: 600, fontSize: "0.9rem", color: "var(--text)", textAlign: "center"
          }}>
            {seeding && <div className="spinner-ring" style={{ width: 16, height: 16, borderSize: 2, marginBottom: 8, display: "inline-block" }} />}
            <div>{status}</div>
          </div>
        )}
      </div>

      {showConfirm && (
        <CustomDialog
          title="Veritabanını Sıfırla"
          message="Bu işlem tüm kelimeleri silecek ve seçtiğiniz dosyayı baştan yükleyecektir. Emin misiniz?"
          confirmText="Devam Et"
          cancelText="İptal"
          onConfirm={() => {
            setShowConfirm(false);
            triggerUpload("clear");
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
