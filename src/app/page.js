"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner">
          <div className="spinner-ring"></div>
          <div className="spinner-brand">ydt<span>focus</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="logo-large">ydt<span>focus</span></div>
        <h1 className="landing-title">YDT/YDS Hazırlığında Yeni Nesil AI Platformu</h1>
        <p className="landing-subtitle">Kelime bankanı oluştur, yapay zeka ile çalış ve sınavda fark at.</p>
        <div className="landing-btns">
          <button onClick={() => router.push("/login")} className="landing-btn-primary">Hemen Başla</button>
          <button onClick={() => router.push("/login")} className="landing-btn-outline">Giriş Yap</button>
        </div>
      </div>
    </div>
  );
}
