"use client";

import { useState, useEffect } from "react";

export default function PWAInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    // Standalone (uygulama olarak açılmışsa) veya masaüstü ise gösterme
    if (window.matchMedia("(display-mode: standalone)").matches || window.innerWidth > 1024) {
      return;
    }

    // iOS kontrolü
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // iOS için her zaman göster (veya localStorage ile kontrol et)
    if (ios && !localStorage.getItem("pwa_prompt_dismissed")) {
      setIsVisible(true);
    }
  }, []);

  const handleInstallClick = () => {
    if (isIOS) {
      alert("iOS'ta yüklemek için: Paylaş butonuna basın ve 'Ana Ekrana Ekle' seçeneğini seçin.");
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
          <img src="/icon-192.png" alt="App Icon" />
        </div>
        <div className="pwa-app-info">
          <div className="pwa-app-name">YDT Focus App</div>
          <div className="pwa-app-tagline">Mobil deneyimi başlat</div>
        </div>
      </div>
      <div className="pwa-banner-actions">
        <button className="pwa-install-btn" onClick={handleInstallClick}>
          {isIOS ? "Nasıl Yüklenir?" : "Yükle"}
        </button>
        <button className="pwa-close-btn" onClick={handleDismiss}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}
