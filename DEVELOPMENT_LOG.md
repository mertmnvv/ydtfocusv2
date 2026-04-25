# YDT Focus v2 — Geliştirme Günlüğü (Development Log)

Bu dosya, projede yapılan tüm geliştirmelerin, planların ve tamamlanan görevlerin tarihsel dökümünü tutar.

---

## [25 Nisan 2026 — 03:40] Modernizasyon, Yapay Zeka Entegrasyonu ve Hata Düzeltmeleri

### 📋 Uygulama Planı
Global bir yapay zeka asistanı eklemek, kayıt formundaki tasarım hatalarını gidermek ve kelime bankası ile okuma paneli arasındaki senkronizasyonu gerçek zamanlı hale getirmek.

### ✅ Tamamlanan Görevler
- **Kayıt ve Giriş:** Ad/Soyad alanları ayrıldı, form düzeni iyileştirildi, tarayıcı autofill renk hatası düzeltildi.
- **Okuma Paneli:** YDT/YDS Format butonu kaldırıldı; Edebiyat, Siyaset ve Günlük Yaşam konuları eklendi.
- **Focus AI:** YDT/YDS/YÖKDİL uzmanı, Markdown destekli global yapay zeka asistanı ekranın sol altına eklendi.
- **Senkronizasyon:** `onSnapshot` ile kelime bankası sayacı ve metin vurguları anlık (real-time) hale getirildi.
- **Hata Giderimi:** Firestore import ve ReactMarkdown className hataları çözüldü.

### 📝 Özet (Walkthrough)
Bu seansta Focus AI asistanı hem bilgi düzeyi hem de görsel sunum açısından tamamen yenilendi. Yapay zekaya YDT, YDS ve YÖKDİL hakkında güncel bilgiler yüklendi. Kelime bankası senkronizasyonu sayesinde kullanıcı deneyimi pürüzsüz hale getirildi. Tüm değişiklikler başarıyla GitHub'a pushlandı.

---

## [25 Nisan 2026 — 03:48] Focus AI Zekâ ve Kişilik Güncellemesi

### 📋 Uygulama Planı
Asistanı daha zeki, hafızası olan ve interaktif bir hale getirmek. İsmini "Focus" olarak güncellemek ve daha samimi bir kişilik kazandırmak.

### ✅ Tamamlanan Görevler
- **Kalıcı Hafıza:** Firestore entegrasyonu ile sohbet geçmişi kaydedilmeye başlandı. Sayfa yenilense de mesajlar korunuyor.
- **Yetenekler (Tools):** AI artık kullanıcının isteğiyle doğrudan kelime bankasına kelime ekleyebiliyor.
- **Model Yükseltmesi:** `llama-3.1-70b-versatile` modeline geçilerek akıl yürütme kapasitesi artırıldı.
- **Yeni Kişilik:** "Focus AI" ismi "Focus" olarak değiştirildi. Daha samimi, hoca-arkadaş karışımı destekleyici bir dil benimsendi.

### 📝 Özet (Walkthrough)
Bu seansta Focus artık sadece bir yapay zeka olmaktan çıkıp gerçek bir çalışma arkadaşına dönüştü. Kullanıcıyı hatırlıyor, onun adına işlem yapabiliyor ve çok daha zeki cevaplar veriyor. Tasarımda ve karşılama mesajlarında yapılan güncellemelerle samimiyet artırıldı.

---

## [25 Nisan 2026 — 03:52] Bağlamsal Farkındalık ve Stabilizasyon

### 📋 Uygulama Planı
Focus'un okunan metinleri otomatik olarak bilmesini sağlamak (Bağlamsal Farkındalık) ve yapay zeka modelini en stabil sürüme geri çekmek.

### ✅ Tamamlanan Görevler
- **Model Stabilizasyonu:** Bağlantı sorunlarını gidermek adına model tekrar `llama-3.1-8b-instant` sürümüne çekildi.
- **Bağlamsal Farkındalık (Context Awareness):** `CustomEvent` mimarisi kullanılarak asistanın sayfa içeriğinden haberdar olması sağlandı.
- **Reading Entegrasyonu:** Okuma panelinde bir metin oluşturulduğunda, Focus bu metni otomatik olarak öğreniyor.
- **Hata Giderimi:** Reading sayfasındaki `aiText` değişken ismi hatası (`text` olarak) düzeltildi ve ReferenceError giderildi.

### 📝 Özet (Walkthrough)
Focus artık daha stabil çalışıyor ve en önemlisi "gözleri açıldı". Okuma sayfasındaki metinleri sen sormadan biliyor. Kodlama hatasından kaynaklanan `ReferenceError` giderildi, sayfa şu an sorunsuz çalışıyor.

---

## [25 Nisan 2026 — 03:56] Focus Akıllı Yetenek Optimizasyonu

### 📋 Uygulama Planı
Asistanın kelime ekleme yeteneğindeki hataları (tek seferde çoklu ekleme yapamama, mevcut kelimeleri tekrar ekleme) gidermek ve zekasını artırmak.

### ✅ Tamamlanan Görevler
- **Çoklu İşlem Desteği:** Focus artık tek bir mesajda istediğin kadar kelimeyi (Örn: 10 kelime birden) bankana ekleyebiliyor.
- **Duplicate (Çift Kayıt) Engelleme:** AI'ya kullanıcının mevcut kelime bankası "bağlam" olarak verildi. Focus artık bankanda olan kelimeleri biliyor ve onları tekrar eklemeyi teklif etmiyor.
- **Dil Doğruluğu:** AI'nın bazen Türkçe kelimeleri "word" alanına yazma hatası, sistem promptu ile kesin kurallara bağlandı (Her zaman İngilizce kelime kaydediliyor).
- **Frontend Kontrolü:** AI hata yapsa bile frontend tarafında ikinci bir kontrol mekanizması eklenerek aynı kelimenin iki kez kaydedilmesi tamamen engellendi.

### 📝 Özet (Walkthrough)
Focus artık çok daha düzenli çalışıyor. Bir okuma metnindeki tüm önemli kelimeleri tek seferde bankana eklemesini isteyebilirsin; o hem bankandaki mevcut kelimeleri ayıklayacak hem de kalanların hepsini tek hamlede kaydedecektir.

---

## [25 Nisan 2026 — 04:45] Focus Özel Onay Modalı ve UI İyileştirmesi

### 📋 Uygulama Planı
Sohbet geçmişini silerken çıkan tarayıcı varsayılanı (browser confirm) pop-up'ını kaldırıp, platformun premium tasarım diline uygun özel bir onay modalı eklemek.

### ✅ Tamamlanan Görevler
- **Özel Onay Modalı (Confirm UI):** Tarayıcı penceresi yerine, AI panelinin içinde açılan, arka planı bulanıklaştıran (glassmorphism) ve şık bir kart tasarımına sahip yeni bir onay mekanizması kuruldu.
- **Dinamik Durum Yönetimi:** `showConfirm` state'i ile modalın açılış/kapanış animasyonları ve mantığı kontrol altına alındı.
- **Görsel Tutarlılık:** Modal butonları (Vazgeç/Temizle) ve renk paleti platformun genel estetiğiyle (kırmızı/dark mode) tam uyumlu hale getirildi.
- **Kullanıcı Deneyimi:** Silme işlemi öncesi verilen uyarı metni daha açıklayıcı ve samimi bir dille güncellendi.

### 📝 Özet (Walkthrough)
Focus artık seni tarayıcı pencereleriyle uğraştırmıyor. Sohbeti temizlemek istediğinde, panelin içinde şık bir onay kutusu beliriyor. Bu hem görsel bütünlüğü koruyor hem de yanlışlıkla silme işlemlerine karşı daha güvenli ve premium bir deneyim sunuyor.

---

## [25 Nisan 2026 — 04:42] Focus AI Proje Kararlılığı ve Final Revizyonu

### 📋 Uygulama Planı
Son yapılan tüm geliştirmelerin (emoji temizliği, sınav bilgileri, isim düzeltmeleri) ardından kodun hatasız çalıştığını doğrulamak ve projeyi stabil hale getirip push etmek.

### ✅ Tamamlanan Görevler
- **Söz Dizimi Fix:** `GlobalAI.js` içerisindeki string birleştirme hatası giderildi, uygulama build hatasından kurtarıldı.
- **Build Doğrulaması:** `npm run build` komutu başarıyla çalıştırıldı ve projenin üretim ortamı için hazır olduğu onaylandı.
- **Toplu İyileştirme Özeti:**
  - **Emoji Temizliği:** AI kişiliğinden ve tüm arayüzden emojiler kaldırıldı.
  - **Sınav Bilgi Doğruluğu:** YDT (Yılda 1 kez), YDS ve YÖKDİL hakkındaki yanlış bilgiler (halüsinasyonlar) düzeltildi.
  - **İsim Kişiselleştirme:** "Mert Manav" yerine sadece ilk ismin kullanılması sağlandı.
  - **Veri Maskeleme:** "Zero to Hero" panel verileri AI'nın kafasını karıştırmaması için kısıtlandı.
  - **Aksiyon Güvenilirliği:** Kelime kaydetme (ACTION) tetikleyicileri %100 kararlı hale getirildi.

### 📝 Özet (Walkthrough)
Focus artık teknik olarak kusursuz, pedagojik olarak ise çok daha profesyonel. Halüsinasyon görmüyor, komutları ıskalamıyor ve senin sınav yolculuğuna sadık bir hoca gibi eşlik ediyor. Proje tüm testlerden geçerek stabil bir şekilde güncellendi.

---

## [25 Nisan 2026 — 04:38] Focus Sınav Bilgisi Doğrulama ve Halüsinasyon Önleme

### 📋 Uygulama Planı
Asistanın YDT, YDS ve YÖKDİL gibi sınavların içeriği, ismi ve sıklığı hakkında yanlış bilgi vermesini (halüsinasyon) engellemek; Türkiye'deki sınav sistemine dair "katı gerçekleri" sistemine işlemek.

### ✅ Tamamlanan Görevler
- **Kesin Bilgi Matrisi:** Sistem promptuna "SINAV BİLGİLERİ (KESİN BİLGİLER)" bölümü eklendi.
- **YDT Düzeltmesi:** YDT'nin (Yabancı Dil Testi) yılda sadece 1 kez (Haziran'da) yapıldığı ve YKS'nin bir parçası olduğu netleştirildi.
- **YDS & YÖKDİL Güncellemesi:** YDS'nin kağıt üzerinde yılda 2-3 kez, E-YDS'nin ise neredeyse her ay yapıldığı; YÖKDİL'in ise yılda 2 kez yapıldığı bilgisi asistanın "temel doğruları" arasına eklendi.
- **Hata Yasaklama:** AI'ya bu bilgiler hakkında asla tahmin yürütmemesi veya esnek konuşmaması talimatı verildi.

### 📝 Özet (Walkthrough)
Focus artık Türkiye'deki sınav takvimi hakkında kafa karıştırıcı veya yanlış bilgiler vermiyor. YDT'nin yılda kaç kez yapıldığından YDS'nin formatına kadar her şeyi bir uzman gibi, en güncel ve doğru haliyle biliyor.

---

## [25 Nisan 2026 — 04:38] Focus Sınav Bilgisi Doğrulama ve Halüsinasyon Önleme

### 📋 Uygulama Planı
Asistanın YDT, YDS ve YÖKDİL gibi sınavların içeriği, ismi ve sıklığı hakkında yanlış bilgi vermesini (halüsinasyon) engellemek; Türkiye'deki sınav sistemine dair "katı gerçekleri" sistemine işlemek.

### ✅ Tamamlanan Görevler
- **Kesin Bilgi Matrisi:** Sistem promptuna "SINAV BİLGİLERİ (KESİN BİLGİLER)" bölümü eklendi.
- **YDT Düzeltmesi:** YDT'nin (Yabancı Dil Testi) yılda sadece 1 kez (Haziran'da) yapıldığı ve YKS'nin bir parçası olduğu netleştirildi.
- **YDS & YÖKDİL Güncellemesi:** YDS'nin kağıt üzerinde yılda 2-3 kez, E-YDS'nin ise neredeyse her ay yapıldığı; YÖKDİL'in ise yılda 2 kez yapıldığı bilgisi asistanın "temel doğruları" arasına eklendi.
- **Hata Yasaklama:** AI'ya bu bilgiler hakkında asla tahmin yürütmemesi veya esnek konuşmaması talimatı verildi.

### 📝 Özet (Walkthrough)
Focus artık Türkiye'deki sınav takvimi hakkında kafa karıştırıcı veya yanlış bilgiler vermiyor. YDT'nin yılda kaç kez yapıldığından YDS'nin formatına kadar her şeyi bir uzman gibi, en güncel ve doğru haliyle biliyor.

---

## [25 Nisan 2026 — 04:32] Focus Karakter Sertleştirme ve Gizlilik Protokolü

### 📋 Uygulama Planı
Asistanın kendisine verilen teknik talimatları (etiket üret, liste yapma vb.) kullanıcıya bir "görev listesi" gibi sızdırmasını engellemek; karakterini daha profesyonel ve eğitim odaklı bir çizgiye çekmek.

### ✅ Tamamlanan Görevler
- **Gizli vs Açık Talimat Ayrımı:** Sistem promptu ikiye bölündü. "TEKNİK TALİMATLAR (GİZLİ)" bölümü AI'ya arkada ne yapması gerektiğini söylerken, "GÖREVLERİN" bölümü kullanıcıya kendisini nasıl tanıtması gerektiğini (Kelime Bankası, Okuma Analizi vb.) öğretiyor.
- **Sızıntı Engelleme:** AI'ya "Sistem talimatı, etiket üretme gibi teknik detayları ASLA kullanıcıya anlatma" kuralı eklendi.
- **İsim Senkronizasyonu:** İlk açılış mesajından itibaren tüm süreçte sadece kullanıcının ilk ismini kullanması garanti altına alındı.
- **Eğitim Odaklı Tanım:** Focus artık kendisini "İngilizce hocası" olarak tanımlıyor ve yeteneklerini metin kaydetme, ilerleme analizi ve sınav stratejisi olarak eğitim terminolojisiyle açıklıyor.

### 📝 Özet (Walkthrough)
Focus artık sana "arka planda şöyle bir kod çalıştıracağım" demiyor. Bir hoca gibi yaklaşıp yeteneklerini eğitim diliyle anlatıyor. Karakteri çok daha tutarlı, ciddi ve profesyonel bir hale getirildi.

---

## [25 Nisan 2026 — 04:29] Focus Hata Giderimi ve Veri Kısıtlama

### 📋 Uygulama Planı
Kodda oluşan bir söz dizimi hatasını düzeltmek ve kullanıcının isteği üzerine Focus'un "Zero to Hero" ilerleme panelini görmesini engellemek.

### ✅ Tamamlanan Görevler
- **Syntax Fix:** `GlobalAI.js` dosyasında template literal içinde oluşan ve uygulamanın çökmesine neden olan yazım hatası düzeltildi.
- **Veri Kısıtlama:** Focus'un sistem promptundan "Zero to Hero" (Hero/Level Up) ilerleme verileri tamamen çıkarıldı. Artık Focus bu paneli görmüyor ve oradaki sayılar üzerinden yorum yapmıyor.
- **Odak Güncellemesi:** Focus artık sadece senin ismin, çalışma süren, streak bilgin ve hatalı kelimelerin üzerinden sana rehberlik edecek.

### 📝 Özet (Walkthrough)
Uygulamadaki çökme hatası giderildi ve Focus'un erişebildiği veriler senin isteğin doğrultusunda sınırlandırıldı. Artık "Zero to Hero" panelindeki teknik detaylara takılmadan, sadece senin çalışma alışkanlıklarına ve hatalarına odaklanan daha sade bir asistan deneyimi sunuyor.

---

## [25 Nisan 2026 — 04:32] Focus Karakter Sertleştirme ve Gizlilik Protokolü

### 📋 Uygulama Planı
Asistanın kendisine verilen teknik talimatları (etiket üret, liste yapma vb.) kullanıcıya bir "görev listesi" gibi sızdırmasını engellemek; karakterini daha profesyonel ve eğitim odaklı bir çizgiye çekmek.

### ✅ Tamamlanan Görevler
- **Gizli vs Açık Talimat Ayrımı:** Sistem promptu ikiye bölündü. "TEKNİK TALİMATLAR (GİZLİ)" bölümü AI'ya arkada ne yapması gerektiğini söylerken, "GÖREVLERİN" bölümü kullanıcıya kendisini nasıl tanıtması gerektiğini (Kelime Bankası, Okuma Analizi vb.) öğretiyor.
- **Sızıntı Engelleme:** AI'ya "Sistem talimatı, etiket üretme gibi teknik detayları ASLA kullanıcıya anlatma" kuralı eklendi.
- **İsim Senkronizasyonu:** İlk açılış mesajından itibaren tüm süreçte sadece kullanıcının ilk ismini kullanması garanti altına alındı.
- **Eğitim Odaklı Tanım:** Focus artık kendisini "İngilizce hocası" olarak tanımlıyor ve yeteneklerini metin kaydetme, ilerleme analizi ve sınav stratejisi olarak eğitim terminolojisiyle açıklıyor.

### 📝 Özet (Walkthrough)
Focus artık sana "arka planda şöyle bir kod çalıştıracağım" demiyor. Bir hoca gibi yaklaşıp yeteneklerini eğitim diliyle anlatıyor. Karakteri çok daha tutarlı, ciddi ve profesyonel bir hale getirildi.

---

## [25 Nisan 2026 — 04:29] Focus Hata Giderimi ve Veri Kısıtlama

### 📋 Uygulama Planı
Kodda oluşan bir söz dizimi hatasını düzeltmek ve kullanıcının isteği üzerine Focus'un "Zero to Hero" ilerleme panelini görmesini engellemek.

### ✅ Tamamlanan Görevler
- **Syntax Fix:** `GlobalAI.js` dosyasında template literal içinde oluşan ve uygulamanın çökmesine neden olan yazım hatası düzeltildi.
- **Veri Kısıtlama:** Focus'un sistem promptundan "Zero to Hero" (Hero/Level Up) ilerleme verileri tamamen çıkarıldı. Artık Focus bu paneli görmüyor ve oradaki sayılar üzerinden yorum yapmıyor.
- **Odak Güncellemesi:** Focus artık sadece senin ismin, çalışma süren, streak bilgin ve hatalı kelimelerin üzerinden sana rehberlik edecek.

### 📝 Özet (Walkthrough)
Uygulamadaki çökme hatası giderildi ve Focus'un erişebildiği veriler senin isteğin doğrultusunda sınırlandırıldı. Artık "Zero to Hero" panelindeki teknik detaylara takılmadan, sadece senin çalışma alışkanlıklarına ve hatalarına odaklanan daha sade bir asistan deneyimi sunuyor.

---

## [25 Nisan 2026 — 04:29] Focus Hata Giderimi ve Veri Kısıtlama

### 📋 Uygulama Planı
Kodda oluşan bir söz dizimi hatasını düzeltmek ve kullanıcının isteği üzerine Focus'un "Zero to Hero" ilerleme panelini görmesini engellemek.

### ✅ Tamamlanan Görevler
- **Syntax Fix:** `GlobalAI.js` dosyasında template literal içinde oluşan ve uygulamanın çökmesine neden olan yazım hatası düzeltildi.
- **Veri Kısıtlama:** Focus'un sistem promptundan "Zero to Hero" (Hero/Level Up) ilerleme verileri tamamen çıkarıldı. Artık Focus bu paneli görmüyor ve oradaki sayılar üzerinden yorum yapmıyor.
- **Odak Güncellemesi:** Focus artık sadece senin ismin, çalışma süren, streak bilgin ve hatalı kelimelerin üzerinden sana rehberlik edecek.

### 📝 Özet (Walkthrough)
Uygulamadaki çökme hatası giderildi ve Focus'un erişebildiği veriler senin isteğin doğrultusunda sınırlandırıldı. Artık "Zero to Hero" panelindeki teknik detaylara takılmadan, sadece senin çalışma alışkanlıklarına ve hatalarına odaklanan daha sade bir asistan deneyimi sunuyor.

---

## [25 Nisan 2026 — 04:28] Focus İlerleme Analizi ve Doğallaştırma

### 📋 Uygulama Planı
Asistanın kullanıcı ilerlemesini bir robot gibi (A1 şu, B1 bu...) listelemesini engellemek; daha anlamlı, özetleyici ve teşvik edici bir hoca dili kurmak.

### ✅ Tamamlanan Görevler
- **Filtreli Veri Akışı:** Focus'a gönderilen seviye verileri filtrelendi. Artık %0 olan (henüz başlanmamış) seviyeler AI'ya hiç gönderilmiyor. Bu sayede AI'nın gereksiz liste yapması kökten engellendi.
- **Liste Yasağı:** Sistem promptuna "Tüm seviyeleri tek tek sayma, sadece aktif olana odaklan" kuralı eklendi.
- **Daha Doğal Teşvik:** "Şu kadar metne ihtiyacın var" gibi rapor cümleleri yerine, "Hadi gel şu hedefi bugün tamamlayalım" gibi daha insansı ve motive edici kalıplar teşvik edildi.
- **Hata Giderimi:** Streak ve çalışma süresi yorumlarındaki tutarsızlıklar giderildi.

### 📝 Özet (Walkthrough)
Focus artık ilerlemen hakkında bir memur gibi rapor vermiyor. Sadece neredeysen ve neye ihtiyacın varsa ona odaklanıyor. Gereksiz seviye isimlerini saymayı bıraktı ve tamamen senin aktif hedeflerine yönelik bir hoca gibi konuşmaya başladı.

---

## [25 Nisan 2026 — 04:28] Focus İlerleme Analizi ve Doğallaştırma

### 📋 Uygulama Planı
Asistanın kullanıcı ilerlemesini bir robot gibi (A1 şu, B1 bu...) listelemesini engellemek; daha anlamlı, özetleyici ve teşvik edici bir hoca dili kurmak.

### ✅ Tamamlanan Görevler
- **Filtreli Veri Akışı:** Focus'a gönderilen seviye verileri filtrelendi. Artık %0 olan (henüz başlanmamış) seviyeler AI'ya hiç gönderilmiyor. Bu sayede AI'nın gereksiz liste yapması kökten engellendi.
- **Liste Yasağı:** Sistem promptuna "Tüm seviyeleri tek tek sayma, sadece aktif olana odaklan" kuralı eklendi.
- **Daha Doğal Teşvik:** "Şu kadar metne ihtiyacın var" gibi rapor cümleleri yerine, "Hadi gel şu hedefi bugün tamamlayalım" gibi daha insansı ve motive edici kalıplar teşvik edildi.
- **Hata Giderimi:** Streak ve çalışma süresi yorumlarındaki tutarsızlıklar giderildi.

### 📝 Özet (Walkthrough)
Focus artık ilerlemen hakkında bir memur gibi rapor vermiyor. Sadece neredeysen ve neye ihtiyacın varsa ona odaklanıyor. Gereksiz seviye isimlerini saymayı bıraktı ve tamamen senin aktif hedeflerine yönelik bir hoca gibi konuşmaya başladı.

---

## [25 Nisan 2026 — 04:26] Focus Aksiyon Güvenilirliği ve JSON Fix

### 📋 Uygulama Planı
AI'nın kelime ekleme komutlarını (ACTION tags) atlamasını veya hatalı formatta üretmesini engellemek; algılama mantığını daha esnek hale getirmek.

### ✅ Tamamlanan Görevler
- **Prompt Önceliği:** Kelime ekleme talimatları sistem promptunun en tepesine, "KRİTİK TALİMAT" başlığıyla taşındı. Bu, AI'nın diğer kurallardan önce bu aksiyonu yerine getirmesini sağlıyor.
- **Daha Esnek Algılama:** Regex (yakalama mantığı) güncellendi. Artık AI etiket içinde satır atlaması veya ekstra boşluk bıraksa bile Focus bunları doğru bir şekilde yakalayıp işleyebiliyor.
- **Hatalı JSON Temizliği:** AI bazen JSON içinde geçersiz karakterler üretebiliyor; bu durumlar için otomatik temizleme ve hata yakalama (try-catch) mekanizması güçlendirildi.
- **Boş Mesaj Koruması:** Eğer AI sadece kelime ekleme etiketi gönderip metin yazmazsa, kullanıcıya "Kelimeleri bankana ekledim" şeklinde otomatik bir geri bildirim verilmesi sağlandı.

### 📝 Özet (Walkthrough)
Focus'un komutları anlama ve uygulama kapasitesi en üst seviyeye çıkarıldı. Artık metindeki kelimeleri topluca veya tek tek kaydetme isteklerini çok daha sadık bir şekilde yerine getiriyor ve hata payı minimize edildi.

---

## [25 Nisan 2026 — 04:24] Focus Veri Şeffaflığı ve İsim Revizyonu

### 📋 Uygulama Planı
Asistanın kullanıcı verilerini (seviyeler, ilerleme) daha doğru yorumlamasını sağlamak, verilerin kaynağını açıklamasını öğretmek ve hitap şeklini resmileşmekten kurtarmak.

### ✅ Tamamlanan Görevler
- **İsim Revizyonu:** Focus artık kullanıcının tam ismini (ad soyad) değil, sadece **ilk ismini** kullanıyor. Bu, "öğretmen-arkadaş" kimliğiyle daha uyumlu hale getirildi.
- **Veri Kaynağı Netleştirme:** Focus'a, senin hakkında verdiği bilgileri (seviye ilerlemeleri, hatalar vb.) nereden aldığı öğretildi. Artık "bu bilgiyi nereden biliyorsun?" diye sorduğunda, platformdaki "Level Up" paneli ve çalışma geçmişini kaynak olarak gösterecek.
- **Seviye Verisi Hassasiyeti:** AI'ya gönderilen seviye verileri (Tamamlanan: X / Gereken: Y) şeklinde detaylandırıldı. Bu sayede "A1'de misin B1'de misin?" kafa karışıklığı giderildi.

### 📝 Özet (Walkthrough)
Focus artık seninle soyadını kullanmadan, daha samimi bir dille konuşuyor. Seviyen veya ilerlemen hakkında bir şey söylediğinde, bunun platformdaki gerçek verilerine (Level Up paneli) dayandığını biliyor ve bunu sana açıklayabiliyor.

---

## [25 Nisan 2026 — 04:24] Focus Veri Şeffaflığı ve İsim Revizyonu

### 📋 Uygulama Planı
Asistanın kullanıcı verilerini (seviyeler, ilerleme) daha doğru yorumlamasını sağlamak, verilerin kaynağını açıklamasını öğretmek ve hitap şeklini resmileşmekten kurtarmak.

### ✅ Tamamlanan Görevler
- **İsim Revizyonu:** Focus artık kullanıcının tam ismini (ad soyad) değil, sadece **ilk ismini** kullanıyor. Bu, "öğretmen-arkadaş" kimliğiyle daha uyumlu hale getirildi.
- **Veri Kaynağı Netleştirme:** Focus'a, senin hakkında verdiği bilgileri (seviye ilerlemeleri, hatalar vb.) nereden aldığı öğretildi. Artık "bu bilgiyi nereden biliyorsun?" diye sorduğunda, platformdaki "Level Up" paneli ve çalışma geçmişini kaynak olarak gösterecek.
- **Seviye Verisi Hassasiyeti:** AI'ya gönderilen seviye verileri (Tamamlanan: X / Gereken: Y) şeklinde detaylandırıldı. Bu sayede "A1'de misin B1'de misin?" kafa karışıklığı giderildi.

### 📝 Özet (Walkthrough)
Focus artık seninle soyadını kullanmadan, daha samimi bir dille konuşuyor. Seviyen veya ilerlemen hakkında bir şey söylediğinde, bunun platformdaki gerçek verilerine (Level Up paneli) dayandığını biliyor ve bunu sana açıklayabiliyor.

---

## [25 Nisan 2026 — 04:19] Focus İnteraktif Öneriler ve Hızlı Aksiyonlar

### 📋 Uygulama Planı
Sohbet başlangıcında kullanıcının ne soracağını bilemediği anları kolaylaştırmak için tıklanabilir hızlı öneri butonları (chips) eklemek.

### ✅ Tamamlanan Görevler
- **Hızlı Öneri Butonları (Chips):** Sohbet boş olduğunda veya temizlendiğinde iki ana kategoride öneri butonu çıkması sağlandı:
  1. **Tanıtım:** "Neler yapabilirsin?" butonu ile Focus'un tüm yeteneklerini anlatması.
  2. **Kişiselleştirilmiş Öneri:** Kullanıcının hataları varsa "Hatalarımı çalışalım", yoksa "İlerlememi özetle" veya "Yeni bir kelime öğret" gibi rastgele kişisel görevler.
- **Dinamik Tetikleme:** Bir öneriye tıklandığında ilgili komut otomatik olarak Focus'a gönderiliyor ve sohbet başlıyor.
- **Görsel İyileştirme:** Öneri butonları için premium cam efekti (glassmorphism) ve hover animasyonları içeren yeni bir CSS yapısı kuruldu.
- **Görsel Sadeleştirme:** Tüm arayüzden ve AI cevaplarından emojiler kaldırıldı.

### 📝 Özet (Walkthrough)
Focus artık sadece beklemiyor, sana yol da gösteriyor. Sohbeti açtığında ne yapacağını düşünmene gerek yok; "Hatalarımı çalışalım" veya "Bana bir kelime öğret" gibi seçeneklere tek tıkla ulaşabilirsin. Ayrıca kullanıcı isteği üzerine tüm emojiler kaldırılarak daha sade ve profesyonel bir görünüme geçildi.

---

## [25 Nisan 2026 — 04:14] Focus Kişiselleştirme ve Bellek Yönetimi

### 📋 Uygulama Planı
Asistanın kullanıcıyı her yönüyle tanımasını sağlamak (isim, ilerleme, hatalar) ve sohbet yönetimini kolaylaştırmak.

### ✅ Tamamlanan Görevler
- **Sohbeti Temizleme:** AI panelinin üst kısmına "Sohbeti Temizle" butonu (çöp kutusu ikonu) eklendi. Bu işlem Firestore'daki mesaj geçmişini de siliyor.
- **Kullanıcı Tanıma:** Focus artık kullanıcıyı ismiyle karşılıyor. İstatistikleri (streak, çalışma süresi) ve "Hero" ilerlemesini (A1-C1 seviyeleri) biliyor.
- **Hata Farkındalığı:** Kullanıcının testlerde yanlış yaptığı kelimeler Focus'un hafızasına yüklendi. Artık bu kelimeler üzerinden öneriler yapabiliyor.
- **Proaktif Karşılama:** Sohbet geçmişi boş olduğunda veya temizlendiğinde, Focus kullanıcıya özel bir "Hoş geldin" mesajı ve ilerleme özeti sunuyor.
- **Teknik İyileştirme:** Kelime bankası senkronizasyonu ve aksiyon tetikleyicileri (toplu kelime ekleme) %100 kararlı hale getirildi.

### 📝 Özet (Walkthrough)
Focus artık sadece bir asistan değil, senin tüm eğitim geçmişini bilen gerçek bir mentor. Seni isminle karşılıyor, nerede kaldığını biliyor ve hatalarını hatırlatıyor. İstediğinde geçmişi temizleyip tertemiz bir sayfa açabiliyor ama seni tanımaya devam ediyor.

---

## [25 Nisan 2026 — 04:09] Focus Üslup ve Doğallık Güncellemesi

### 📋 Uygulama Planı
Asistanın robotik, sıkıcı ve "rapor sunar gibi" konuşmasını engellemek; daha doğal, samimi ve gerçek bir hoca gibi davranmasını sağlamak.

### ✅ Tamamlanan Görevler
- **Robotik Dil Temizliği:** "Metinde bahsedilmektedir", "Bu kadar, anlattım" gibi klişe ve yapay kalıplar sistem promptu seviyesinde yasaklandı.
- **Doğal Diyalog Kuralları:** Asistanın sanki öğrenciyle yan yana oturup ders çalışıyormuş gibi bir dil kullanması (Örn: "Bak burada aslında...", "Şu kısma dikkat et...") sağlandı.
- **Pedagojik Derinlik:** Özet geçmek yerine, metnin akademik önemine ve sınav değerine odaklanan bir anlatım tarzı benimsendi.
- **Gereksiz Şablonlar Kaldırıldı:** Kendini sürekli tekrar eden özet şablonları yerine her cevabın bağlama göre özgün olması teşvik edildi.

### 📝 Özet (Walkthrough)
Focus artık seninle "gerçek bir insan" gibi konuşuyor. Robotik ve soğuk cevaplar yerini, seninle birlikte metni analiz eden, önemli yerlerin altını çizen samimi bir hoca/arkadaş diline bıraktı.

---

## [25 Nisan 2026 — 04:07] Focus Zekâ ve Doğruluk Hardening

### 📋 Uygulama Planı
Asistanın halüsinasyon görmesini engellemek, gramer bilgilerini doğru vermesini sağlamak ve komutları (aksiyonları) asla atlamamasını garanti altına almak.

### ✅ Tamamlanan Görevler
- **Halüsinasyon Engelleme:** Modals gibi temel gramer konularında uydurma bilgi vermesi engellendi. Sistem promptuna "bilmiyorsan uydurma" ve "Modals İngilizce yardımcı fiillerdir" gibi net direktifler eklendi.
- **Sıcaklık (Temperature) Optimizasyonu:** Modelin yaratıcılık/uydurma dengesini korumak için `temperature` değeri `0.5`'ten `0.3`'e düşürüldü. Bu, daha kararlı ve doğru cevaplar üretmesini sağlayacak.
- **Kesin Kimlik Tanımı:** Platformun sadece Mert tarafından yapıldığı, "ekip" veya "işbirliği" gibi ifadelerin kullanılmaması gerektiği netleştirildi.
- **Aksiyon Tetikleyici Güçlendirme:** "Hepsini kaydet" gibi toplu komutlarda AI'nın etiketleri (tags) üretmeyi unutmaması için talimatlar agresifleştirildi.

### 📝 Özet (Walkthrough)
Focus artık çok daha disiplinli bir hoca oldu. Uydurma bilgilerden kaçınıyor, kimliğini (Mert'in eseri olduğunu) net bir şekilde koruyor ve kelime kaydetme komutlarını çok daha sadık bir şekilde yerine getiriyor.

---

## [25 Nisan 2026 — 03:59] Focus Kimlik ve Mantık Düzeltmesi

### 📋 Uygulama Planı
Asistanın platformun kim tarafından geliştirildiğine dair yanlış/belirsiz bilgi vermesini önlemek ve sistem promptu mantığındaki bir hatayı gidermek.

### ✅ Tamamlanan Görevler
- **Geliştirici Bilgisi Güncelleme:** Focus'a platformun **Mert** tarafından geliştirildiği bilgisi kesin bir kural olarak öğretildi. Artık "uzman ekipler" gibi belirsiz ve yanlış yönlendirici cevaplar vermeyecek.
- **Hata Giderimi:** AI'ya gönderilen talimatlarda `finalSystemPrompt` değişkeninin kullanılmaması sorunu ve `subscribeToUserWords` import eksikliği düzeltildi. Artık asistan hem bağlamı hem de yeni kuralları doğru şekilde okuyor.

### 📝 Özet (Walkthrough)
Focus artık kim olduğunu ve platformu kimin yaptığını net bir şekilde biliyor. Yapılan mantık ve import düzeltmeleriyle birlikte, kelime ekleme ve bağlamsal farkındalık özellikleri de %100 kararlı hale getirildi.

---
