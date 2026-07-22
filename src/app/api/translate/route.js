import { NextResponse } from "next/server";
import { AI_MODELS, buildWordLookupPrompt } from "@/constants/prompts";

export async function POST(request) {
  try {
    const { word } = await request.json();
    if (!word) return NextResponse.json({ error: "Kelime eksik" }, { status: 400 });

    const clean = word.trim().toLowerCase();

    // ──────────── 1. Free Dictionary API (öncelik) ────────────
    try {
      const dictResp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`);
      
      if (dictResp.ok) {
        const dictData = await dictResp.json();
        const entry = dictData[0];

        // Fonetik ve İngilizce tanım (sözlükten bulunamazsa AI'nin
        // ürettiği tanımla üzerine yazılır)
        const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || "";
        let definition = "";
        for (const meaning of entry.meanings || []) {
          if (!definition && meaning.definitions?.[0]?.definition) {
            definition = meaning.definitions[0].definition;
          }
        }

        // Türkçe anlam (1), İngilizce eş anlamlılar (2-3) ve zıt anlam
        // için tek AI çağrısı — sözlük API'sinin eş anlamlı verisi
        // güvenilmez/eksik olduğundan burada AI'ye bırakılır.
        const lookup = await fetchWordLookup(clean);

        return NextResponse.json({
          en: entry.word || clean,
          tr: lookup.tr || "—",
          synonyms: lookup.synonyms || "-",
          antonym: lookup.antonym || "-",
          definition: definition || lookup.definition || "-",
          phonetic: phonetic || "",
          source: "dictionary"
        });
      }
    } catch {
      // Sözlük API başarısız — fallback'e devam et
    }

    // ──────────── 2. AI Fallback (sözlükte bulunamadı) ────────────
    const lookup = await fetchWordLookup(clean);

    return NextResponse.json({
      en: clean,
      tr: lookup.tr || "—",
      synonyms: lookup.synonyms || "-",
      antonym: lookup.antonym || "-",
      definition: lookup.definition || "-",
      phonetic: "",
      source: "ai"
    });

  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json({ en: "", tr: "Hata", synonyms: "-", antonym: "-", definition: "-", phonetic: "", source: "error" }, { status: 500 });
  }
}

async function fetchWordLookup(word) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODELS.FAST,
        messages: [{
          role: "user",
          content: buildWordLookupPrompt(word)
        }],
        response_format: { type: "json_object" },
        temperature: 0.1
      }),
    });
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error("Word lookup error:", err);
    return { tr: "", synonyms: "", antonym: "", definition: "" };
  }
}
