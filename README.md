# YDT Focus: Akademik Dil Öğrenme ve Sınav Hazırlık Platformu

YDT Focus; YDT (Yabancı Dil Testi), YÖKDİL ve YDS gibi ileri düzey akademik İngilizce sınavlarına hazırlanan öğrenciler için tasarlanmış, yapay zeka destekli bir eğitim ekosistemidir. Modern web teknolojileri ve bilişsel öğrenme prensipleri üzerine inşa edilen sistem, kullanıcılara yüksek performanslı, dikkati dağıtmayan ve premium bir çalışma deneyimi sunar.

---

## Proje Vizyonu ve Temel Hedefler

Platformun ana amacı, akademik kelime dağarcığını geliştirmek, okuduğunu anlama becerilerini artırmak ve sınav stratejilerini interaktif bir deneyimle pekiştirmektir. Bu doğrultuda aşağıdaki temel hedefler gözetilmiştir:

*   **Sıfır Sürtünme:** Kelime arama, seslendirme ve metin analizi süreçlerinde kesintisiz bir akış.
*   **Akademik Derinlik:** Sadece basit kelimeler değil, sınav standartlarında (B2-C1) kompleks yapılarla çalışma.
*   **Odaklanmış Tasarım:** Karmaşık unsurlardan arındırılmış, profesyonel Glassmorphism UI.
*   **Veriye Dayalı İlerleme:** SRS (Aralıklı Tekrar) ve detaylı analitik paneli ile gelişim takibi.

---

## Son Güncellemeler ve İnovasyonlar

### SmartStream Reading v2 & Dinamik Gramer
Okuma modülü, statik yapılardan arınarak tamamen dinamik bir yapıya kavuşturuldu.
- **Context-Aware Gramer:** Her metin için yapay zeka tarafından o an üretilen, bağlama özel gramer açıklamaları. Statik veritabanı yerine metnin ruhuna uygun analizler.
- **Modern Animasyonlar:** Kart dönüşlerinde "yukarıdan aşağı" yerine daha modern ve akıcı olan "sağdan sola" (`rotateY`) flip animasyonları.
- **Tam Mobil Optimizasyon:** Okuma paneli, mobilde dikey akışa (stacked) uyumlu, kart bazlı bir yapıya dönüştürüldü.

### Mobil Navigasyon ve Deneyim (Botbar)
Masaüstü ve mobil deneyimi birbirinden ayıran, modern bir navigasyon mimarisi kuruldu.
- **MobileBotBar:** Uygulamayı bir mobil uygulama (Native App) hissiyatına kavuşturan, parmak ucunda erişilebilir navigasyon barı.
- **Hızlı Erişim:** İstatistikler, Okuma, Quiz, Kelime Kartları ve Rozetler arasında tek dokunuşla geçiş.

### Oyunlaştırma ve Rozet (Achievements) Sistemi
Öğrencinin motivasyonunu ve sürekliliğini ödüllendiren kapsamlı bir rozet ekosistemi.
- **Kategorik Rozetler:** Çalışma serisi (Streak), bilinen kelime sayısı, okunan metin adedi gibi 30'dan fazla farklı başarı kriteri.
- **Görsel Başarılar:** Kullanıcı profilinde sergilenen şık ikonlar ve özel Elite rozetleri.

### Bütünleşik Liderlik ve Analitik
Sıralama sistemi, Dashboard'un kalbine entegre edildi.
- **Çoklu Kategoriler:** Sadece doğru sayısı değil; Haftalık Vakit, Seri, Günlük İlerleme gibi 5 farklı kategoride rekabet imkanı.
- **Dashboard Entegrasyonu:** Liderlik tablosu artık profilin (Dashboard) en altında, istatistiklerle bir bütün halinde sunuluyor.

---

## Fonksiyonel Modüller

### 1. Akıllı Dashboard ve Analitik
Günlük kelime hedeflerini, çalışma serisini ve seviye ilerlemesini gösteren, Glassmorphism butonlarla zenginleştirilmiş merkezi kontrol paneli.

### 2. Focus AI (Yapay Zeka Asistanı)
Öğrenim süreci boyunca rehberlik eden uzman sistem. Kelime analizi yapar, metinleri açıklar ve kullanıcıya özel çalışma rotası belirler.

### 3. SmartStream Reading (Yapay Zeka Destekli Okuma)
CEFR seviyelerine göre üretilen akademik metinler, otomatik kelime tespiti ve Amerikan aksanlı seslendirme desteği.

### 4. Aralıklı Tekrar Sistemi (SRS)
Unutma eğrisini minimize eden 5 kademeli tekrar algoritması. Kelimelerin bir sonraki gösterim zamanını otomatik olarak hesaplar.

---

## Elite (Premium) Üyelik Modeli

YDT Focus, sürdürülebilir bir yapay zeka deneyimi sunmak için katmanlı bir üyelik yapısı kullanır:

### Elite Üye Özellikleri
- **Sınırsız AI Metin Üretimi:** Limitlere takılmadan sınırsız çalışma.
- **İleri Analizler:** Hatalardan kişiselleştirilmiş metin üretme önceliği.
- **Gold Profil:** Sıralama ve sosyal alanlarda özel Elite rozeti ve Gold görünüm.
- **Reklamsız Deneyim:** Tamamen odaklanmış çalışma ortamı.

Ödemeler, Türkiye'nin güvenli ödeme altyapısı **PayTR** üzerinden 256-bit SSL korumasıyla gerçekleştirilir.

---

## Teknik Altyapı ve Mimari

*   **Frontend:** Next.js 14 (App Router), React 18, Vanilla CSS.
*   **Backend:** Firebase (Auth, Firestore).
*   **Yapay Zeka:** Groq Cloud API (Llama 3.1 & 3.2 modelleri).
*   **PWA:** Tüm cihazlara uygulama olarak kurulabilen Progressive Web App desteği.

---

## Kurulum ve Yapılandırma

### Adımlar
1. Bağımlılıkları yükleyin: `npm install`
2. `.env.local` dosyasına gerekli API anahtarlarınızı ekleyin.
3. Projeyi başlatın: `npm run dev`

---

## Geliştirici Notu
Bu proje, dil öğrenme sürecini daha verimli ve ölçülebilir hale getirmek amacıyla Mert tarafından geliştirilmiştir.
