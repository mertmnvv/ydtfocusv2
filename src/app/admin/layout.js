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
    { href: "/admin/feedback", label: "Geri Bildirimler" },
    { href: "/admin/seed", label: "Veri Yükleme" },
  ];

  return (
    <div className="app-shell admin-shell">
      <nav className="mini-nav">
        <div className="nav-container">
          <Link href="/reading" className="logo">ydt<span>focus</span></Link>
          <div className="nav-links">
            <Link href="/reading" className="nav-btn">Uygulamaya Dön</Link>
          </div>
          <div className="nav-user">
            <span className="admin-nav-tag">Yönetici Paneli</span>
          </div>
        </div>
      </nav>

      <main className="app-main admin-main">
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

      <nav className="mobile-bottom-nav">
        {[
          { id: "admin", label: "Genel Bakış", href: "/admin" },
          { id: "words", label: "Kelimeler", href: "/admin/words" },
          { id: "users", label: "Kullanıcılar", href: "/admin/users" },
          { id: "reading", label: "Uygulama", href: "/reading" },
        ].map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`bottom-nav-item ${pathname === item.href ? "active" : ""}`}
          >
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

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
