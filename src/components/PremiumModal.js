"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/AuthContext";

export default function PremiumModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isOpen) setShowComingSoon(false);
  }, [isOpen]);

  const { user, userProfile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [iframeToken, setIframeToken] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!mounted || !isOpen) return null;

  const handleUpgrade = async () => {
    if (!user) return alert("Lütfen önce giriş yapın.");
    
    setIsProcessing(true);
    try {
      const response = await fetch("/api/paytr/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: userProfile?.displayName || user.email,
          plan: selectedPlan
        })
      });

      const result = await response.json();
      if (result.token) {
        setIframeToken(result.token);
      } else {
        alert("Ödeme başlatılamadı: " + (result.error || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error(error);
      alert("Bir hata oluştu.");
    } finally {
      setIsProcessing(false);
    }
  };

  return createPortal(
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="p-modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </div>
        
        <div className="p-modal-content">
          {iframeToken ? (
            <div className="paytr-iframe-container">
              <iframe 
                src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`} 
                id="paytriframe" 
                frameBorder="0" 
                scrolling="no" 
                style={{ width: "100%", height: "600px" }}
              ></iframe>
              <button className="p-back-btn" onClick={() => setIframeToken(null)}>Geri Dön</button>
            </div>
          ) : (
            <>
              <div className="p-modal-icon-wrapper">
                <i className="fa-solid fa-crown"></i>
              </div>
              
              <h2>YDT Focus Elite</h2>
              <p>Akademik hedeflerine giden yolda tüm sınırları kaldır. Sınırsız AI gücü seni bekliyor.</p>
              
              <div className="p-plans-container">
                <div 
                  className={`p-plan-card ${selectedPlan === "monthly" ? "active" : ""}`}
                  onClick={() => setSelectedPlan("monthly")}
                >
                  <div className="p-plan-info">
                    <span className="p-plan-name">Aylık Focus</span>
                    <span className="p-plan-price">₺99</span>
                  </div>
                  <div className="p-plan-radio"></div>
                </div>

                <div 
                  className={`p-plan-card ${selectedPlan === "yearly" ? "active" : ""}`}
                  onClick={() => setSelectedPlan("yearly")}
                >
                  <div className="p-plan-badge">EN POPÜLER</div>
                  <div className="p-plan-info">
                    <span className="p-plan-name">Yıllık Focus</span>
                    <span className="p-plan-price">₺799</span>
                    <span className="p-plan-savings">₺389 Tasarruf Et</span>
                  </div>
                  <div className="p-plan-radio"></div>
                </div>
              </div>

              <div className="p-features-grid">
                <div className="p-f-item"><i className="fa-solid fa-bolt"></i> Sınırsız AI Metin</div>
                <div className="p-f-item"><i className="fa-solid fa-microchip"></i> İleri Analiz</div>
                <div className="p-f-item"><i className="fa-solid fa-shield-halved"></i> Reklamsız</div>
                <div className="p-f-item"><i className="fa-solid fa-medal"></i> Gold Profil</div>
              </div>

              <button 
                className="p-upgrade-main-btn" 
                onClick={handleUpgrade}
                disabled={isProcessing}
              >
                {isProcessing ? "Hazırlanıyor..." : "Hemen Başla"}
              </button>
              
              <p className="p-footer-note">Güvenli ödeme altyapısı PayTR ile korunmaktadır.</p>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .premium-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(10px);
          z-index: 50000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }
        .premium-modal-card {
          background: #1c1c1e;
          border: 1px solid var(--border);
          border-radius: 32px;
          width: 100%;
          max-width: 440px;
          max-height: 95vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .p-modal-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255,255,255,0.05);
          border: none;
          color: #888;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
          z-index: 10;
        }
        .p-modal-close:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }
        
        .p-modal-content {
          padding: 40px;
          text-align: center;
        }
        .p-modal-icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(226, 183, 20, 0.1);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: var(--accent);
          font-size: 2.5rem;
        }
        
        .p-modal-content h2 {
          font-size: 1.8rem;
          font-weight: 900;
          margin-bottom: 12px;
          color: #fff;
        }
        .p-modal-content p {
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 32px;
          font-size: 1rem;
        }
        
        .p-plans-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 32px;
        }
        .p-plan-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 2px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .p-plan-card.active {
          border-color: var(--accent);
          background: rgba(226, 183, 20, 0.05);
        }
        .p-plan-badge {
          position: absolute;
          top: -10px;
          right: 20px;
          background: var(--accent);
          color: #000;
          font-size: 0.65rem;
          font-weight: 900;
          padding: 4px 10px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .p-plan-info {
          display: flex;
          flex-direction: column;
          text-align: left;
          gap: 2px;
        }
        .p-plan-name {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-muted);
        }
        .p-plan-card.active .p-plan-name {
          color: #fff;
        }
        .p-plan-price {
          font-size: 1.4rem;
          font-weight: 900;
          color: #fff;
        }
        .p-plan-savings {
          font-size: 0.75rem;
          color: var(--accent);
          font-weight: 700;
        }
        .p-plan-radio {
          width: 24px;
          height: 24px;
          border: 2px solid var(--border);
          border-radius: 50%;
          position: relative;
        }
        .p-plan-card.active .p-plan-radio {
          border-color: var(--accent);
        }
        .p-plan-card.active .p-plan-radio::after {
          content: "";
          position: absolute;
          inset: 4px;
          background: var(--accent);
          border-radius: 50%;
        }

        .p-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 32px;
          text-align: left;
        }
        .p-f-item {
          font-size: 0.8rem;
          font-weight: 600;
          color: #bbb;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .p-f-item i {
          color: var(--accent);
          font-size: 0.85rem;
        }
        
        .p-upgrade-main-btn {
          width: 100%;
          background: var(--accent);
          color: #000;
          border: none;
          padding: 18px;
          border-radius: 16px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 10px 25px rgba(226, 183, 20, 0.2);
        }
        .p-upgrade-main-btn:hover {
          transform: translateY(-3px);
          filter: brightness(1.1);
        }
        
        .p-footer-note {
          margin-top: 20px;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Landscape/Small Height Fix */
        @media (max-height: 600px) {
          .p-modal-content { padding: 24px; }
          .p-modal-icon-wrapper { width: 48px; height: 48px; font-size: 1.5rem; margin-bottom: 12px; }
          .p-modal-content h2 { font-size: 1.4rem; }
          .p-modal-content p { margin-bottom: 16px; font-size: 0.9rem; }
          .p-plans-container { flex-direction: row; margin-bottom: 16px; }
          .p-plan-card { flex: 1; padding: 12px; }
          .p-plan-price { font-size: 1.1rem; }
          .p-features-grid { margin-bottom: 16px; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>,
    document.body
  );
}
