"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// /dashboard artık ayrı bir ekran değil — "Bugün" (Tek Odak Akışı) içeriği
// Reading'in üstündeki durum şeridine taşındı (bkz. docs/DESIGN.md,
// "Sonraki karar: Reading-merkezli IA"). Bu sayfa sadece geriye dönük
// uyumluluk için: eski bağlantılar/yer imleri hâlâ buraya gelebilir.
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reading");
  }, [router]);

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-brand">ydt<span>focus</span></div>
      </div>
    </div>
  );
}
