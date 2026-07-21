# YDT Focus — Frontend Yeniden Tasarım Spesifikasyonu

> Kaynak: Ürün sahibiyle yapılan tasarım incelemesinde onaylanan "Simplified UX"
> handoff paketi (`docs/design/redesign-reference-mockups.html` — düşük/orta
> fidelity HTML/CSS referans mockup'ları, üretim kodu DEĞİLDİR). Bu dosya o
> paketin kalıcı, repo içi özetidir; mockup dosyası sadece görsel referans için
> saklanır.

## Neden

Mevcut arayüz aşırı yoğun: 9 öğeli üst nav + ayrı 5 ikonlu mobil alt bar + 9
öğeli hamburger menü + ayrı profil popup'ları, yoğun glassmorphism/gradient
kullanımı, basit işlemler için çok adımlı akışlar. Hedef: kromu azaltmak, aynı
anda sunulan karar sayısını azaltmak, her ekrana tek ve net bir birincil aksiyon
kazandırmak.

## Kapsam ve onaylanan seçenekler

Mockup dosyasında birden fazla alternatif (1a/2a/3-alt vb.) bulunur, sadece
aşağıdaki **kazanan seçenekler** uygulanacaktır — diğerleri sadece bağlam için
tutulmuştur, uygulanmayacaktır:

| Ekran | Seçenek | Başlık |
|---|---|---|
| Dashboard | **1b** | Tek Odak Akışı |
| Reading | **2b** | Ayarlar Tek Sayfada |
| Quiz | **3a** | Nokta İlerleme, Büyük Geri Bildirim |
| Flashcards | **4a** | Tek Oluşturma Akışı, Öne Çıkan Oynat |
| Navigation | **5a** | 4 Sekme + Kütüphane Hub |

**Uygulama prensibi:** Mockup'lardaki HTML/inline-style'lar birebir kopyalanmaz.
Yapı, hiyerarşi ve metin (copy) niyeti nihai kabul edilir; kesin piksel
değerleri, ikon seti ve mikro-etkileşimler geliştiricinin takdirine bırakılır —
ancak renk/radius/font gibi tasarım tokenleri zaten `globals.css`'te nihaidir,
değiştirilmez. Ekranlar mevcut Next.js App Router yapısı içinde, mevcut
Firebase hook'ları (`subscribeToUserWords`, `subscribeToUserStats`, vb.) ve
mevcut component/`<style jsx>` konvansiyonlarıyla yeniden React component'i
olarak inşa edilir.

---

## 1. Dashboard (`src/app/(app)/dashboard/page.js`) → "Tek Odak Akışı"

**Amaç:** Kullanıcıyı istatistik duvarı yerine tek, belirsizliksiz bir sonraki
aksiyona indirmek.

**Web düzeni:**
- Üst nav: solda logo, ortada 3 metin linki (**Bugün**, **Kütüphane**,
  **Rozetler**), sağda avatar (32px, baş harf veya foto).
- Ana içerik: ortalanmış kolon, max-width ~640px, `text-align:center`.
  - Eyebrow etiket: `"{İSİM}, GÜNAYDIN"` — 12px/800/letter-spacing 1.5px, muted.
  - Başlık: `"{N} kelime tekrar bekliyor"` (0 kelime varsa pozitif "her şey
    taze" varyantı) — ~30px/800, `letter-spacing:-1px`.
  - Alt metin: 1 cümle, muted, max-width ~420px.
  - Birincil CTA: solid accent-gold arka plan, siyah metin, 800 weight,
    ~16px 40px padding, `border-radius:14px`. Etiket: **"Tekrara Başla"**
    (veya hiç kelime yoksa **"Sözlüğe Göz At"**).
  - CTA altında: 3 istatistik çifti (seri günü / % kalıcılık / toplam kelime)
    1px dikey ayraçlarla ayrılmış tek satır — kart yok, gradient yok, metrik
    başına renk kodlaması yok.
- Mobil: aynı içerik alt alta, tam genişlik CTA, istatistik satırı CTA altında
  `justify-content:space-around`.
- Alt tab bar (sadece mobil, bkz. Navigasyon): **Bugün** (aktif),
  **Kütüphane**, **Rozetler**, **Profil** — sadece metin, ikon yok.

**Kaldırılacaklar:** çok renkli "bento" istatistik grid'i (turuncu seri/yeşil
kelime/mor haftalık-dakika gradyanları), genişleyen renkli seviye-bar listesi,
rozet popover'ı, aynı scroll'un altına yığılmış leaderboard bloğu (leaderboard
kendi **Rozetler** sekmesine taşınır).

**Veri eşlemesi:** `dueCount` → başlık sayısı ve CTA hedefi (`/srs` due>0 ise,
yoksa `/archive`), `stats.streak`, `masteredCount/total` → kalıcılık %,
`stats.weeklyMinutes` istenirse 4. istatistik olarak tutulabilir — en fazla 3
tutulmalı.

## 2. Reading (`src/app/(app)/reading/page.js`) → "Ayarlar Tek Sayfada"

**Amaç:** Sıfır görünür krom ile bir metni okumak/analiz etmek; tüm
yapılandırma tek bir alt sayfada (bottom sheet) yaşar.

**Web düzeni:**
- Header bar: **Geri** (metin, sol) — pasaj başlığı, kısaltılmış, ortalı —
  **Ayarlar** (metin buton, sağ, ayarlar sheet'ini açar). Bu kadar — varsayılan
  olarak görünür SmartStream anahtarı, Odak Modu anahtarı, seviye `<select>`,
  konu çip satırı YOK.
- Gövde: pasaj metni, geniş padding (~36px 60px web, ~16px 18px mobil),
  `font-size:17px`/`line-height:1.9` (web), `14px`/`1.8` (mobil),
  `var(--text)`. Dokunulan/bilinen kelimeler daha az saturasyonlu ince alt
  çizgi/vurgu alır (mevcut academic-word/is-saved stili korunur, sadece
  soluklaştırılır).
- Footer: ipucu metni ("Kelimeye dokun, anlamını gör") + tek birincil buton
  ("Anladım, Sınava Geç") mevcut 3 soruluk quiz akışına götürür.
- **Ayarlar sheet'i** ("Ayarlar" ile tetiklenir, ya da pasaj seçilmeden önce
  otomatik gösterilir): tek panel, mobilde alttan `border-radius:20px 20px 0 0`
  ile açılan, webde ortalanmış kart, 3 gruplanmış kontrol (web'de yan yana,
  mobilde alt alta):
  - **KAYNAK**: 2 seçenekli segmented control (Wikipedia / AI Üret).
  - **SEVİYE**: 4 seçenekli segmented control (A2/B1/B2/C1) — sadece AI
    kaynağında anlamlı, diğerinde gizlenir.
  - **KONU**: tek dropdown/typeahead alanı (16 çiplik satır + 16 öğelik
    Wikipedia konu listesinin yerine geçer).
  - Ses oynatıcı yok, çeviri kartı flip animasyonu yok, "Kelimelerimle Yaz"
    özel çipi yok — çeviri aynı "Ayarlar" panelinde bir anahtara döner
    ("Türkçe Göster"), 3D kart çevirme yerine; ses oynatma header'daki
    ayarlarda ikonsuz tek "Sesli Oku" metin butonu olarak kalır, hız/seek/
    vurgu-anahtarı hepsi aynı anda görünen kalıcı alt player bar yerine.

**Veri/mantık eşlemesi:** `generateAIText`, `generateWikipediaText`,
`lookupWord`, `startReading`/ses pipeline'ı olduğu gibi kalır — sadece
çevresindeki krom değişir. Konu seçicinin 16 sabit çipi (`TOPICS`,
`WIKI_TOPICS`) "KONU" dropdown'ının seçenek listesi olur.

## 3. Quiz (`src/app/(app)/quiz/page.js`) → "Nokta İlerleme, Büyük Geri Bildirim"

**Amaç:** Zaten oldukça minimal; ilerleme okunabilirliğini ve cevap geri
bildirimini netleştirmek.

**Mod seçim ekranı:** mevcut 2 modu (Karma Tur / Hatalar Testi) yığılmış
kartlar olarak koru, ama çapraz "YENİ" kurdelesini ve ikon SVG'lerini kaldır —
başlık + tek satır açıklama yeterli. Footer ipucu: "Bankanda {N} kelime var".

**Aktif soru ekranı:**
- Üst bar: **Kapat** (metin, sol) — ince gradient progress bar + ayrı sayısal
  sayaç yerine geçen N adet düz progress **nokta/segment** satırı (dolu =
  cevaplanmış, accent = güncel) — sağa hizalı geçen süre (`m:ss`).
- Orta: hedef kelime, 24px/800 weight.
- 4 cevap seçeneği tam genişlik alt alta, `border-radius:12px`, varsayılan
  nötr yüzey. Cevap sonrası: doğru seçenek solid yeşile döner (`#30d158` bg,
  koyu metin), seçilen yanlış seçenek (varsa) solid kırmızıya döner
  (`#ff453a` bg, koyu metin) — sallanma/flaş animasyonu gerekmez, renk
  değişimi geri bildirimin kendisidir.

**Sonuç ekranı:** ikon yerine bir dairenin içinde düz "%{score}" rakamı (onay
işareti glyph'i yok), 3 istatistik karosu (Doğru / Yanlış / Başarı),
"Gözden Geçir" hata listesi değişmez, 2 aksiyon (Ana Menü / Yeniden Başlat).

**Veri eşlemesi:** değişmez — `questions`, `qIdx`, `score`, `answered`,
`results`, `timer` mevcut `quiz/page.js` state'ine 1:1 eşlenir.

## 4. Flashcards (`src/app/(app)/flashcards-hub/page.js`) → "Tek Oluşturma Akışı, Öne Çıkan Oynat"

**Amaç:** Tek oluşturma giriş noktası, deste başına tek net "oynat" aksiyonu.

**Deste grid ekranı:** mevcut deste başına yığılmış kart görselini koru (güzel,
ayırt edici bir dokunuş — değiştirilmeyecek), ama 2 header butonunu
("AI Üret" / "Yeni Deste") **tek** "+ Yeni Deste" butonuyla değiştir. Her
deste karosu isim, "{N} kart · %{pct}" ve ince bir progress bar gösterir —
bugünkü gibi, sadece boşluklar sadeleştirilmiş.

**Oluşturma akışı (tek modal):** üstte 2 seçenekli segmented control —
**AI ile Üret** / **Elle Oluştur** — altındaki form gövdesini değiştirir (artık
2 ayrı modal yok). AI formunun 17 satırlık sabit `<select>`'i
(`AI_CATEGORIES`) aynı kategori listesini öneri olarak sunan bir
**type-to-search** metin alanına döner, yanında Seviye (dropdown) ve Kart
Sayısı (sayı girişi). Gönder: "Üret ve Kaydet".

**Deste yöneticisi (bir desteye dokununca açılır):** en üstte, en büyük,
accent renkli aksiyon olarak **"Hemen Oyna"** (davranış değişmez —
`/flashcards-hub/[deckId]`'e yönlendirir), ardından kompakt bir meta satırı
("{N} kelime · %{pct} biliniyor"), sonra kelime listesi, sonra "+ kelime ekle"
basit bir satır olarak (ayrı bir "sihirli değnek" AI-cümle butonu sabitlenmiş
tam bir ekleme formu değil — AI örnek cümle yardımcısı ekleme satırına
ikincil bir "Örnek cümle öner" metin linki olarak taşınır, ikon buton değil).
Deste silme, birincil aksiyon satırındaki kalıcı çöp ikonu yerine bir overflow
menüsüne (uzun basma veya küçük "..." metin menüsü) taşınır.

**Veri/mantık eşlemesi:** `getUserDecks`, `createUserDeck`, `addGlobalWords`,
`updateUserDeck`, `deleteUserDeck`, `handleGenerateAi`, `handleAddCard`,
`handleMagicWand` aynen kalır — sadece çevresindeki modal/form kromu yeniden
yapılandırılır.

## 5. Navigation (`src/app/(app)/layout.js`) → "4 Sekme + Kütüphane Hub"

**Amaç:** Mevcut 9 linkli üst nav + 5 ikonlu alt bar + 9 öğeli hamburger + ayrı
profil popup'larını, web ve mobilde aynı şekilde kullanılan tutarlı bir
4-hedef modeliyle değiştirmek.

**4 hedef:**
1. **Bugün** — sadeleştirilmiş Dashboard (bkz. Ekran 1).
2. **Kütüphane** — yeni hub ekranı: birincil çalışma modu kartlarından oluşan
   bir grid (**Okuma**, **Quiz**, **Kartlar**, **Gramer**) + ikincil satır
   (**Sözlük**, **Hatalarım**). Bu tek ekran, bugünkü 5 üst-seviye nav
   öğesinin yerine geçer.
3. **Rozetler** — başarılar + leaderboard (bugünkü Dashboard'ın altından
   buraya taşınır).
4. **Profil** — hesap bilgisi, plan/premium durumu, geri bildirim, çıkış
   (bugünkü ayrı profil dropdown'ı + mobil popup + hamburger menünün yerine
   geçer).

**Web:** solda logo, 3 hedef metin linki olarak header'da (**Bugün**,
**Kütüphane**, **Rozetler**), avatar/profil kendi ikonu olarak en sağda —
sadece "Çıkış" ve admin-only linkler için küçük bir menü açar (4. hedef olan
Profil, web'de bu avatar/ikon üzerinden erişilir) — günlük navigasyon asla
dropdown gerektirmez.

**Mobil:** aynı 4 hedef alt tab bar olarak, **sadece etiket, ikon glyph yok**
("emoji/dekoratif ikon glyph yok" yönünde alınan karar gereği — ileride ikon
istenirse tutarlı bir ikon fontu/SVG seti kullanılmalı, karışık Unicode
sembolleri değil). Ayrı hamburger menüsü ve mobil profil bottom-sheet popup'ı
tamamen kaldırılır — içerdikleri her şey artık **Profil** altında yaşar.

**Kütüphane'ye katlanan veri/rotalar:** `/hero`, `/mistakes`, `/archive`,
`/grammar`, `/flashcards-hub`, `/reading`, `/quiz`, `/achievements` sayfa
olarak var olmaya devam eder — artık her zaman görünen 9 üst-seviye link
yerine Kütüphane hub'ı veya Profil üzerinden erişilirler.

---

## Etkileşim ve Davranış

- Flip/3D-kart animasyonu yok (Reading çevirisi, önceden `rotateY`) — inline
  veya ayarlar sheet'inde basit bir göster/gizle anahtarıyla değiştirildi.
- Pulsing/glow CTA animasyonu yok — sadeleştirilmiş ekranlarda görsel gürültü
  zaten az olduğundan tek renkli solid buton yeterli.
- Bottom sheet'ler (Reading ayarları, mobil deste oluşturma) alttan yukarı
  kayar, ~250ms ease-out, backdrop tıklama veya aşağı sürükleme ile kapanır.
- Segmented control'ler (kaynak/seviye/AI-vs-manuel) dokunuşta seçilir, tekli
  seçim, aktif durum = accent-gold arka plan + koyu metin.
- Quiz'de nokta/segment ilerlemesi sorular cevaplandıkça soldan sağa dolar;
  yanında sayısal "x/y" etiketine gerek yok (sadece süre).

## State Yönetimi

Yeni bir state paradigması yok — bu bir UI/IA sadeleştirmesi. Ekran başına
listelenen mevcut hook/subscription'lar değişmez. Eklenecek yeni yerel UI
state'i:
- Reading: `settingsOpen` (bool), ayrı `streamMode`/`sidebarCollapsed`
  görünürlük anahtarlarının yerine geçer (SmartStream modu kaldırılabilir
  veya hâlâ isteniyorsa ayarlar sheet'inde bir anahtar olarak katlanabilir).
- Flashcards: `createTab` ("ai" | "manual"), 2 ayrı `showModal` değerinin
  yerine geçer.
- Navigation: rotadan türetilen tek bir `activeTab`, 9 değer yerine 4 değere
  eşlenir.

## Tasarım Tokenleri (`src/styles/globals.css`'ten — olduğu gibi kullanılır, yeni renk icat edilmez)

- `--bg: #0b0b0c` (koyu tema arka planı)
- `--text: #d1d0c5` (sıcak kırık beyaz metin)
- `--accent: #e2b714` (altın — birincil aksiyonlar, aktif durumlar)
- `--primary: #0a84ff` (mavi — sadece ikincil vurgular, "tek accent rengi"
  yönü gereği az kullanılır)
- `--border: rgba(255,255,255,0.08)`
- `--glass: rgba(255,255,255,0.05)` — mevcut gradient/blur "cam kart"
  yüzeylerinin çoğu, "daha az blur/gradient" yönü gereği düz `#161617`
  benzeri elevated bir solid'e düzleştirilir. Gerçek cam/blur sadece gerçek
  overlay'ler için ayrılır (modallar, sheet'ler).
- Mevcut seviye sisteminden kalan semantik renkler: başarı `#30d158`, hata
  `#ff453a`, uyarı `#ff9f0a`.
- Font: **Inter** (300–900), zaten `layout.js`'te Google Fonts ile yüklü —
  korunur.
- Radius: buton/küçük kartlar için 10–14px, panel/sheet'ler için 16–20px,
  `globals.css`'teki mevcut `border-radius` skalasıyla eşleşir.

## Varlıklar (Assets)

Yeni görsel/ikon varlığı yok. Referans mockup'ları bilinçli olarak ikon
glyph'lerinden kaçınır (dekoratif Unicode/emoji sembollerini kaldırma yönü
gereği) — 4 sekmelik bar veya Kütüphane kartları için ikon isteniyorsa,
karakterler yerine `layout.js`'te zaten dahil olan Font Awesome'dan uygun bir
ikon seti kullanılmalıdır.

## Kaynaklar

- `docs/design/redesign-reference-mockups.html` — yukarıda bahsedilen tüm
  mockup'lar (inceleme turuna göre etiketlenmiş bölümler: Dashboard, Reading,
  Quiz, Flashcards, Navigation; kazanan seçenekler 1b, 2b, 3a, 4a, 5a —
  aynı dosyadaki diğer harfli seçenekler değerlendirilip reddedilmiştir,
  sadece bağlam için tutulur).
- İlerleme takibi için bkz. `/TODO.md`.
