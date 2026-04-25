"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function PremiumContent({ children, fallback = null }) {
  const { isPremium, loading, setAuthModalOpen, user } = useAuth();

  if (loading) return null;

  if (isPremium) {
    return <>{children}</>;
  }

  if (fallback) return fallback;

  return (
    <div className="premium-lock-card glass-card">
      <div className="premium-lock-icon">
        <i className="fa-solid fa-crown"></i>
      </div>
      <h3>Premium Özellik</h3>
      <p>Bu özelliği kullanabilmek için Premium üye olmanız gerekmektedir.</p>
      
      {!user ? (
        <button className="btn-primary" onClick={() => setAuthModalOpen(true)}>Giriş Yap</button>
      ) : (
        <Link href="/premium" className="btn-primary">Abonelikleri İncele</Link>
      )}

      <style jsx>{`
        .premium-lock-card {
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          border: 1px solid var(--border);
          border-radius: 24px;
          background: linear-gradient(135deg, rgba(226, 183, 20, 0.05), transparent);
          margin: 20px 0;
        }
        .premium-lock-icon {
          font-size: 2.5rem;
          color: var(--accent);
          margin-bottom: 10px;
          filter: drop-shadow(0 0 10px var(--accent));
        }
        h3 { font-size: 1.5rem; font-weight: 800; color: #fff; margin: 0; }
        p { color: var(--text-muted); max-width: 300px; line-height: 1.5; margin-bottom: 10px; }
      `}</style>
    </div>
  );
}
