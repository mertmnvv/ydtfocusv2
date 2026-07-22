"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// /library artık ayrı bir hub ekranı değil — içerdiği araçlar (Quiz/
// Kartlar/Gramer/Sözlük/Hatalarım) artık Reading üzerinden açılan
// panellerdir (bkz. docs/DESIGN.md, "Reading-merkezli IA"). Bu sayfa
// sadece geriye dönük uyumluluk için: eski bağlantılar/yer imleri hâlâ
// buraya gelebilir. "Zero to Hero" artık Profil sayfasından erişiliyor.
export default function LibraryRedirect() {
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
