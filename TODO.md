# TODO — Köklü Frontend Yeniden Tasarımı

Bu dosya, `docs/DESIGN.md`'de tanımlanan redesign'ın iş takibidir. Bir maddeyi
ele almadan önce ilgili `docs/DESIGN.md` bölümünü oku. Sırayla ilerlenmesi
önerilir (Navigasyon önce — diğer 4 ekran ona bağlı çalışır), ama bağımsız
olarak da alınabilirler.

## Altyapı (bu oturumda tamamlandı)

- [x] `CLAUDE.md` / `AGENTS.md` — Türkçe-önce kuralı + proje/redesign
      dokümantasyonuna işaret eden agent talimatları
- [x] `docs/DESIGN.md` — 5 ekranlık redesign spesifikasyonunun kalıcı kaydı
- [x] `docs/design/redesign-reference-mockups.html` — orijinal mockup
      referansı (repo'da saklanıyor)
- [x] `docs/AI_PROMPTS.md` + `src/constants/prompts.js` — dağınık AI
      prompt'larının tek merkeze taşınması
- [x] Kök dizin temizliği — `ydtfocus` (yanlışlıkla commit'lenmiş binary),
      `Yeni Metin Belgesi (2).txt` (boş dosya), `src/app/(app)/flashcards/`
      (kullanılmayan eski ekran) silindi; `DEVELOPMENT_LOG.md` ve
      `PROJECT_ANALYSIS_REPORT.md` `docs/`'a taşındı

## 1. Navigasyon — "4 Sekme + Kütüphane Hub" (5a) — TAMAMLANDI

- [x] `src/app/(app)/layout.js`: 9 linklik üst nav + hamburger + mobil
      profil popup'ı kaldır, 3 metin linki (Bugün/Kütüphane/Rozetler) +
      avatar modeline geç
- [x] Yeni `src/app/(app)/library/page.js` — Kütüphane hub (Okuma/Quiz/
      Kartlar/Gramer birincil, Sözlük/Hatalarım/Zero to Hero ikincil)
- [x] Yeni `src/app/(app)/profile/page.js` — hesap bilgisi, plan/premium
      durumu, geri bildirim, çıkış (mobil 4. tab + web avatar menüsü)
- [x] Mobil alt bar: 4 sekme, sadece metin etiketi (ikon yok)
- [x] `globals.css`: yeni nav/hub/profile sınıfları eklendi, kullanılmayan
      hamburger/mobil-popup kuralları temizlendi

## 2. Dashboard — "Tek Odak Akışı" (1b) — TAMAMLANDI

- [x] `src/app/(app)/dashboard/page.js`: bento grid + rozet popover +
      profil header'ı kaldırıldı, tek CTA akışına indirgendi
- [x] Tek CTA akışı: eyebrow + başlık + alt metin + birincil buton + 3
      istatistik satırı (seri / % kalıcılık / toplam kelime)
- [x] Leaderboard `achievements`/Rozetler sayfasına taşındı
- [x] `globals.css`: artık kullanılmayan `.dash-*`, `.profile-header*`,
      `.profile-large-avatar*`, `.dash-divider` kuralları temizlendi

## 3. Reading — "Ayarlar Tek Sayfada" (2b)

- [ ] Header'ı sadeleştir (Geri / başlık / Ayarlar)
- [ ] Tek "Ayarlar" bottom sheet: Kaynak / Seviye / Konu segmented
      control'leri + "Türkçe Göster" anahtarı
- [ ] Flip-kart çeviri animasyonunu kaldır, kalıcı ses player bar'ını tek
      "Sesli Oku" metin butonuna indir

## 4. Quiz — "Nokta İlerleme, Büyük Geri Bildirim" (3a)

- [ ] Mod seçim kartlarından "YENİ" kurdelesi ve ikon SVG'lerini kaldır
- [ ] Gradient progress bar'ı nokta/segment ilerlemesiyle değiştir
- [ ] Sonuç ekranını dairede düz "%skor" + 3 istatistik karosuna indir

## 5. Flashcards — "Tek Oluşturma Akışı, Öne Çıkan Oynat" (4a)

- [ ] 2 header butonunu tek "+ Yeni Deste"ye indir
- [ ] Tek modal + segmented control (AI ile Üret / Elle Oluştur)
- [ ] Deste yöneticisinde "Hemen Oyna"yı en üste/en büyük aksiyona taşı,
      silmeyi overflow menüsüne al

---

İlerledikçe bu dosyayı güncel tut: bir maddeye başlarken not düş, bitirince
işaretle. Detaylı kabul kriterleri için her zaman `docs/DESIGN.md`'ye
başvur — buradaki maddeler sadece kısa özettir.
