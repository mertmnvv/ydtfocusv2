"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const onboardingSteps = [
  {
    id: "welcome",
    title: 'ydt<span>focus</span>',
    desc: "Sınav hazırlık sürecini bir üst seviyeye taşıyoruz. Bilimsel metotlar ve yapay zeka desteğiyle hedeflerine ulaşman için buradayız.",
    icon: "fa-rocket",
    color: "var(--accent)"
  },
  {
    id: "pwa",
    title: "Focus'u Uygulama Yap",
    desc: "YDT Focus bir web uygulamasından fazlasıdır! Tarayıcı ayarlarından 'Uygulama Olarak Yükle' veya 'Ana Ekrana Ekle' diyerek masaüstü veya mobil cihazına tam ekran uygulama olarak kurabilirsin.",
    icon: "fa-mobile-screen-button",
    color: "#ff375f"
  },
  {
    id: "dashboard",
    title: "Level Up: Performans Merkezi",
    desc: "Çalışma disiplinini verilerle yönet. Günlük streak, aktif çalışma süresi ve gelişim grafiklerini takip et; profiline buradan ulaş.",
    icon: "fa-user-astronaut",
    color: "#30d158"
  },
  {
    id: "srs",
    title: "Akıllı Tekrar (SRS)",
    desc: "Unutma eğrisini minimize eden özel algoritma! Kelimeleri doğru zamanlarda tekrar ederek kalıcı hafızaya aktar.",
    icon: "fa-clock-rotate-left",
    color: "#5856d6"
  },
  {
    id: "reading",
    title: "Reading: Bağlamsal Öğrenme",
    desc: "Akademik metinleri derinlemesine analiz et. Kelimelerin üzerine dokunarak anlamlarını öğren ve doğrudan kelime bankana aktar.",
    icon: "fa-book-open",
    color: "#0a84ff"
  },
  {
    id: "quiz",
    title: "Quiz: Aktif Hatırlama",
    desc: "Öğrenilen kelimeleri farklı sınav modlarıyla test et. Flashcard'lar ile pratik yaparak bilgilerini pekiştir.",
    icon: "fa-bolt",
    color: "#ff9f0a"
  },
  {
    id: "mistakes",
    title: "Hatalarım: Analiz ve Gelişim",
    desc: "Hata yapmak öğrenmenin bir parçasıdır. Yanlış cevapladığın kelimeleri burada biriktir ve zayıf noktalarını güce dönüştür.",
    icon: "fa-circle-xmark",
    color: "#ff453a"
  },
  {
    id: "archive",
    title: "Sözlük: Akademik Kütüphane",
    desc: "Binlerce kelime ve Phrasal Verb içeren devasa veri tabanında keşfe çık. Her kelime bir adım daha başarı demek.",
    icon: "fa-language",
    color: "#5e5ce6"
  },
  {
    id: "hero",
    title: "Zero to Hero: Gelişim Yolu",
    desc: "A1'den C1'e uzanan oyunlaştırılmış müfredat. Seviye atla, hedeflerini tamamla ve akademik dil becerini kanıtla.",
    icon: "fa-arrow-trend-up",
    color: "#bf5af2"
  },
  {
    id: "linefocus",
    title: "Linefocus: Derin Odaklanma",
    desc: "Mekanik klavye hissiyle sadece metne odaklan. Yazarak çalışma metoduyla dikkati en üst seviyeye çıkar.",
    icon: "fa-keyboard",
    color: "#ff375f"
  },
  {
    id: "focus-ai",
    title: "Focus AI: Senin Mentörün",
    desc: "Sınav uzmanı yapay zeka asistanın! Gramer analizi, metin yorumlama ve kişiselleştirilmiş içerik üretimi için her an seninle.",
    icon: "fa-wand-magic-sparkles",
    color: "var(--accent)"
  }
];

export default function Onboarding() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (user) {
      const hasSeen = localStorage.getItem(`onboarding_seen_${user.uid}`);
      if (!hasSeen) {
        setIsVisible(true);
      }
    }
  }, [user]);

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    if (user) {
      localStorage.setItem(`onboarding_seen_${user.uid}`, "true");
    }
  };

  if (!isVisible) return null;

  const currentStep = onboardingSteps[step];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card animate-pop">
        <div className="onboarding-header">
          <div className="onboarding-progress">
            {onboardingSteps.map((_, i) => (
              <div 
                key={i} 
                className={`progress-dot ${i <= step ? "active" : ""}`}
                style={{ backgroundColor: i <= step ? currentStep.color : "" }}
              />
            ))}
          </div>
          <button className="onboarding-skip" onClick={handleComplete}>Atla</button>
        </div>

        <div className="onboarding-content">
          <div className="onboarding-icon" style={{ color: currentStep.color, backgroundColor: `${currentStep.color}15` }}>
            <i className={`fa-solid ${currentStep.icon}`}></i>
          </div>
          <h2 dangerouslySetInnerHTML={{ __html: currentStep.title }}></h2>
          <p>{currentStep.desc}</p>
        </div>

        <div className="onboarding-footer">
          <button 
            className="onboarding-next" 
            onClick={handleNext}
            style={{ backgroundColor: currentStep.color }}
          >
            {step === onboardingSteps.length - 1 ? "Hadi Başlayalım!" : "Devam Et"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .onboarding-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .onboarding-card {
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          width: 100%;
          max-width: 420px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
        }

        .onboarding-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .onboarding-progress {
          display: flex;
          gap: 6px;
        }

        .progress-dot {
          width: 24px;
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          transition: all 0.4s;
        }

        .progress-dot.active {
          transform: scaleX(1.1);
        }

        .onboarding-skip {
          background: transparent;
          border: none;
          color: #86868b;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
        }

        .onboarding-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .onboarding-icon {
          width: 80px;
          height: 80px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          margin-bottom: 8px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .onboarding-content h2 {
          font-size: 2.2rem;
          font-weight: 900;
          margin: 0;
          color: #fff;
          letter-spacing: -1px;
        }

        .onboarding-content h2 :global(span) {
          color: var(--accent);
        }

        .onboarding-content p {
          font-size: 1rem;
          color: #86868b;
          line-height: 1.6;
          margin: 0;
        }

        .onboarding-footer {
          width: 100%;
        }

        .onboarding-next {
          width: 100%;
          border: none;
          padding: 16px;
          border-radius: 16px;
          color: #000;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .onboarding-next:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        .animate-pop {
          animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes pop {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
