# YDT Focus: Akademik Dil Öğrenme ve Sınav Hazırlık Platformu

YDT Focus; YDT (Yabancı Dil Testi), YÖKDİL ve YDS gibi ileri düzey akademik İngilizce sınavlarına hazırlanan öğrenciler için tasarlanmış, yapay zeka destekli ve oyunlaştırılmış bir eğitim ekosistemidir. Modern web teknolojileri ve bilişsel öğrenme prensipleri üzerine inşa edilen sistem, kullanıcılara yüksek performanslı, dikkati dağıtmayan ve premium bir çalışma deneyimi sunar.

---

## Proje Vizyonu ve Temel Hedefler

Platformun ana amacı, akademik kelime dağarcığını geliştirmek, okuduğunu anlama becerilerini artırmak ve sınav stratejilerini interaktif bir deneyimle pekiştirmektir. Bu doğrultuda aşağıdaki temel hedefler gözetilmiştir:

*   Akademik kelimelerin uzun süreli hafızada tutulması için aralıklı tekrar (SRS) algoritmalarının kullanılması.
*   Yapay zeka yardımıyla kişiselleştirilmiş ve sınav formatına uygun okuma metni üretimi.
*   Emoji ve karmaşık unsurlardan arındırılmış, profesyonel ve odaklanmış kullanıcı arayüzü.
*   Öğrencilerin gelişimlerini veriye dayalı metriklerle ve topluluk sıralamasıyla anlık olarak takip edebilmesi.

---

## Teknik Altyapı ve Mimari

Proje, modern yazılım mimarisi standartlarına uygun olarak modüler, ölçeklenebilir ve performans odaklı bir yapıda geliştirilmiştir.

### Kullanılan Teknolojiler

*   **Frontend Framework:** Next.js (App Router ve Turbopack entegrasyonu).
*   **Kütüphane:** React (Concurrent Rendering ve Server Components desteği).
*   **Backend Servisleri:** Firebase (Authentication, Firestore ve Cloud Messaging).
*   **Yapay Zeka:** Groq Cloud API (Llama 3.1 modelleri) üzerinden sağlanan Focus AI asistanı.
*   **Stil Yönetimi:** Vanilla CSS (Özel Tasarım Sistemi, Glassmorphism, Responsive Grid).
*   **Durum Yönetimi:** React Context API ve özel hook mimarisi.

### Tasarım Sistemi (Design System)

Platform, premium bir estetik anlayışıyla, glassmorphism (cam efekti) ve derinlik hissi veren katmanlı bir tasarım dilini benimser.

*   **Dinamik Tema:** Karanlık (Dark) ve Aydınlık (Light) mod desteği.
*   **Bento Grid:** Verilerin ve istatistiklerin mobil uyumlu, kutucuklu yapıda sunumu.
*   **Mikro-Animasyonlar:** Yüksek kare hızına sahip CSS transition ve keyframe animasyonları.
*   **Tipografi:** Okunabilirliği yüksek, akademik odaklı Inter font ailesi.

---

## Fonksiyonel Modüller

### 1. Akıllı Dashboard ve Analitik
Kullanıcının günlük kelime hedeflerini, çalışma serisini (streak), seviye ilerlemesini ve öğrenilen kelime sayısını anlık olarak gösteren merkezi kontrol paneli.

### 2. Focus AI (Yapay Zeka Asistanı)
Öğrencinin tüm süreç boyunca yanında olan uzman bir hoca. Kelime analizi yapar, metinleri açıklar, hatalar üzerinden pratik yaptırır ve kullanıcıya özel çalışma rotası belirler.

### 3. Yapay Zeka Destekli Okuma (Reading)
Llama 3.1 modelleri kullanılarak CEFR seviyelerine göre üretilen akademik metinler. Metin içerisinde geçen akademik kelimelerin otomatik tespiti ve AI tarafından oluşturulan anlama soruları.

### 4. Aralıklı Tekrar Sistemi (SRS)
Unutma eğrisini minimize eden 5 kademeli (Level 0-4) tekrar algoritması. Kullanıcının doğru/yanlış yanıtlarına göre kelimelerin bir sonraki gösterim zamanını otomatik olarak hesaplar.

### 5. Linefocus (Odaklı Okuma)
Yazım (typing) tabanlı, mekanik klavye ses efektleri ve karakter bazlı animasyonlarla zenginleştirilmiş, metne derinlemesine odaklanmayı sağlayan özel çalışma modülü.

### 6. Topluluk ve Sıralama
Kullanıcıların çalışma performanslarına göre (Seri, Haftalık Vakit, Kelime Sayısı) birbirleriyle yarıştığı, Premium ve Admin rollerinin özel ikonlarla (Taç ve Kalkan) belirtildiği sosyal katman.

### 7. Gelişmiş Mesajlaşma ve Sosyal Paylaşım
Arkadaşlık sistemi, anlık mesajlaşma ve metin/soru paylaşımını destekleyen ChatHub merkezi. Kullanıcılar birbirlerinin profillerini detaylı olarak inceleyebilir ve soru çözümü için yardımlaşabilir.

---

## Kurulum ve Yapılandırma

### Gereksinimler
*   Node.js 18.x veya üzeri
*   Firebase Projesi (Auth ve Firestore etkinleştirilmiş)
*   Groq Cloud API Key

### Adımlar

1.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```

2.  `.env.local` dosyası oluşturarak Firebase ve AI API anahtarlarınızı tanımlayın.

3.  Geliştirme sunucusunu başlatın:
    ```bash
    npm run dev
    ```

---

## Veri Modeli ve Güvenlik

Firestore üzerinde veriler hiyerarşik bir yapıda tutulur:
*   `users/{uid}`: Kullanıcı profili, rol bilgileri (Standart, Premium, Admin) ve sosyal veriler.
*   `users/{uid}/words`: Kullanıcıya özel kelime bankası ve SRS verileri.
*   `archive`: Genel akademik sözlük veritabanı.
*   `grammarTopics`: Gramer ve sınav taktikleri içeriği.

Güvenlik, Firebase Authentication ve Firestore Security Rules katmanlarıyla en üst düzeyde sağlanmaktadır.

---

## Geliştirici Notu

Bu proje, dil öğrenme sürecini daha verimli, ölçülebilir ve keyifli hale getirmek amacıyla Mert tarafından geliştirilmiştir. Her bir bileşen, öğrenci performansını maksimize etmek için özenle optimize edilmiştir.
