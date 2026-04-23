"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import FloatingBank from "@/components/FloatingBank";
import AuthModal from "@/components/AuthModal";

const navItems = [
  { id: "dashboard", label: "Level Up", href: "/dashboard" },
  { id: "reading", label: "Reading", href: "/reading" },
  { id: "quiz", label: "Quiz", href: "/quiz" },
  { id: "hero", label: "Zero to Hero", href: "/hero" },
  { id: "grammar", label: "Gramer", href: "/grammar" },
  { id: "archive", label: "Sözlük", href: "/archive" },
  { id: "mistakes", label: "Hatalar", href: "/mistakes" },
];

export default function AppLayout({ children }) {
  const { user, userProfile, loading, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    // Auth guard is removed so guests can view pages
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

  // if (!user) return null; -> Removed to allow guest access

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
          <div className="platform-switcher-container">
            <button
              className={`logo-switcher-btn ${switcherOpen ? "active" : ""}`}
              onClick={() => setSwitcherOpen(!switcherOpen)}
            >
              <div className="logo">
                ydt<span>focus</span>
              </div>
              <span className="switcher-arrow">▾</span>
            </button>

            {switcherOpen && (
              <>
                <div className="switcher-overlay" onClick={() => setSwitcherOpen(false)} />
                <div className="switcher-dropdown">
                  <div className="switcher-label">Platform Değiştir</div>
                  <Link href="/dashboard" className={`switcher-item ${pathname !== "/linefocus" ? "current" : ""}`} onClick={() => setSwitcherOpen(false)}>
                    <div className="switcher-item-dot" />
                    <div className="switcher-item-info">
                      <div className="switcher-item-name">ydtfocus</div>
                      <div className="switcher-item-desc">Ana Çalışma Paneli</div>
                    </div>
                  </Link>
                  <Link href="/linefocus" className={`switcher-item ${pathname === "/linefocus" ? "current" : ""}`} onClick={() => setSwitcherOpen(false)}>
                    <div className="switcher-item-dot" />
                    <div className="switcher-item-info">
                      <div className="switcher-item-name">linefocus</div>
                      <div className="switcher-item-desc">Odaklanmış Okuma & Yazma</div>
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>

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
            {user ? (
              <>
                <span className="nav-user-name">
                  {userProfile?.displayName || user.email}
                </span>
                <button onClick={logout} className="nav-btn nav-btn-logout">
                  Çıkış
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="nav-btn">Giriş</Link>
                <Link href="/register" className="nav-btn nav-btn-primary" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>Kayıt Ol</Link>
              </>
            )}
          </div>
          {/* Mobile Hamburger Button */}
          <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </nav>

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
            {user ? (
              <button
                className="mobile-menu-item logout"
                onClick={() => { logout(); setMobileMenuOpen(false); }}
              >
                <span className="mobile-menu-label">Çıkış</span>
              </button>
            ) : (
              <>
                <Link href="/login" className="mobile-menu-item" onClick={() => setMobileMenuOpen(false)}>
                  <span className="mobile-menu-label">Giriş Yap</span>
                </Link>
                <Link href="/register" className="mobile-menu-item" style={{ borderColor: "var(--accent)" }} onClick={() => setMobileMenuOpen(false)}>
                  <span className="mobile-menu-label" style={{ color: "var(--accent)" }}>Kayıt Ol</span>
                </Link>
              </>
            )}
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
      {/* Global Auth Modal */}
      <AuthModal />
    </div>
  );
}
