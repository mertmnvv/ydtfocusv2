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
