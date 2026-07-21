# YDT Focus v2 — Detaylı Kod Analiz ve Optimizasyon Raporu

Bu rapor, projedeki CSS ve JS dosyalarının taranması sonucu ortaya çıkan verimsizlikleri, tekrarları ve teknik borçları (technical debt) belgelemektedir.

## 1. CSS ve Stil Tekrarları (Kritik)

Projenin en büyük şişkinliği `globals.css` dosyasındaki devasa satır sayısı (~6800 satır) ve sayfalardaki `<style jsx>` blokları arasındaki çakışmalardır.

### A. Tekrarlanan Renk ve Gradyan Tanımları
- **Sorun**: `linear-gradient(135deg, rgba(226, 183, 20, 0.1), ...)` gibi gradyanlar en az 12 farklı dosyada (Bento kartları, butonlar, modallar) tekrar tekrar yazılmış.
- **Örnek Dosyalar**: `dashboard/page.js`, `PremiumModal.js`, `Leaderboard.js`, `globals.css`.
- **Öneri**: Bu gradyanlar `:root` altında `--gradient-accent-glass` gibi değişkenlere atanarak merkezi bir yerden yönetilmelidir.

### B. Glassmorphism Tanımları
- **Sorun**: `backdrop-filter: blur(x)` ve `rgba(255,255,255,0.x)` border tanımları projenin hemen her bileşeninde (Card, Modal, Nav, Tab) ayrı ayrı tanımlanmış.
- **Öneri**: `.glass-effect` veya `.glass-card` gibi genel bir sınıf oluşturularak tüm bileşenlerde bu ortak sınıf kullanılmalıdır.

### C. Medya Sorguları (Media Queries)
- **Sorun**: `@media (max-width: 640px)` sorgusu neredeyse her sayfa dosyasının içinde ayrı ayrı tanımlanmış ve benzer işleri (flex-direction: column, padding adjustment) yapıyor.
- **Örnek**: `reading/page.js` ve `dashboard/page.js` içinde neredeyse aynı mobil sorgular var.
- **Öneri**: Ortak mobil düzen sınıfları (örn: `.mobile-stack`) `globals.css` içinde bir kez tanımlanmalıdır.

---

## 2. JavaScript ve React Mantıksal Tekrarları

### A. Firestore Veri Çekme (Subscription)
- **Sorun**: `subscribeToUserWords` ve `subscribeToUserStats` fonksiyonları birçok sayfada `useEffect` içinde aynı kalıpla kullanılıyor. Bu, kodun okunabilirliğini azaltıyor ve hata payını artırıyor.
- **Öneri**: `useUserWords` ve `useUserStats` gibi **Custom Hook**'lar yazılarak bu mantık tek bir yerden yönetilmeli, sayfalar sadece veriyi almalıdır.

### B. Rozet Kontrol Mantığı (`checkAndGrantBadges`)
- **Sorun**: `Dashboard` sayfasında verinin her güncellenmesinde (words veya stats değişince) bu kontrol fonksiyonu manuel olarak çağrılıyor. Bu işlem bileşen seviyesinde gereksiz yük oluşturabilir.
- **Öneri**: Bu mantık Firestore `updateUserStats` fonksiyonunun içine (library seviyesinde) veya statları yöneten merkezi bir hook içine taşınmalıdır.

### C. Tekrarlanan Yardımcı Fonksiyonlar
- **Sorun**: Tarih formatlama (`toLocaleDateString('tr-TR')`) ve hafta numarası hesaplama (`getWeekNumber`) gibi fonksiyonlar hem `firestore.js` hem de bazı sayfa dosyalarında (örn: `layout.js`) dağınık halde bulunuyor.
- **Öneri**: `src/lib/utils.js` gibi bir dosya oluşturularak bu yardımcı fonksiyonlar oradan import edilmelidir.

---

## 3. Bileşen (Component) Bazlı Fazlalıklar

### A. Premium Mantığı
- **Sorun**: `PremiumModal.js`, `PremiumPaywall.js` ve `PremiumContent.js` dosyaları arasında çok fazla benzer UI kodu ve premium kontrol mantığı var.
- **Öneri**: Bu üç bileşen tek bir `PremiumManager` bileşeni veya ortak bir `usePremium` hook'u etrafında birleştirilebilir.

### B. Layout Yapısı
- **Sorun**: Bazı sayfalar kendi `header` ve `divider` yapılarını manuel olarak oluşturuyor.
- **Öneri**: `PageHeader` gibi atomik bileşenler oluşturularak tüm sayfalarda tutarlılık sağlanmalıdır.

---

## 4. Teknik Özet ve Potansiyel Kazanımlar
- **Gereksiz CSS Satır Tahmini**: ~1500-2000 satır (ortak sınıflar ve değişkenler kullanılırsa).
- **Kod Temizliği**: JS tarafında ~%20 daha az satır sayısı (Custom Hook kullanımı ile).
- **Performans**: Daha az CSS ve JS yükü, daha hızlı render süreleri.

---
**Tarih**: 5 Mayıs 2026
**Hazırlayan**: Antigravity AI Analiz Modülü
