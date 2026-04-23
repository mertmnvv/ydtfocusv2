"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import FloatingBank from "@/components/FloatingBank";

const navItems = [
  { id: "dashboard", label: "Level Up", href: "/dashboard" },
  { id: "reading", label: "Reading", href: "/reading" },
  { id: "quiz", label: "Quiz", href: "/quiz" },
  { id: "hero", label: "Zero to Hero", href: "/hero" },
  { id: "grammar", label: "Gramer", href: "/grammar" },
  { id: "archive", label: "Sözlük", href: "/archive" },
  { id: "linefocus", label: "Linefocus", href: "/linefocus" },
  { id: "mistakes", label: "Hatalar", href: "/mistakes" },
];

export default function AppLayout({ children }) {
  const { user, userProfile, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

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

  if (!user) return null;

  const activeTab = navItems.find(item => pathname.startsWith(item.href))?.id || "dashboard";

  // Linefocus sayfasında navbar gösterme (standalone)
  if (pathname === "/linefocus") {
    return <>{children}</>;
  }

  return (
    <div className="app-shell">
      {/* Desktop Navbar */}
      <nav className="mini-nav">
        <div className="nav-container">
          <Link href="/dashboard" className="logo">
            ydt<span>focus</span>
          </Link>
          <div className="nav-links">
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-btn ${activeTab === item.id ? "active-nav" : ""}`}
              >
                {item.label}
              </Link>
            ))}
            {isAdmin && (
              <Link href="/admin" className="nav-btn nav-btn-admin">
                Admin
              </Link>
            )}
          </div>
          <div className="nav-user">
            <span className="nav-user-name">
              {userProfile?.displayName || user.email}
            </span>
            <button onClick={logout} className="nav-btn nav-btn-logout">
              Çıkış
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile FAB Menu */}
      <button className="mobile-fab" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <svg width="23" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="3" width="7" height="7" rx="1"></rect>
          <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          <rect x="3" y="14" width="7" height="7" rx="1"></rect>
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-grid" onClick={(e) => e.stopPropagation()}>
            {navItems.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`mobile-menu-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-menu-label">{item.label}</span>
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="mobile-menu-item admin"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mobile-menu-label">Admin</span>
              </Link>
            )}
            <button
              className="mobile-menu-item logout"
              onClick={() => { logout(); setMobileMenuOpen(false); }}
            >
              <span className="mobile-menu-label">Çıkış</span>
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="app-main">
        {children}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <span className="footer-brand">ydt<span>focus</span></span>
          <span className="footer-copy">© 2026 YDT Focus | Mert Manav</span>
        </div>
      </footer>
      {/* Floating Bank */}
      <FloatingBank />
    </div>
  );
}
