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
      router.push("/dashboard");
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
      router.push("/dashboard");
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
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-brand">
              ydt<span>focus</span>
            </h1>
            <p className="auth-subtitle">AI destekli dil öğrenme platformuna hoş geldiniz</p>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
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

            <div className="form-group">
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

            <button type="submit" className="auth-btn-primary" disabled={loading}>
              {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </form>

          <div className="auth-divider">
            <span>veya</span>
          </div>

          <button onClick={handleGoogleLogin} className="auth-btn-google" disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          <p className="auth-footer">
            Hesabınız yok mu?{" "}
            <Link href="/register">Kayıt Ol</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
