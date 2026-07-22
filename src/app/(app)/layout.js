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

// 3 hedefli navigasyon modeli (bkz. docs/DESIGN.md — "Reading-merkezli
// IA" ve sonraki "gerçek hub" turu). Okuma artık uygulamanın hem girişi
// hem de gerçek merkezi: Quiz/Kartlar/Gramer/Sözlük/Hatalarım/Tekrar
// artık ayrı sekme değil, Reading üzerinden `?panel=` ile açılan
// overlay'lerdir — bu yüzden ayrı bir "Kütüphane" hedefine gerek kalmadı.
// Web'de Okuma/Rozetler metin linki + ayrı avatar olarak, mobilde aynı
// 3 hedef alt tab bar'ında (Profil dahil) render edilir.
const DESTINATIONS = [
  { id: "reading", label: "Okuma", href: "/reading" },
  { id: "achievements", label: "Rozetler", href: "/achievements" },
  { id: "profile", label: "Profil", href: "/profile" },
];

function getActiveDestination(pathname) {
  if (pathname.startsWith("/profile")) return "profile";
  if (pathname.startsWith("/achievements")) return "achievements";
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

  // Tek, minimal üst bar — mobil/masaüstü aynı: logo + Okuma/Rozetler +
  // avatar. Ayrı mobil alt tab bar'ı kaldırıldı (bkz. docs/DESIGN.md,
  // "Reading-merkezli IA" — nav artık 3 hedefe indi, ekstra bir alt bar
  // gerektirmiyor).
  return (
    <div className="app-shell">
      <nav className="app-topbar">
        <div className="app-topbar-inner">
          <Link href="/reading" className="app-topbar-logo">
            ydt<span>focus</span>
          </Link>

          <div className="app-topbar-links">
            {DESTINATIONS.filter(d => d.id !== "profile").map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`app-topbar-link ${activeTab === item.id ? "active" : ""}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="app-topbar-user">
            <ThemeToggle />
            <div className="app-avatar-wrapper">
              <button
                className={`app-avatar-btn ${profileOpen ? "active" : ""}`}
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="app-avatar">
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="Profil" className="avatar-img" />
                  ) : (
                    userProfile?.displayName?.[0] || user?.email?.[0] || "U"
                  )}
                </div>
              </button>

              {profileOpen && (
                <>
                  <div className="app-avatar-overlay" onClick={() => setProfileOpen(false)} />
                  <div className="app-avatar-menu">
                    <Link href="/profile" className="app-avatar-item" onClick={() => setProfileOpen(false)}>
                      <i className="fa-solid fa-user"></i>
                      <span>Profilim</span>
                      {isAdmin ? (
                        <i className="fa-solid fa-user-shield app-avatar-badge" title="Yönetici"></i>
                      ) : isPremium ? (
                        <i className="fa-solid fa-crown app-avatar-badge" title="Elite Üye"></i>
                      ) : null}
                    </Link>
                    <Link href="/linefocus" className="app-avatar-item" onClick={() => setProfileOpen(false)}>
                      <i className="fa-solid fa-arrow-right-arrow-left"></i>
                      <span>Linefocus&apos;a Geç</span>
                    </Link>
                    <button className="app-avatar-item" onClick={() => { setShowFeedback(true); setProfileOpen(false); }}>
                      <i className="fa-solid fa-comments"></i>
                      <span>Geri Bildirim</span>
                    </button>
                    {isAdmin && (
                      <Link href="/admin" className="app-avatar-item" onClick={() => setProfileOpen(false)}>
                        <i className="fa-solid fa-user-shield"></i>
                        <span>Admin</span>
                      </Link>
                    )}
                    <div className="app-avatar-divider"></div>
                    {user ? (
                      <button onClick={() => { logout(); setProfileOpen(false); }} className="app-avatar-item logout-red">
                        <i className="fa-solid fa-right-from-bracket"></i>
                        <span>Çıkış Yap</span>
                      </button>
                    ) : (
                      <button onClick={() => { requireAuth(() => {}); setProfileOpen(false); }} className="app-avatar-item" style={{color: 'var(--accent)'}}>
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

      <main className="app-main hub-app-main">
        {children}
      </main>

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
