# Yapay Zeka Prompt Kataloğu

Tüm Groq/Gemini prompt'ları artık **`src/constants/prompts.js`** dosyasında
merkezileşmiştir. Daha önce bu prompt'lar `GlobalAI.js`, `reading/page.js`,
`flashcards-hub/page.js`, `hero/page.js`, `linefocus/page.js`,
`HeroAssistant.js` ve birkaç `/api` route'una dağılmış, birbirinden kopya
halde tekrar eden metinlerdi (bkz. `docs/PROJECT_ANALYSIS_REPORT.md`, madde
3). Bu artık tek kaynaktan yönetiliyor.

**Kural:** Yeni bir AI özelliği eklerken prompt'u ilgili component/route
içine inline yazma. `src/constants/prompts.js`'e adlandırılmış bir
`buildXPrompt(...)` fonksiyonu olarak ekle, çağıran taraf sadece import edip
kullansın. Model isimleri de aynı şekilde `AI_MODELS.FAST` /
`AI_MODELS.SMART` üzerinden, string literal olarak tekrar yazılmaz.

## Modeller

| Sabit | Değer | Kullanım |
|---|---|---|
| `AI_MODELS.FAST` | `llama-3.1-8b-instant` | Düşük gecikme gerektiren tüm üretim/analiz/çeviri çağrıları (varsayılan) |
| `AI_MODELS.SMART` | `llama-3.3-70b-versatile` | Katı JSON şeması gereken, hataya daha az toleranslı çağrılar (deste üretimi) |

`api/ai/stream/route.js` önce Gemini (`gemini-1.5-flash`) dener, başarısız
olursa Groq `AI_MODELS.FAST`'e düşer (fallback).

## Prompt envanteri

| Fonksiyon | Kullanan yer | Amaç |
|---|---|---|
| `buildFocusChatSystemPrompt` | `components/GlobalAI.js` | "Focus" global sohbet asistanının sistem promptu (kimlik, dil kuralları, quiz/kelime-ekleme action formatı) |
| `buildSpecialPassagePrompt` | `components/GlobalAI.js` | Kullanıcının hatalı kelimelerinden kişiselleştirilmiş pasaj (kısa/JSON-only) |
| `buildReadingPassagePrompt` | `reading/page.js` (`generateAIText`) | Konu + seviyeye göre AI pasajı üretimi |
| `buildPersonalizedPassagePrompt` | `reading/page.js` (`generateStoryFromMyWords`) | Kullanıcının kelime bankasını/hatalarını entegre eden pasaj |
| `buildTextAnalysisPrompt` | `reading/page.js` (`analyzeTextForStudyDeck`) | Wikipedia pasajından kelime + gramer paterni çıkarma |
| `buildReadingQuizPrompt` | `reading/page.js` (`generateQuiz`) | Pasajdan 3 soruluk quiz üretimi |
| `buildWordTranslationPrompt` | `api/translate/route.js` | Sözlük API'sinden gelen kelimenin Türkçe karşılığı |
| `buildWordLookupFallbackPrompt` | `api/translate/route.js` | Sözlük API'si başarısız olursa tam AI fallback (çeviri+eşanlamlı+tanım) |
| `buildPassageTranslationPrompt` | `api/wikipedia/route.js` | Wikipedia özetinin Türkçeye çevirisi |
| `buildExampleSentencePrompt` | `flashcards-hub/page.js` (`handleMagicWand`) | Tek kelime için örnek cümle |
| `buildFlashcardDeckPrompt` | `api/generate-deck/route.js` | Konu+seviyeden N kelimelik deste üretimi |
| `buildHeroAssistantPrompt` | `components/HeroAssistant.js` | Zero to Hero ders bağlamına özel soru-cevap |
| `buildHeroFillBlankPrompt` | `hero/page.js` | Zero to Hero "boşluk doldurma" egzersiz üretimi |
| `buildLinefocusTopicPrompt` / `buildLinefocusStoryPrompt` / `buildLinefocusVocabPrompt` | `linefocus/page.js` | linefocus platformunun 3 üretim modu (konu / hikaye devamı / kelime bankası) |

## Bu redesign kapsamında yapılan değişiklikler

- Tüm inline prompt string'leri `src/constants/prompts.js`'e taşındı, model
  isimleri `AI_MODELS` sabitine bağlandı — davranış aynı kaldı (bkz. commit
  diff'i), tek istisna: `generateStoryFromMyWords` içinde tanımlanan ama hiç
  kullanılmayan `levelConstraints` objesi artık gerçekten
  `buildPersonalizedPassagePrompt`'a bağlandı (seviyeye göre dil kısıtı
  şimdi fiilen uygulanıyor — önceden ölü koddu).
- Kullanılmayan `src/app/(app)/flashcards/page.js` (eski flashcards ekranı,
  hiçbir yerden link verilmiyordu, `flashcards-hub` onun yerini almıştı)
  silindi — kendi kopya AI prompt'unu da beraberinde götürdü.
- `Focus` sohbet asistanının kuralları (Türkçe konuş, emoji kullanma, quiz
  action formatı) bu redesign'ın "az gürültü, tek accent, gereksiz dekoratif
  öğe yok" yönüyle zaten uyumlu olduğu için içerik olarak değiştirilmedi;
  sadece taşındı.

## Sonraki adımlar (henüz yapılmadı)

- `api/groq/route.js` istemciden gelen `messages`/`systemPrompt`'u doğrudan
  Groq'a ileten genel bir proxy — teorik olarak istemci taraflı herhangi bir
  çağıran, sunucunun API anahtarını kullanarak keyfi bir prompt
  gönderebilir. Kapsam dışı bırakıldı (bu redesign turunun konusu değil) ama
  ileride bir rate-limit/allowlist eklenmesi değerlendirilmeli.
