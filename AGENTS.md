# YDT Focus v2 — Agent Talimatları

## Kural 1 — Dil

**Kullanıcıyla HER ZAMAN Türkçe konuş.** Kod, commit mesajları, değişken
isimleri İngilizce kalabilir (mevcut konvansiyon), ama kullanıcıya yazdığın
her mesaj, açıklama, ilerleme güncellemesi ve özet Türkçe olmalı — kullanıcı
İngilizce yazsa bile.

## Proje nedir

YDT Focus; YDT/YÖKDİL/YDS gibi akademik İngilizce sınavlarına hazırlanan
öğrenciler için yapay zeka destekli bir çalışma platformu. Next.js 16
(App Router, Turbopack) + React 19 + vanilla CSS (`<style jsx>` + tek büyük
`src/styles/globals.css`) + Firebase (Auth/Firestore) üzerine kurulu. AI
üretimi için Groq (Llama modelleri) ve Gemini (fallback) kullanılıyor. Ayrıca
Capacitor ile Android'e paketleniyor ve `linefocus` adında ikinci bir
mini-platform aynı repo içinde yaşıyor (`src/app/(app)/linefocus`).

Genel ürün özeti için `README.md`'ye bak; geçmiş geliştirme kararları için
`docs/DEVELOPMENT_LOG.md`'ye, bilinen teknik borç/tekrar sorunları için
`docs/PROJECT_ANALYSIS_REPORT.md`'ye bak.

## Next.js versiyonu hakkında not

Bu proje standart, güncel bir Next.js (App Router) kurulumudur — özel bir
fork ya da "bilinenden farklı" bir sürüm değildir. `node_modules/next/dist/docs`
diye bir klasör YOK; kod yazmadan önce böyle bir yolu okumaya çalışma. Next.js
davranışıyla ilgili emin olmadığın bir şey varsa gerçek kaynak: yüklü
`next` paketinin sürümü (`package.json`'da `"next"` alanı) ve resmi Next.js
dokümantasyonu.

## Şu anki öncelik: köklü frontend yeniden tasarımı

Uygulama, onaylanmış bir tasarım incelemesinin ardından kapsamlı bir UI/IA
sadeleştirmesinden geçiyor (aşırı yoğun nav, çok fazla eşzamanlı kontrol,
ağır glassmorphism → tek odaklı akışlar, tek accent rengi, düz yüzeyler).

- **`docs/DESIGN.md`** — 5 ekranı (Dashboard, Reading, Quiz, Flashcards,
  Navigation) kapsayan tam spesifikasyon. UI değiştirmeden önce oku.
- **`docs/design/redesign-reference-mockups.html`** — düşük/orta fidelity
  görsel referans (üretim kodu değil, birebir kopyalanmaz).
- **`TODO.md`** — bu redesign'ın iş takibi. Yeni bir ekranı ele almadan önce
  buradaki ilgili maddeyi `in_progress` yap, bitirince işaretle.

Yeni UI kodu yazarken: `docs/DESIGN.md`'deki tasarım tokenlerini
(`--bg`, `--text`, `--accent`, `--border`, `--glass`) olduğu gibi kullan,
yeni renk icat etme. Kararı verilmiş yönler: tek accent rengi (altın), az
gradient/blur (gerçek glass sadece modal/sheet gibi overlay'lerde), dekoratif
emoji/Unicode ikon glyph'i yok.

## Yapay zeka prompt'ları

Tüm Groq/Gemini prompt'ları **`src/constants/prompts.js`** dosyasında
merkezileşmiştir — katalog ve gerekçe için `docs/AI_PROMPTS.md`'ye bak. Yeni
bir AI çağrısı eklerken prompt'u component/route içine inline yazma; burada
adlandırılmış bir `buildXPrompt(...)` fonksiyonu olarak ekle ve model adını
`AI_MODELS.FAST` / `AI_MODELS.SMART` üzerinden kullan.

## Mimari notları

- Route grupları: `src/app/(app)/*` girişli kullanıcı alanı (ortak nav/AI
  widget'ları `src/app/(app)/layout.js`'te), `src/app/admin/*` yönetici
  paneli, `src/app/api/*` route handler'ları (çoğu Groq/Gemini/Wikipedia'ya
  proxy).
- Firestore erişimi `src/lib/firestore.js` üzerinden tek noktadan yapılır;
  sayfalarda doğrudan `firebase/firestore` import etmek yerine oradaki
  `subscribeToUserWords`, `subscribeToUserStats` gibi hook benzeri
  fonksiyonları kullan.
- Stil: proje genelinde `<style jsx>` bloklarıyla component-scoped CSS +
  paylaşılan sınıflar/değişkenler için `src/styles/globals.css`
  (~6800 satır). Yeni ortak bir kalıp (glass kart, gradient, medya sorgusu)
  yazacaksan önce `globals.css`'te zaten var mı diye bak — tekrar üretme.
- `admin`, `linefocus` gibi ayrı platform/panel bölümleri kendi
  `layout.js`'lerinde farklı davranabilir; `src/app/(app)/layout.js`
  içindeki `pathname === "/linefocus"` kontrolüne dikkat et.

## Notlar

- `Yeni Metin Belgesi (2).txt` ve kökteki tanımsız binary `ydtfocus` dosyası
  (yanlışlıkla commit edilmiş bir imza/sertifika parçası) bu redesign
  kapsamında temizlendi — kökte artık böyle "kaynağı belirsiz" dosyalar
  olmamalı.
- `src/app/(app)/flashcards/page.js` (eski, hiçbir yerden link verilmeyen
  flashcards ekranı) silindi; aktif ekran `flashcards-hub`'dır.
