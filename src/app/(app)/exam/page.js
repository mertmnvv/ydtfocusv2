"use client";

import Link from "next/link";

export default function ExamPage() {
  return (
    <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
      <div className="glass-card" style={{ padding: 50 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 12, fontSize: "1.4rem" }}>Simülasyon Modu</h2>
        <p className="hint-text" style={{ marginBottom: 24 }}>
          YDT Simülasyon modu yeniden tasarlanıyor. Yakında çok daha gelişmiş bir sınav deneyimi ile geri dönecek.
        </p>
        <Link href="/quiz" className="btn-primary" style={{ display: "inline-block", padding: "14px 28px" }}>
          Quiz Moduna Git
        </Link>
      </div>
    </div>
  );
}
