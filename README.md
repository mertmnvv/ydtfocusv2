# YDT Focus: Akademik Dil Öğrenme ve Sınav Hazırlık Platformu

YDT Focus; YDT (Yabancı Dil Testi), YÖKDİL ve YDS gibi ileri düzey akademik İngilizce sınavlarına hazırlanan öğrenciler için tasarlanmış, yapay zeka destekli ve oyunlaştırılmış bir eğitim ekosistemidir. Modern web teknolojileri ve bilişsel öğrenme prensipleri üzerine inşa edilen sistem, kullanıcılara yüksek performanslı, dikkati dağıtmayan ve premium bir çalışma deneyimi sunar.

---

## Proje Vizyonu ve Temel Hedefler

Platformun ana amacı, akademik kelime dağarcığını geliştirmek, okuduğunu anlama becerilerini artırmak ve sınav stratejilerini interaktif bir deneyimle pekiştirmektir. Bu doğrultuda aşağıdaki temel hedefler gözetilmiştir:

*   **Sıfır Sürtünme:** Kelime arama, seslendirme ve metin analizi süreçlerinde kesintisiz bir akış.
*   **Akademik Derinlik:** Sadece basit kelimeler değil, sınav standartlarında (B2-C1) kompleks yapılarla çalışma.
*   **Odaklanmış Tasarım:** Emoji ve karmaşık unsurlardan arındırılmış, profesyonel Glassmorphism UI.
*   **Veriye Dayalı İlerleme:** SRS (Aralıklı Tekrar) ve detaylı analitik paneli ile gelişim takibi.

---

## Son Güncellemeler ve İnovasyonlar 🚀

### 🧠 AI-Native Sözlük & Çeviri Motoru
Geleneksel sözlük servislerinin (404 hatası veren dış API'lar) yerini alan, tamamen AI tabanlı yeni nesil sözlük sistemi. 
- **Sıfır Hata:** Hiçbir kelime cevapsız kalmaz; en temelden en akademiğe tüm terimler AI tarafından anında analiz edilir.
- **Seri Arama:** Sözlük paneli içindeki yeni arama barı ile paneli kapatmadan arka arkaya kelime aratabilme.

### 📝 YDT Pro Metin Mühendisliği
Okuma metni üretim algoritması "Academic Journal" (The Economist, Nature) seviyesine yükseltildi.
- **Kompleks Sözdizimi:** Basit cümleler yerine yan cümlecikli, edilgen çatılı ve akademik bağlaçlarla örülmüş zengin pasajlar.
- **Mantıksal Akış (Cohesion):** Cümleler arası kusursuz geçişler ve profesyonel argüman yapıları.

### 🌓 LineFocus Aydınlık Mod & UI
- **Premium Light Mode:** Apple standartlarında, ferah ve okunabilirliği yüksek (`#f2f2f7`) aydınlık tema desteği.
- **ID Filtreleme:** Kelime bankasından teknik verilerin sızmasını engelleyen zeki veri temizleme algoritması.

---

## Fonksiyonel Modüller

### 1. Akıllı Dashboard ve Analitik
Kullanıcının günlük kelime hedeflerini, çalışma serisini (streak), seviye ilerlemesini ve öğrenilen kelime sayısını anlık olarak gösteren merkezi kontrol paneli.

### 2. Focus AI (Yapay Zeka Asistanı)
Öğrencinin tüm süreç boyunca yanında olan uzman bir hoca. Kelime analizi yapar, metinleri açıklar, hatalar üzerinden pratik yaptırır ve kullanıcıya özel çalışma rotası belirler.

### 3. SmartStream Reading (Yapay Zeka Destekli Okuma)
Llama 3.1 modelleri kullanılarak üretilen akademik metinler. Metin içerisinde geçen akademik kelimelerin otomatik tespiti ve Amerikan aksanlı (Google US English) premium seslendirme desteği.

### 4. Aralıklı Tekrar Sistemi (SRS)
Unutma eğrisini minimize eden 5 kademeli (Level 0-4) tekrar algoritması. Kullanıcının doğru/yanlış yanıtlarına göre kelimelerin bir sonraki gösterim zamanını otomatik olarak hesaplar.

### 5. Linefocus (Odaklı Yazım)
Yazım (typing) tabanlı, mekanik klavye ses efektleri ve karakter bazlı animasyonlarla zenginleştirilmiş, metne derinlemesine odaklanmayı sağlayan özel çalışma modülü.

### 6. Topluluk ve Sıralama
Kullanıcıların çalışma performanslarına göre birbirleriyle yarıştığı, Premium ve Admin rollerinin özel ikonlarla belirtildiği sosyal katman.

---

## Teknik Altyapı ve Mimari

*   **Frontend:** Next.js 14 (App Router), React 18, Vanilla CSS.
*   **Backend:** Firebase (Auth, Firestore).
*   **Yapay Zeka:** Groq Cloud API (Llama 3.1 8b/70b).
*   **PWA:** Progressive Web App desteği ile tüm cihazlara uygulama olarak kurulabilir.

---

## Kurulum ve Yapılandırma

### Adımlar
1. Bağımlılıkları yükleyin: `npm install`
2. `.env.local` dosyasına Firebase ve Groq anahtarlarınızı ekleyin.
3. Başlatın: `npm run dev`

---

## Geliştirici Notu
Bu proje, dil öğrenme sürecini daha verimli, ölçülebilir ve keyifli hale getirmek amacıyla **Mert** tarafından geliştirilmiştir. Hazırlanma, Odaklan. Başarı sadece bir çıktı.
