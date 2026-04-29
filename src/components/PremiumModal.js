"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function PremiumModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!isOpen) setShowComingSoon(false);
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-card" onClick={(e) => e.stopPropagation()}>
        {!showComingSoon ? (
          <>
            <div className="p-modal-close" onClick={onClose}>
              <i className="fa-solid fa-xmark"></i>
            </div>
            
            <div className="p-modal-content">
              <div className="p-modal-icon-wrapper">
                <i className="fa-solid fa-crown"></i>
              </div>
              
              <h2>YDT Focus Premium</h2>
              <p>Hedeflerine daha hızlı ulaşmak için gücüne güç kat. Premium ile sınırları kaldır.</p>
              
              <div className="p-features-list">
                <div className="p-feature-item">
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Gelişmiş AI Hazırlık Koçu</span>
                </div>
                <div className="p-feature-item">
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Sınırsız Sosyal Hub & Mesajlaşma</span>
                </div>
                <div className="p-feature-item">
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Kişiselleştirilmiş Çalışma Analizi</span>
                </div>
                <div className="p-feature-item">
                  <i className="fa-solid fa-check-circle"></i>
                  <span>Reklamsız ve Kesintisiz Deneyim</span>
                </div>
              </div>

              <button className="p-upgrade-main-btn" onClick={() => setShowComingSoon(true)}>
                Şimdi Yükselt
              </button>
              
              <p className="p-footer-note">İstediğin zaman iptal edebilirsin.</p>
            </div>
          </>
        ) : (
          <div className="p-coming-soon">
            <i className="fa-solid fa-rocket"></i>
            <h2>Çok Yakında!</h2>
            <p>Ödeme sistemimiz şu an entegrasyon aşamasında. Çok kısa süre içinde Premium avantajlarından faydalanabileceksin.</p>
            <button className="p-back-btn" onClick={onClose}>Tamamdır!</button>
          </div>
        )}
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
          position: relative;
          overflow: hidden;
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
        
        .p-features-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
          text-align: left;
        }
        .p-feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #fff;
          font-weight: 600;
          font-size: 0.95rem;
        }
        .p-feature-item i {
          color: var(--accent);
          font-size: 1.1rem;
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
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }
        
        .p-coming-soon {
          padding: 50px 30px;
          text-align: center;
        }
        .p-coming-soon i {
          font-size: 3rem;
          color: var(--accent);
          margin-bottom: 20px;
        }
        .p-back-btn {
          margin-top: 24px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
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
