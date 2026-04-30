"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="privacy-container">
      <div className="privacy-card">
        <Link href="/" className="back-link">
          <i className="fa-solid fa-arrow-left"></i> Ana Sayfaya Dön
        </Link>
        
        <h1>Gizlilik Politikası</h1>
        <p className="last-updated">Son Güncelleme: 30 Nisan 2026</p>

        <section>
          <h2>1. Giriş</h2>
          <p>
            YDT Focus ("biz", "bize" veya "bizim"), kullanıcılarımızın gizliliğine önem verir. Bu Gizlilik Politikası, 
            mobil uygulamamız ve web sitemiz aracılığıyla toplanan bilgilerin nasıl kullanıldığını açıklar.
          </p>
        </section>

        <section>
          <h2>2. Toplanan Bilgiler</h2>
          <p>
            Uygulamamızı kullandığınızda aşağıdaki bilgileri toplayabiliriz:
          </p>
          <ul>
            <li><strong>Hesap Bilgileri:</strong> Google ile giriş yaptığınızda adınız, e-posta adresiniz ve profil fotoğrafınız.</li>
            <li><strong>Kullanım Verileri:</strong> Çözdüğünüz sorular, kaydettiğiniz kelimeler ve uygulama içi ilerlemeniz.</li>
            <li><strong>Cihaz Bilgileri:</strong> Uygulama performansını iyileştirmek için kullanılan temel cihaz bilgileri.</li>
          </ul>
        </section>

        <section>
          <h2>3. Bilgilerin Kullanımı</h2>
          <p>
            Topladığımız bilgileri şu amaçlarla kullanırız:
          </p>
          <ul>
            <li>Uygulama deneyiminizi kişiselleştirmek.</li>
            <li>Akıllı tekrar (SRS) algoritması ile öğrenme sürecinizi yönetmek.</li>
            <li>Premium abonelik süreçlerini yönetmek.</li>
            <li>Yapay zeka özelliklerini (Gemini API) sunmak.</li>
          </ul>
        </section>

        <section>
          <h2>4. Üçüncü Taraf Hizmetler</h2>
          <p>
            YDT Focus, güvenilir üçüncü taraf hizmet sağlayıcıları kullanır:
          </p>
          <ul>
            <li><strong>Firebase:</strong> Veri saklama ve kimlik doğrulama için.</li>
            <li><strong>PayTR:</strong> Ödeme işlemleri için (Kart bilgileriniz bizim sunucularımızda saklanmaz).</li>
            <li><strong>Google Gemini API:</strong> Yapay zeka destekli metin analizleri için.</li>
          </ul>
        </section>

        <section>
          <h2>5. Veri Güvenliği</h2>
          <p>
            Verilerinizin güvenliğini sağlamak için endüstri standardı güvenlik önlemleri alıyoruz. Ancak internet 
            üzerinden yapılan hiçbir iletimin %100 güvenli olmadığını hatırlatmak isteriz.
          </p>
        </section>

        <section>
          <h2>6. Haklarınız</h2>
          <p>
            Dilediğiniz zaman hesabınızı silebilir veya verilerinizin kopyasını talep edebilirsiniz. Bu işlemler için 
            uygulama içinden bizimle iletişime geçebilirsiniz.
          </p>
        </section>

        <section>
          <h2>7. İletişim</h2>
          <p>
            Bu politika ile ilgili sorularınız için bizimle iletişime geçebilirsiniz:<br />
            <strong>E-posta:</strong> support@ydtfocus.xyz
          </p>
        </section>
      </div>

      <style jsx>{`
        .privacy-container {
          min-height: 100vh;
          background: #000;
          color: #fff;
          padding: 40px 20px;
          display: flex;
          justify-content: center;
        }

        .privacy-card {
          max-width: 800px;
          width: 100%;
          background: #1c1c1e;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 40px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
          margin-bottom: 32px;
          font-size: 0.9rem;
          transition: transform 0.2s;
        }

        .back-link:hover {
          transform: translateX(-5px);
        }

        h1 {
          font-size: 2.5rem;
          font-weight: 900;
          margin-bottom: 8px;
          letter-spacing: -1px;
        }

        .last-updated {
          color: #86868b;
          font-size: 0.9rem;
          margin-bottom: 40px;
        }

        section {
          margin-bottom: 32px;
        }

        h2 {
          font-size: 1.4rem;
          font-weight: 800;
          margin-bottom: 16px;
          color: var(--accent);
        }

        p, li {
          color: #e2e2e2;
          line-height: 1.7;
          font-size: 1.05rem;
        }

        ul {
          padding-left: 20px;
          margin-top: 12px;
        }

        li {
          margin-bottom: 8px;
        }

        @media (max-width: 480px) {
          .privacy-card {
            padding: 24px;
            border-radius: 24px;
          }
          h1 {
            font-size: 1.8rem;
          }
        }
      `}</style>
    </div>
  );
}
