"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/reading");
    } catch (err) {
      if (err.code === "auth/user-not-found") setError("Bu e-posta ile kayıtlı kullanıcı bulunamadı.");
      else if (err.code === "auth/wrong-password") setError("Şifre hatalı.");
      else if (err.code === "auth/invalid-email") setError("Geçersiz e-posta adresi.");
      else setError("Giriş yapılamadı. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push("/reading");
    } catch (err) {
      console.error("Google Login Error:", err.code, err.message);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google giriş penceresi kapatıldı.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup engellendi. Tarayıcı ayarlarından popup'ları izin verin.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("Bu domain Firebase'de yetkilendirilmemiş. Firebase Console > Authentication > Settings > Authorized domains'e localhost ekleyin.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Ağ hatası. İnternet bağlantınızı kontrol edin.");
      } else {
        setError(`Google ile giriş yapılamadı. (${err.code || "bilinmeyen hata"})`);
      }
    }
    setLoading(false);
  }

  return (
    <div className="gate-page">
      <div className="gate-card">
        <div className="gate-header">
          <div className="gate-brand">ydt<span>focus</span></div>
          <p className="gate-subtitle">Akademik İngilizce çalışmana devam et</p>
        </div>

        {error && <div className="gate-error">{error}</div>}

        <form onSubmit={handleLogin} className="gate-form">
          <div className="gate-field">
            <label htmlFor="email">E-posta</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              required
            />
          </div>

          <div className="gate-field">
            <label htmlFor="password">Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="gate-submit" disabled={loading}>
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>

        <div className="gate-divider"><span>veya</span></div>

        <button onClick={handleGoogleLogin} className="gate-google" disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Google ile Giriş Yap
        </button>

        <p className="gate-footer">
          Hesabınız yok mu? <Link href="/register">Kayıt Ol</Link>
        </p>
      </div>

      <style jsx>{`
        .gate-page {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 20px;
        }
        .gate-card {
          width: 100%;
          max-width: 420px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px 32px;
        }
        .gate-header { text-align: center; margin-bottom: 28px; }
        .gate-brand { font-size: 1.8rem; font-weight: 900; letter-spacing: -1px; color: var(--text); }
        .gate-brand span { color: var(--accent); }
        .gate-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 8px; }
        .gate-error {
          background: rgba(255, 69, 58, 0.1); border: 1px solid rgba(255, 69, 58, 0.3);
          color: var(--error); padding: 12px 16px; border-radius: 12px; font-size: 0.85rem;
          margin-bottom: 20px; text-align: center;
        }
        .gate-form { display: flex; flex-direction: column; gap: 14px; }
        .gate-field { display: flex; flex-direction: column; gap: 6px; }
        .gate-field label { font-size: 0.78rem; font-weight: 700; color: var(--text-muted); }
        .gate-field input {
          width: 100%; background: var(--glass); border: 1px solid var(--border);
          border-radius: 12px; padding: 13px 14px; font-size: 0.95rem; color: var(--text);
          font-family: var(--font); outline: none; transition: border-color 0.2s;
        }
        .gate-field input:focus { border-color: var(--accent); }
        .gate-submit {
          background: var(--accent); color: #000; border: none; border-radius: 12px;
          padding: 14px; font-size: 0.95rem; font-weight: 800; cursor: pointer; margin-top: 4px;
          font-family: var(--font);
        }
        .gate-submit:disabled { opacity: 0.5; cursor: not-allowed; }
        .gate-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0; }
        .gate-divider::before, .gate-divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
        .gate-divider span { color: var(--text-muted); font-size: 0.8rem; }
        .gate-google {
          display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%;
          background: var(--glass); border: 1px solid var(--border); border-radius: 12px;
          padding: 13px; font-size: 0.88rem; font-weight: 700; color: var(--text); cursor: pointer;
          font-family: var(--font);
        }
        .gate-google:hover { border-color: var(--accent); }
        .gate-google:disabled { opacity: 0.5; cursor: not-allowed; }
        .gate-footer { text-align: center; color: var(--text-muted); font-size: 0.85rem; margin-top: 22px; }
        .gate-footer a { color: var(--accent); font-weight: 700; text-decoration: none; }
        .gate-footer a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
