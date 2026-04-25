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
- **Reading Entegrasyonu:** Okuma panelinde bir metin oluşturulduğunda, Focus bu metni otomatik olarak öğreniyor. Artık "bu metni açıkla" dendiğinde metni kopyalamaya gerek kalmıyor.

### 📝 Özet (Walkthrough)
Focus artık daha stabil çalışıyor ve en önemlisi "gözleri açıldı". Okuma sayfasındaki metinleri sen sormadan biliyor, bu da soru-cevap sürecini inanılmaz hızlandırıyor.

---
