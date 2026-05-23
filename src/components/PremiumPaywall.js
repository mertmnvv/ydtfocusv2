"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function PremiumPaywall({ isOpen, onClose, onUpgrade }) {
  return null;

  const { userProfile, isPremium } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  if (!isOpen || isPremium) return null;

  return (
    <div className="paywall-overlay animate-fadeIn">
      <div className="paywall-container animate-slideUp">
        <button className="paywall-close-top" onClick={onClose}>
          <i className="fa-solid fa-xmark"></i>
        </button>

        <div className="paywall-header">
          <div className="paywall-badge">ELITE ACCESS</div>
          <h1>YDT Focus <span>Elite</span></h1>
          <p>Sınav hazırlığında yapay zeka gücünü serbest bırak.</p>
        </div>

        <div className="paywall-features">
          <div className="paywall-feature">
            <div className="pf-icon"><i className="fa-solid fa-wand-magic-sparkles"></i></div>
            <div className="pf-text">
              <strong>Sınırsız AI Metin Üretimi</strong>
              <span>Günde 3 limitine takılmadan dilediğin kadar çalış.</span>
            </div>
          </div>
          <div className="paywall-feature">
            <div className="pf-icon"><i className="fa-solid fa-brain"></i></div>
            <div className="pf-text">
              <strong>Kelime Bankası Hikayeleri</strong>
              <span>Kendi kelimelerinle AI destekli okuma metinleri oluştur.</span>
            </div>
          </div>
          <div className="paywall-feature">
            <div className="pf-icon"><i className="fa-solid fa-chart-pie"></i></div>
            <div className="pf-text">
              <strong>Gelişmiş Performans Analizi</strong>
              <span>Zayıf noktalarını ve gelişimini detaylı grafiklerle takip et.</span>
            </div>
          </div>
        </div>

        <div className="paywall-plans">
          <button 
            className={`paywall-plan ${selectedPlan === "monthly" ? "active" : ""}`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div className="plan-info">
              <span className="plan-name">Aylık Elite</span>
              <span className="plan-price">₺99 / ay</span>
            </div>
            {selectedPlan === "monthly" && <div className="plan-check"><i className="fa-solid fa-circle-check"></i></div>}
          </button>

          <button 
            className={`paywall-plan featured ${selectedPlan === "yearly" ? "active" : ""}`}
            onClick={() => setSelectedPlan("yearly")}
          >
            <div className="plan-badge">EN POPÜLER</div>
            <div className="plan-info">
              <span className="plan-name">Yıllık Elite</span>
              <span className="plan-price">₺799 / yıl</span>
              <span className="plan-save">%33 Tasarruf Et</span>
            </div>
            {selectedPlan === "yearly" && <div className="plan-check"><i className="fa-solid fa-circle-check"></i></div>}
          </button>
        </div>

        <div className="paywall-footer">
          <button className="paywall-cta" onClick={() => onUpgrade(selectedPlan)}>
            Elite Üyeliğe Başla
          </button>
          <button className="paywall-skip" onClick={onClose}>
            Ücretsiz Sürümle Devam Et
          </button>
          <p className="paywall-note">İstediğin zaman iptal edebilirsin.</p>
        </div>
      </div>

      <style jsx>{`
        .paywall-overlay {
          position: fixed;
          inset: 0;
          background: #000;
          z-index: 10000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .paywall-container {
          background: #1c1c1e;
          width: 100%;
          height: 100%;
          max-width: 500px;
          padding: 40px 24px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          position: relative;
          overflow-y: auto;
          background: linear-gradient(180deg, rgba(255, 214, 10, 0.05) 0%, rgba(28, 28, 30, 0) 40%);
        }

        .paywall-close-top {
          position: absolute;
          top: 24px;
          right: 24px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          color: #86868b;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          cursor: pointer;
        }

        .paywall-header {
          text-align: center;
          margin-top: 20px;
        }

        .paywall-badge {
          display: inline-block;
          background: rgba(255, 214, 10, 0.1);
          color: var(--accent);
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .paywall-header h1 {
          font-size: 2.2rem;
          font-weight: 900;
          margin: 0;
          color: #fff;
          letter-spacing: -1px;
        }

        .paywall-header h1 span {
          color: var(--accent);
        }

        .paywall-header p {
          color: #86868b;
          font-size: 1rem;
          margin-top: 8px;
        }

        .paywall-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .paywall-feature {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .pf-icon {
          width: 44px;
          height: 44px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: var(--accent);
        }

        .pf-text {
          display: flex;
          flex-direction: column;
        }

        .pf-text strong {
          color: #fff;
          font-size: 0.95rem;
        }

        .pf-text span {
          color: #86868b;
          font-size: 0.8rem;
          line-height: 1.4;
        }

        .paywall-plans {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .paywall-plan {
          background: rgba(255, 255, 255, 0.03);
          border: 2px solid transparent;
          padding: 16px 20px;
          border-radius: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          position: relative;
        }

        .paywall-plan.active {
          background: rgba(255, 214, 10, 0.05);
          border-color: var(--accent);
        }

        .paywall-plan.featured {
          background: rgba(255, 214, 10, 0.03);
        }

        .plan-info {
          display: flex;
          flex-direction: column;
        }

        .plan-name {
          color: #fff;
          font-weight: 700;
          font-size: 1rem;
        }

        .plan-price {
          color: #86868b;
          font-size: 0.9rem;
        }

        .plan-save {
          color: #30d158;
          font-size: 0.75rem;
          font-weight: 800;
        }

        .plan-badge {
          position: absolute;
          top: -10px;
          right: 20px;
          background: var(--accent);
          color: #000;
          font-size: 0.6rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .plan-check {
          color: var(--accent);
          font-size: 1.2rem;
        }

        .paywall-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: center;
        }

        .paywall-cta {
          background: var(--accent);
          color: #000;
          border: none;
          padding: 18px;
          border-radius: 18px;
          font-size: 1.1rem;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(255, 214, 10, 0.2);
        }

        .paywall-skip {
          background: transparent;
          border: none;
          color: #86868b;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .paywall-note {
          font-size: 0.7rem;
          color: #48484a;
        }

        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

        @media (min-width: 1024px) {
          .paywall-container {
            height: auto;
            border-radius: 32px;
            margin: auto;
            max-height: 90vh;
          }
          .paywall-overlay {
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            align-items: center;
          }
        }

        /* Landscape and Small Height Optimization */
        @media (max-height: 600px) {
          .paywall-container {
            padding: 20px;
            gap: 16px;
            justify-content: flex-start;
          }
          .paywall-header h1 {
            font-size: 1.5rem;
          }
          .paywall-features {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .paywall-feature {
            gap: 8px;
          }
          .pf-icon {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
          }
          .pf-text strong {
            font-size: 0.8rem;
          }
          .pf-text span {
            display: none; /* Hide description in tight height */
          }
          .paywall-plans {
            flex-direction: row;
          }
          .paywall-plan {
            flex: 1;
            padding: 10px;
          }
          .plan-name { font-size: 0.85rem; }
          .plan-price { font-size: 0.75rem; }
        }

        @media (max-height: 400px) {
           .paywall-header { display: none; }
           .paywall-features { display: none; }
        }
      `}</style>
    </div>
  );
}
