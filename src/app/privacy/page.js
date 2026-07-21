"use client";

import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="legal-card">
        <Link href="/" className="legal-back">← Ana Sayfaya Dön</Link>

        <h1>Gizlilik Politikası</h1>
        <p className="legal-updated">Son Güncelleme: 30 Nisan 2026</p>

        <section>
          <h2>1. Giriş</h2>
          <p>
            YDT Focus ("biz", "bize" veya "bizim"), kullanıcılarımızın gizliliğine önem verir. Bu Gizlilik Politikası,
            mobil uygulamamız ve web sitemiz aracılığıyla toplanan bilgilerin nasıl kullanıldığını açıklar.
          </p>
        </section>

        <section>
          <h2>2. Toplanan Bilgiler</h2>
          <p>Uygulamamızı kullandığınızda aşağıdaki bilgileri toplayabiliriz:</p>
          <ul>
            <li><strong>Hesap Bilgileri:</strong> Google ile giriş yaptığınızda adınız, e-posta adresiniz ve profil fotoğrafınız.</li>
            <li><strong>Kullanım Verileri:</strong> Çözdüğünüz sorular, kaydettiğiniz kelimeler ve uygulama içi ilerlemeniz.</li>
            <li><strong>Cihaz Bilgileri:</strong> Uygulama performansını iyileştirmek için kullanılan temel cihaz bilgileri.</li>
          </ul>
        </section>

        <section>
          <h2>3. Bilgilerin Kullanımı</h2>
          <p>Topladığımız bilgileri şu amaçlarla kullanırız:</p>
          <ul>
            <li>Uygulama deneyiminizi kişiselleştirmek.</li>
            <li>Akıllı tekrar (SRS) algoritması ile öğrenme sürecinizi yönetmek.</li>
            <li>Premium abonelik süreçlerini yönetmek.</li>
            <li>Yapay zeka özelliklerini (Gemini API) sunmak.</li>
          </ul>
        </section>

        <section>
          <h2>4. Üçüncü Taraf Hizmetler</h2>
          <p>YDT Focus, güvenilir üçüncü taraf hizmet sağlayıcıları kullanır:</p>
          <ul>
            <li><strong>Firebase:</strong> Veri saklama ve kimlik doğrulama için.</li>
            <li><strong>PayTR:</strong> Ödeme işlemleri için (kart bilgileriniz bizim sunucularımızda saklanmaz).</li>
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
        .legal-page {
          min-height: 100dvh;
          background: var(--bg);
          padding: 60px 20px;
          display: flex;
          justify-content: center;
        }
        .legal-card {
          max-width: 720px;
          width: 100%;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 40px;
        }
        .legal-back {
          display: inline-block;
          color: var(--accent);
          text-decoration: none;
          font-weight: 700;
          font-size: 0.85rem;
          margin-bottom: 32px;
        }
        .legal-back:hover { text-decoration: underline; }
        h1 { font-size: 2rem; font-weight: 900; margin-bottom: 6px; letter-spacing: -1px; color: var(--text); }
        .legal-updated { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 36px; }
        section { margin-bottom: 28px; }
        h2 { font-size: 1.1rem; font-weight: 800; margin-bottom: 12px; color: var(--accent); }
        p, li { color: var(--text); line-height: 1.7; font-size: 0.95rem; }
        ul { padding-left: 20px; margin-top: 10px; }
        li { margin-bottom: 8px; }
        @media (max-width: 480px) {
          .legal-card { padding: 24px; border-radius: 20px; }
          h1 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
