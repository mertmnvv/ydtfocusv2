"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminLayout({ children }) {
  const { user, userProfile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/dashboard");
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
    { href: "/admin", label: "📊 Dashboard" },
    { href: "/admin/words", label: "📚 Kelimeler" },
    { href: "/admin/grammar", label: "📖 Gramer" },
    { href: "/admin/users", label: "👥 Kullanıcılar" },
    { href: "/admin/seed", label: "🌱 Seed" },
  ];

  return (
    <div className="app-shell">
      <nav className="mini-nav">
        <div className="nav-container">
          <Link href="/dashboard" className="logo">
            ydt<span>focus</span>
          </Link>
          <div className="nav-links">
            <Link href="/dashboard" className="nav-btn">← Uygulamaya Dön</Link>
          </div>
          <div className="nav-user">
            <span className="nav-user-name" style={{ color: "var(--warning)" }}>
              🛡️ Admin Panel
            </span>
          </div>
        </div>
      </nav>

      <main className="app-main" style={{ maxWidth: "1100px" }}>
        <div className="admin-header">
          <h1 className="admin-title">🛡️ Admin Panel</h1>
          <p className="admin-subtitle">İçerik ve kullanıcı yönetimi</p>
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
    </div>
  );
}
