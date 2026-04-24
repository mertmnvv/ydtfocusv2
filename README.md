# YDT Focus v2: Akademik Dil Ogrenme ve Sinav Hazirlik Platformu

YDT Focus v2, YDT (Yabanci Dil Testi), YOKDIL ve YDS gibi ileri duzey akademik Ingilizce sinavlarina hazirlanan ogrenciler icin tasarlanmis, yapay zeka destekli ve oyunlastirilmis bir egitim platformudur. Modern web teknolojileri ve bilissel ogrenme prensipleri uzerine insa edilen sistem, kullanicilara yuksek performansli ve odaklanmis bir calisma ortami sunar.

---

## Proje Vizyonu ve Temel Hedefler

Platformun ana amaci, akademik kelime dagarcigini gelistirmek, okudugunu anlama becerilerini artirmak ve sinav stratejilerini interaktif bir deneyimle pekistirmektir. Bu dogrultuda asagidaki temel hedefler gozetilmistir:

*   Akademik kelimelerin uzun sureli hafizada tutulmasi icin bilimsel tekrar algoritmalarinin kullanilmasi.
*   Yapay zeka yardimiyla kisisellestirilmis ve sinav formatina uygun icerik uretimi.
*   Dikkat dagitici unsurlardan arindirilmis, premium bir kullanici deneyimi.
*   Ogrencilerin gelisimlerini veriye dayali metriklerle anlik olarak takip edebilmesi.

---

## Teknik Altyapi ve Mimari

Proje, modern yazilim mimarisi standartlarina uygun olarak moduler ve olceklenebilir bir yapida gelistirilmistir.

### Kullanilan Teknolojiler

*   **Frontend Framework:** Next.js 16.2.4 (App Router ve Turbopack entegrasyonu).
*   **Kutuphane:** React 19.2.4 (Concurrent Rendering ve Server Components destegi).
*   **Backend Servisleri:** Firebase 12 (Authentication, Firestore ve Cloud Messaging).
*   **Yapay Zeka:** Groq Cloud API (Llama 3.1 8B/70B modelleri) ve Google Translate API proxy katmani.
*   **Stil Yonetimi:** Vanilla CSS (Custom Design System, Glassmorphism, Responsive Grid).
*   **Durum Yonetimi:** React Context API ve ozel hook mimarisi.

### Tasarım Sistemi (Design System)

Platform, "Apple-esque" bir estetik anlayisiyla, glassmorphism (cam efekti) ve derinlik hissi veren katmanli bir tasarim dilini benimser.

*   **Dinamik Tema:** Karanlik (Dark) ve Aydinlik (Light) mod destegi.
*   **Bento Grid:** Verilerin ve istatistiklerin mobil uyumlu, kutucuklu yapida sunumu.
*   **Mikro-Animasyonlar:** Yuksek kare hizina sahip CSS transition ve keyframe animasyonlari.
*   **Tipografi:** Okunabilirligi yuksek akademik odakli Inter font ailesi.

---

## Fonksiyonel Moduller

### 1. Akilli Dashboard ve Analitik
Kullanicinin gunluk kelime hedeflerini, calisma serisini (streak), seviye ilerlemesini ve ogrenilen kelime sayisini anlik olarak gosteren merkezi kontrol paneli.

### 2. Yapay Zeka Destekli Okuma (Reading)
Llama 3.1 modelleri kullanilarak CEFR seviyelerine gore uretilen akademik metinler. Metin icerisinde gecen akademik kelimelerin otomatik tespiti, uzerine tiklandiginda acilan analiz paneli ve AI tarafindan olusturulan anlama sorulari.

### 3. Aralikli Tekrar Sistemi (SRS)
Unutma egrisini minimize eden 5 kademeli (Level 0-4) tekrar algoritmasi. Kullanicinin dogru/yanlis yanitlarina gore kelimelerin bir sonraki gosterim zamanini otomatik olarak hesaplar.

### 4. Zero to Hero Kursu
A1 seviyesinden C1 seviyesine kadar yapilandirilmis, ogrenciyi kademe kademe ileri tasiyan oyunlastirilmis egitim yolu.

### 5. Linefocus (Odakli Okuma)
Typing (yazim) tabanli, mekanik klavye ses efektleri ve karakter bazli animasyonlarla zenginlestirilmis, metne derinlemesine odaklanmayi saglayan ozel modül.

### 6. Quiz ve Test Merkezi
Sözlük, Phrasal Verbs, Hatalar ve Akilli Tekrar gibi farkli veri setleri uzerinden calisabilen cok modlu test sistemi.

### 7. Gelismis Admin Paneli
Icerik yoneticileri icin kelime ekleme/duzenleme (CRUD), gramer konulari yonetimi, kullanici yetkilendirme ve toplu veri yukleme (seeding) araclarini iceren yonetim merkezi.

---

## Kurulum ve Yapilandirma

### Gereksinimler
*   Node.js 18.x veya uzeri
*   Firebase Projesi (Auth ve Firestore etkinlestirilmis)
*   Groq Cloud API Key

### Adimlar

1.  Proje dizinine gidin ve bagimliliklari yukleyin:
    ```bash
    npm install
    ```

2.  Kok dizinde `.env.local` dosyasi olusturarak asagidaki degiskenleri tanimlayin:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    GROQ_API_KEY=your_groq_key
    ```

3.  Gelistirme sunucusunu baslatin:
    ```bash
    npm run dev
    ```

---

## Veri Modeli ve Guvenlik

Firestore uzerinde veriler hiyerarşik bir yapida tutulur:
*   `users/{uid}`: Kullanici profili ve rol bilgileri.
*   `users/{uid}/words`: Kullaniciya ozel kelime bankasi ve SRS verileri.
*   `archive`: Genel akademik sozluk veritabani.
*   `grammarTopics`: Gramer ve sinav taktikleri icerigi.

Guvenlik, Firebase Authentication ve Firestore Security Rules katmanlariyla saglanmaktadir.

---

## Gelistirici Notu

Bu proje, dil ogrenme surecini daha verimli, olculebilir ve keyifli hale getirmek amaciyla Mert tarafindan gelistirilmistir. Her bir bilesen, ogrenci performansini maksimize etmek icin ozenle optimize edilmistir.
