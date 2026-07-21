"use client";

import Link from "next/link";

export default function ExamPage() {
  return (
    <div className="exam-page">
      <div className="exam-card">
        <h2>Simülasyon Modu</h2>
        <p className="hint-text">
          YDT Simülasyon modu yeniden tasarlanıyor. Yakında çok daha gelişmiş bir sınav deneyimi ile geri dönecek.
        </p>
        <Link href="/quiz" className="btn-primary">Quiz Moduna Git</Link>
      </div>

      <style jsx>{`
        .exam-page { display: flex; align-items: center; justify-content: center; min-height: 60vh; padding: 20px; }
        .exam-card { max-width: 440px; width: 100%; padding: 48px 40px; text-align: center; background: var(--bg-card); border: 1px solid var(--border); border-radius: 20px; }
        .exam-card h2 { font-weight: 800; margin-bottom: 12px; font-size: 1.3rem; color: var(--text); }
        .exam-card p { margin-bottom: 24px; }
        .exam-card :global(.btn-primary) { display: inline-block; padding: 14px 28px; }
      `}</style>
    </div>
  );
}
