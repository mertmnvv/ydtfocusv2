"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { batchAddArchiveWords, batchAddPhrasalVerbs } from "@/lib/firestore";

// data.js'den import yerine, admin panelinden JSON paste ile seed yapılacak
export default function AdminSeedPage() {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [jsonInput, setJsonInput] = useState("");
  const [seedType, setSeedType] = useState("archive");
  const [seeding, setSeeding] = useState(false);

  async function handleSeed() {
    if (!jsonInput.trim()) return alert("JSON verisi yapıştırın!");
    setSeeding(true);
    setStatus("Veri işleniyor...");

    try {
      const data = JSON.parse(jsonInput);
      if (!Array.isArray(data)) throw new Error("JSON bir dizi olmalı!");

      const total = data.length;
      setStatus(`${total} öğe bulundu. Firestore'a yükleniyor...`);

      if (seedType === "archive") {
        await batchAddArchiveWords(data);
      } else {
        await batchAddPhrasalVerbs(data);
      }

      setProgress(100);
      setStatus(`✅ ${total} öğe başarıyla yüklendi!`);
      setJsonInput("");
    } catch (err) {
      setStatus(`❌ Hata: ${err.message}`);
    }
    setSeeding(false);
  }

  // Eski data.js formatından otomatik dönüştürme butonu
  async function handleAutoSeed() {
    setSeeding(true);
    setStatus("data.js dosyası okunuyor...");

    try {
      const resp = await fetch("/api/seed");
      const result = await resp.json();

      if (!result.success) {
        setStatus(`❌ Hata: ${result.error}`);
        setSeeding(false);
        return;
      }

      setStatus(`📦 ${result.archiveCount} arşiv + ${result.phrasalCount} phrasal verb bulundu. Firestore'a yükleniyor...`);

      if (result.archiveData?.length > 0) {
        await batchAddArchiveWords(result.archiveData);
      }
      if (result.phrasalData?.length > 0) {
        await batchAddPhrasalVerbs(result.phrasalData);
      }

      setStatus(`✅ ${result.archiveCount} arşiv kelimesi ve ${result.phrasalCount} phrasal verb başarıyla yüklendi!`);
      setProgress(100);
    } catch (err) {
      setStatus(`❌ Seed hatası: ${err.message}`);
    }
    setSeeding(false);
  }

  if (!isAdmin) return null;

  return (
    <div>
      <div className="glass-card">
        <h3 className="section-title" style={{ fontSize: "1.1rem" }}>🌱 Veri Yükleme (Seed)</h3>
        <p className="hint-text" style={{ marginBottom: 16 }}>
          Eski projeden data.js içeriğini Firestore&apos;a aktarmak için kullanın.
        </p>

        {/* Otomatik Seed */}
        <div style={{
          padding: 20, background: "rgba(48,209,88,0.05)", border: "1px solid rgba(48,209,88,0.2)",
          borderRadius: 16, marginBottom: 20, textAlign: "center",
        }}>
          <h4 style={{ color: "var(--primary)", marginBottom: 8 }}>🚀 Otomatik Seed (Önerilen)</h4>
          <p className="hint-text" style={{ marginBottom: 12 }}>
            Eski projedeki data.js dosyasını API Route üzerinden otomatik yükler.
          </p>
          <button className="btn-primary" onClick={handleAutoSeed} disabled={seeding}>
            {seeding ? "⏳ Yükleniyor..." : "🚀 Otomatik Seed Başlat"}
          </button>
        </div>

        {/* Manuel JSON Seed */}
        <div style={{ marginBottom: 16 }}>
          <label className="hint-text">Koleksiyon Türü:</label>
          <select value={seedType} onChange={e => setSeedType(e.target.value)} className="reading-select" style={{ marginLeft: 10 }}>
            <option value="archive">📚 Arşiv Kelimeleri</option>
            <option value="phrasal">🔗 Phrasal Verbs</option>
          </select>
        </div>

        <textarea
          className="reading-textarea"
          placeholder={'JSON formatında yapıştırın, örnek:\n[{"word":"however","meaning":"ancak","syn":"nevertheless"}]'}
          value={jsonInput}
          onChange={e => setJsonInput(e.target.value)}
          rows={8}
        />

        <button className="admin-btn" style={{ marginTop: 12 }} onClick={handleSeed} disabled={seeding}>
          {seeding ? "⏳ Yükleniyor..." : "📤 Manuel Seed Başlat"}
        </button>

        {/* Status */}
        {status && (
          <div style={{
            marginTop: 16, padding: 16,
            background: status.includes("✅") ? "rgba(48,209,88,0.1)" : status.includes("❌") ? "rgba(255,69,58,0.1)" : "rgba(10,132,255,0.1)",
            border: `1px solid ${status.includes("✅") ? "rgba(48,209,88,0.3)" : status.includes("❌") ? "rgba(255,69,58,0.3)" : "rgba(10,132,255,0.3)"}`,
            borderRadius: 14, fontWeight: 600, fontSize: "0.9rem",
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
