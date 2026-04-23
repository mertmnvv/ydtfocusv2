# YDT Focus: Akademik Dil Öğrenme Platformu

YDT Focus; YDT (Yabancı Dil Testi), YÖKDİL ve YDS gibi üst düzey akademik İngilizce sınavlarına hazırlanan öğrenciler için geliştirilmiş, yapay zeka entegrasyonuna sahip ileri düzey bir eğitim platformudur. Sistem, optimize edilmiş bir öğrenme ortamı sunmak amacıyla modern dil modellerini ve oyunlaştırılmış öğrenme çerçevelerini kullanır.

---

## Temel Fonksiyonel Modüller

### Yapay Zeka Destekli Okuma ve Analiz
*   **Bağlamsal Metin Üretimi:** Sınav temalarına uygun, CEFR seviyelerine (A2-C1) göre dinamik olarak oluşturulan akademik pasajlar.
*   **Kayan Analitik Arayüz:** Seçilen kelimeler için gerçek zamanlı semantik analiz, çeviri ve eş anlamlı ilişkileri sunan, isteğe bağlı açılan alt panel (bottom sheet).
*   **Akademik Kelime Vurgulama:** En sık karşılaşılan 500+ akademik terimin metin içerisinde otomatik tespiti ve görselleştirilmesi.
*   **Adaptif Değerlendirme:** Öğrenilen bilgilerin kalıcılığını sağlamak amacıyla, aktif okuma bağlamına göre yapay zeka tarafından oluşturulan okuduğunu anlama testleri.

### Zero to Hero: Kademeli Öğrenme Yolu
*   **Hiyerarşik Müfredat:** Öğrencileri temel seviyeden ileri düzeye taşımak için tasarlanmış, seviye bazlı yapılandırılmış bir ilerleme sistemi.
*   **Etkileşimli Oyunlaştırma:** Bilişsel katılımı artırmak amacıyla sürükle-bırak ve interaktif eşleştirme mekanizmalarının kullanımı.
*   **Performans Metrikleri:** Doğrulanmış kilometre taşları ile entegre, gerçek zamanlı öğrenci gelişim takibi.

### Akıllı Kelime Yönetimi
*   **Aralıklı Tekrar Sistemi (SRS):** Unutma eğrisine karşı koymak ve uzun süreli hafızayı desteklemek için optimize edilmiş tekrar algoritması.
*   **Hata Analitiği:** Odaklanmış telafi çalışmaları için yanlış yanıtların otomatik kategorize edilmesi.

### Özel Odaklanma Modülleri
*   **LineFocus Modu:** Cümle düzeyindeki bağlamı izole ederek konsantrasyonu maksimize eden minimalist okuma ortamı.

---

## Teknik Mimari

*   **Frontend Framework:** App Router mimarisini kullanan Next.js 14.
*   **Backend Altyapısı:** Ölçeklenebilir veri depolama için Firebase Firestore ve güvenli kimlik yönetimi için Firebase Authentication.
*   **Yapay Zeka Entegrasyonu:** Yüksek performanslı doğal dil işleme için Llama-3.1-8b-instant modelini kullanan Groq Cloud API.
*   **Tasarım ve Arayüz:** Glassmorphism ve premium karanlık mod estetiğine odaklanan, Vanilla CSS ile uygulanmış modern tasarım sistemi.
*   **Durum Yönetimi:** React Context API ve fonksiyonel hooklar aracılığıyla yönetilen sağlam veri akışı.

---

## Kurulum ve Dağıtım

Geliştirme ortamını başlatmak için:

1.  **Deponun Klonlanması:**
    ```bash
    git clone https://github.com/mertmnvv/ydtfocusv2.git
    ```

2.  **Bağımlılıkların Çözümlenmesi:**
    ```bash
    npm install
    ```

3.  **Ortam Yapılandırması:**
    Kök dizinde bir `.env.local` dosyası oluşturun ve aşağıdaki parametreleri tanımlayın:
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=api_anahtariniz
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=auth_domaininiz
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=proje_idiniz
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=storage_bucketiniz
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=sender_idiniz
    NEXT_PUBLIC_FIREBASE_APP_ID=app_idiniz
    GROQ_API_KEY=groq_api_anahtariniz
    ```

4.  **Yerel Çalıştırma:**
    ```bash
    npm run dev
    ```

---

## Tasarım Felsefesi

Platform, derinlik ve odaklanma hissi yaratmak için glassmorphism öğelerini kullanan "Premium Karanlık" estetiğine bağlı kalır. Kullanıcı arayüzü etkileşimleri, kesintisiz ve profesyonel bir deneyim sunmak için yüksek performanslı CSS geçişleri ve animasyonları (alt panel kayma efektleri, durum geçişleri) ile güçlendirilmiştir.

---

## Proje Durumu

Dil öğrenenler için yüksek kaliteli akademik araçlar sunma odağıyla Mert tarafından geliştirilmiştir ve sürdürülmektedir.

---
*Yasal Uyarı: YDT Focus bir eğitim destek aracıdır. Akademik başarı, bireysel çalışma disiplini ve sürekliliğe bağlıdır.*
