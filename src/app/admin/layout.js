"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/reading");
    }
  }, [user, loading, isAdmin, router]);

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

  if (!user || !isAdmin) return null;

  const adminNav = [
    { href: "/admin", label: "Genel Bakış" },
    { href: "/admin/words", label: "Kelimeler" },
    { href: "/admin/grammar", label: "Gramer" },
    { href: "/admin/users", label: "Kullanıcılar" },
    { href: "/admin/spin-wheel", label: "Çark Çevir" },
    { href: "/admin/gift-codes", label: "Hediye Kodları" },
    { href: "/admin/feedback", label: "Geri Bildirimler" },
    { href: "/admin/seed", label: "Veri Yükleme" },
  ];

  return (
    <div className="app-shell admin-shell">
      <nav className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/reading" className="app-topbar-logo">ydt<span>focus</span></Link>
          <div className="app-topbar-links">
            <Link href="/reading" className="app-topbar-link">Uygulamaya Dön</Link>
          </div>
          <div className="app-topbar-user">
            <span className="admin-nav-tag">Yönetici</span>
          </div>
        </div>
      </nav>

      <main className="app-main hub-app-main admin-main">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Yönetici Paneli</h1>
          <p className="admin-page-subtitle">İçerik ve kullanıcı yönetimi</p>
        </div>

        <div className="admin-nav">
          {adminNav.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-btn ${pathname === item.href ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {children}
      </main>

      <style jsx>{`
        .admin-nav-tag { color: var(--warning); font-weight: 700; font-size: 0.85rem; }
        .admin-main { max-width: 1100px; }
        .admin-page-header { margin-bottom: 24px; }
        .admin-page-title { font-size: 1.6rem; font-weight: 800; color: var(--text); letter-spacing: -0.5px; }
        .admin-page-subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 4px; }
      `}</style>
    </div>
  );
}
