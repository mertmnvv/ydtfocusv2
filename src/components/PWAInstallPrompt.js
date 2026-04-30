"use client";

import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Standalone (uygulama olarak açılmışsa) veya masaüstü ise gösterme
    if (window.matchMedia("(display-mode: standalone)").matches || window.innerWidth > 1024) {
      return;
    }

    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const android = /Android/.test(ua);
    
    setIsIOS(ios);
    setIsAndroid(android);

    // iOS veya Android için her zaman göster (veya localStorage ile kontrol et)
    if ((ios || android) && !localStorage.getItem("pwa_prompt_dismissed")) {
      setIsVisible(true);
    }
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      alert("iOS'ta yüklemek için: Paylaş butonuna basın ve 'Ana Ekrana Ekle' seçeneğini seçin.");
    } else if (isAndroid) {
      // Direct APK download link
      window.location.href = "/ydtfocus.apk";
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("pwa_prompt_dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="pwa-smart-banner animate-slideUp">
      <div className="pwa-banner-content">
        <div className="pwa-app-icon">
          <img src="/icon-512.png" alt="App Icon" />
        </div>
        <div className="pwa-app-info">
          <div className="pwa-app-name">YDT Focus Mobile</div>
          <div className="pwa-app-tagline">
            {isAndroid ? "Android Uygulamasını İndir" : "Mobil deneyimi başlat"}
          </div>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button className="pwa-install-btn" onClick={handleInstallClick}>
          {isIOS ? "Nasıl Yüklenir?" : isAndroid ? "APK İndir" : "Yükle"}
        </button>
        <button className="pwa-close-btn" onClick={handleDismiss}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}
