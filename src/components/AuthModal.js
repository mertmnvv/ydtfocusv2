"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AuthModal() {
  const { authModalOpen, setAuthModalOpen } = useAuth();
  const router = useRouter();

  if (!authModalOpen) return null;

  return (
    <div className="auth-modal-overlay" onClick={() => setAuthModalOpen(false)}>
      <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={() => setAuthModalOpen(false)}>✕</button>
        <div className="auth-modal-icon">🔒</div>
        <h2 className="auth-modal-title">Kayıt Olmalısın</h2>
        <p className="auth-modal-desc">
          İlerlemelerini kaydetmek, kelimeleri bankana eklemek ve akıllı tekrar algoritmasından faydalanmak için ücretsiz bir hesap oluşturmalısın.
        </p>
        <div className="auth-modal-actions">
          <button className="btn-primary w-100" onClick={() => { setAuthModalOpen(false); router.push("/register"); }}>
            Hemen Ücretsiz Kayıt Ol
          </button>
          <button className="btn-ghost w-100" onClick={() => { setAuthModalOpen(false); router.push("/login"); }}>
            Zaten Hesabım Var
          </button>
        </div>
      </div>
    </div>
  );
}
