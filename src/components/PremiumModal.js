"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function PremiumModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="p-modal-close" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </div>
        
        <div className="p-modal-content">
          <div className="p-modal-icon-wrapper">
            <i className="fa-solid fa-rocket"></i>
          </div>
          
          <h2>Tam Sürümde Yakında!</h2>
          <p>
            Bu özellik şu anda geliştirme aşamasındadır. YDT Focus'un tam sürümüyle birlikte
            sınırsız yapay zeka özellikleri, akıllı çalışma planları ve çok daha fazlası aktif edilecektir.
          </p>
          
          <button 
            className="p-upgrade-main-btn" 
            onClick={onClose}
          >
            Anladım, Teşekkürler
          </button>
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
