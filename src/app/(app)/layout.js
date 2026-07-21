"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import FloatingBank from "@/components/FloatingBank";
import GlobalAI from "@/components/GlobalAI";
import AuthModal from "@/components/AuthModal";
import Onboarding from "@/components/Onboarding";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PremiumModal from "@/components/PremiumModal";
import PremiumPaywall from "@/components/PremiumPaywall";
import FeedbackModal from "@/components/FeedbackModal";

// 4 hedefli navigasyon modeli (bkz. docs/DESIGN.md — "Sonraki karar:
// Reading-merkezli IA"). Okuma artık uygulamanın girişi ve birincil
// sekmesi; Kütüphane geri kalan destekleyici araçları (Quiz/Kartlar/
// Gramer/Sözlük/Hatalarım/Zero to Hero) barındırır. Web'de Okuma/
// Kütüphane/Rozetler metin linki + ayrı avatar olarak, mobilde aynı 4
// hedef alt tab bar'ında (Profil dahil) render edilir.
const DESTINATIONS = [
  { id: "reading", label: "Okuma", href: "/reading" },
  { id: "library", label: "Kütüphane", href: "/library" },
  { id: "achievements", label: "Rozetler", href: "/achievements" },
  { id: "profile", label: "Profil", href: "/profile" },
];

// Kütüphane hub'ı altına katlanan destekleyici rotalar — bunlardan
// herhangi birindeyken mobil/web navda "Kütüphane" aktif görünmeli.
const LIBRARY_ROUTES = ["/library", "/quiz", "/flashcards-hub", "/grammar", "/archive", "/mistakes", "/hero"];

function getActiveDestination(pathname) {
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/achievements")) return "achievements";
  if (LIBRARY_ROUTES.some((p) => pathname.startsWith(p))) return "library";
  return "reading";
}

import ThemeToggle from "@/components/ThemeToggle";
import { useFcmToken } from "@/hooks/useFcmToken";

export default function AppLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Giriş zorunluluğu kaldırıldı, kullanıcılar serbestçe gezebilir.
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

  // if (!user) return null; engeli kaldırıldı

  return (
    <Suspense fallback={<div className="page-loading"><div className="spinner-ring"></div></div>}>
      <AppContent children={children} />
    </Suspense>
  );
}

function AppContent({ children }) {
  const { user, userProfile, logout, isAdmin, isPremium, premiumModalOpen, setPremiumModalOpen, requireAuth } = useAuth();
  useFcmToken(user);
  const pathname = usePathname();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    // Premium paywall session mantığı kaldırıldı.
  }, [user, isPremium]);

  const activeTab = getActiveDestination(pathname);

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
                  <Link href="/reading" className={`switcher-item ${pathname !== "/linefocus" ? "current" : ""}`} onClick={() => setSwitcherOpen(false)}>
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
            {DESTINATIONS.filter(d => d.id !== "profile").map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`nav-btn ${activeTab === item.id ? "active-nav" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="nav-user">
            <ThemeToggle />
            <div className="profile-menu-wrapper">
              <button
                className={`profile-mini-trigger ${profileOpen ? "active" : ""}`}
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="profile-avatar">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profil" className="avatar-img" />
                  ) : (
                    userProfile?.displayName?.[0] || user?.email?.[0] || "U"
                  )}
                </div>
                <div className="profile-info">
                  <span className="profile-name">
                    {userProfile?.displayName || "Misafir"}
                    {isAdmin ? (
                      <i className="fa-solid fa-user-shield" style={{ color: "#ff453a", marginLeft: 6, fontSize: "0.7rem" }} title="Yönetici"></i>
                    ) : isPremium ? (
                      <i className="fa-solid fa-crown" style={{ color: "var(--accent)", marginLeft: 6, fontSize: "0.7rem" }} title="Premium Üye"></i>
                    ) : null}
                  </span>
                  <span className="profile-sub-text">Menü <i className="fa-solid fa-chevron-down"></i></span>
                </div>
              </button>

              {profileOpen && (
                <>
                  <div className="switcher-overlay" onClick={() => setProfileOpen(false)} />
                  <div className="profile-dropdown">
                    <Link href="/profile" className="profile-drop-item" onClick={() => setProfileOpen(false)}>
                      <i className="fa-solid fa-user"></i>
                      <span>Profilim</span>
                    </Link>
                    <button className="profile-drop-item" onClick={() => { setShowFeedback(true); setProfileOpen(false); }}>
                      <i className="fa-solid fa-comments"></i>
                      <span>Geri Bildirim</span>
                    </button>
                    {isAdmin && (
                      <Link href="/admin" className="profile-drop-item" onClick={() => setProfileOpen(false)}>
                        <i className="fa-solid fa-user-shield"></i>
                        <span>Admin</span>
                      </Link>
                    )}
                    <div className="drop-divider"></div>
                    {user ? (
                      <button onClick={() => { logout(); setProfileOpen(false); }} className="profile-drop-item logout-red">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Çıkış Yap</span>
                      </button>
                    ) : (
                      <button onClick={() => { requireAuth(() => {}); setProfileOpen(false); }} className="profile-drop-item" style={{color: 'var(--accent)'}}>
                        <i className="fa-solid fa-right-to-bracket"></i>
                        <span>Giriş Yap / Kayıt Ol</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="app-main">
        {children}
      </main>

      {/* Mobile Bottom Nav — 4 hedef, sadece metin etiketi (bkz. docs/DESIGN.md 5a) */}
      <nav className="mobile-bottom-nav">
        {DESTINATIONS.map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`bottom-nav-item ${activeTab === item.id ? "active" : ""}`}
          >
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <footer className="app-footer hide-mobile">
        <div className="footer-content">
          <span className="footer-brand">ydt<span>focus</span></span>
          <span className="footer-copy">© 2026 YDT Focus | Mert Manav</span>
        </div>
      </footer>
      <FloatingBank />
      <GlobalAI />
      <AuthModal />
      <PremiumPaywall 
        isOpen={showPaywall} 
        onClose={() => {
          setShowPaywall(false);
          sessionStorage.setItem("paywall_session_seen", "true");
        }} 
        onUpgrade={() => {
          setShowPaywall(false);
          sessionStorage.setItem("paywall_session_seen", "true");
          setPremiumModalOpen(true);
        }}
      />
      <Onboarding onOpenPremium={() => setPremiumModalOpen(true)} />
      <PremiumModal isOpen={premiumModalOpen} onClose={() => setPremiumModalOpen(false)} />
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
      <PWAInstallPrompt />
    </div>
  );
}
