# 🚀 YDT Focus — Modern Dil Öğrenme Platformu

YDT Focus, Yabancı Dil Testi (YDT) ve diğer akademik İngilizce sınavlarına (YÖKDİL, YDS) hazırlanan öğrenciler için tasarlanmış, **AI destekli** ve **gamified (oyunlaştırılmış)** bir öğrenme platformudur.

![YDT Focus Banner](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-v10-orange?style=for-the-badge&logo=firebase)
![AI](https://img.shields.io/badge/Groq_AI-Llama_3.1-blue?style=for-the-badge&logo=ai)

---

## ✨ Öne Çıkan Özellikler

### 📖 AI Destekli Okuma & Analiz
- **Otomatik Metin Üretimi:** CEFR seviyelerine göre (A2-C1) akademik metinler üretin.
- **Floating Word Sheet:** Metin içinde tıkladığınız her kelimenin anlamını ve eş anlamlılarını anında görün.
- **Akademik Kelime Takibi:** YDT'de en çok çıkan 500+ akademik kelime metin içinde otomatik vurgulanır.
- **Anlık Quiz:** Okuduğunuz metne özel, yapay zeka tarafından hazırlanan 3 soruluk anlama testlerini çözün.

### 🎮 Zero to Hero (Oyunlaştırılmış Yol Haritası)
- Sıfırdan zirveye giden, seviye bazlı interaktif öğrenme yolu.
- Sürükle-bırak (drag-and-drop) kelime eşleştirme oyunları.
- Gelişim takibi ve başarı rozetleri.

### 🧠 Akıllı Kelime Bankası
- **Spaced Repetition (Aralıklı Tekrar):** Öğrendiğiniz kelimeleri unutmamak için optimize edilmiş quiz sistemi.
- **Hatalarım Paneli:** Yanlış yaptığınız kelimeleri otomatik olarak filtreleyin ve onlara odaklanın.

### 🔍 LineFocus Modu
- Cümle cümle odaklanarak okuma yapmanızı sağlayan, dikkat dağıtıcı unsurlardan arındırılmış özel okuma modülü.

---

## 🛠️ Teknoloji Yığını

- **Framework:** [Next.js 14 (App Router)](https://nextjs.org/)
- **Database & Auth:** [Firebase Firestore & Authentication](https://firebase.google.com/)
- **AI Engine:** [Groq Cloud (Llama-3.1-8b-instant)](https://groq.com/)
- **Styling:** Vanilla CSS (Modern Glassmorphism Design)
- **State Management:** React Context API & Hooks

---

## 🚀 Kurulum

Projeyi yerel ortamınızda çalıştırmak için:

1.  **Depoyu klonlayın:**
    ```bash
    git clone https://github.com/mertmnvv/ydtfocusv2.git
    ```
2.  **Bağımlılıkları yükleyin:**
    ```bash
    npm install
    ```
3.  **Çevresel değişkenleri ayarlayın:**
    `.env.local` dosyasını oluşturun ve aşağıdaki anahtarları ekleyin:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=...
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
    NEXT_PUBLIC_FIREBASE_APP_ID=...
    GROQ_API_KEY=...
    ```
4.  **Uygulamayı başlatın:**
    ```bash
    npm run dev
    ```

---

## 🎨 Tasarım Prensipleri

Platform, **Premium Dark Mode** ve **Glassmorphism** estetiğiyle geliştirilmiştir. Kullanıcı deneyimini en üstte tutmak için mikro-animasyonlar ve yumuşak geçiş efektleri (Sheet slide up, fade-in) kullanılmıştır.

---

## 👨‍💻 Geliştirici

**Mert** tarafından YDT öğrencilerinin başarısını artırmak amacıyla tutkuyla geliştirildi.

---
*YDT Focus bir öğrenme asistanıdır, başarınız sizin azminizle şekillenir!* 🌟
