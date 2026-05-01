import { NextResponse } from "next/server";

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

        // Fonetik
        const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || "";

        // Tanım ve eş anlamlılar
        const allSynonyms = [];
        let definition = "";

        for (const meaning of entry.meanings || []) {
          // İlk tanımı al
          if (!definition && meaning.definitions?.[0]?.definition) {
            definition = meaning.definitions[0].definition;
          }
          // Eş anlamlıları topla
          if (meaning.synonyms?.length) {
            allSynonyms.push(...meaning.synonyms);
          }
          for (const def of meaning.definitions || []) {
            if (def.synonyms?.length) {
              allSynonyms.push(...def.synonyms);
            }
          }
        }

        // En fazla 2 unique eş anlamlı
        const uniqueSyns = [...new Set(allSynonyms)].slice(0, 2).join(", ");

        // Türkçe çeviri için kısa AI isteği
        let turkishMeaning = "";
        try {
          const trResp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ 
                role: "user", 
                content: `Translate the English word "${clean}" to Turkish. Return ONLY the Turkish translation, nothing else. Example: "eloquent" → "belagatli, güzel konuşan"`
              }],
              temperature: 0.1,
              max_tokens: 30
            }),
          });
          const trData = await trResp.json();
          turkishMeaning = trData.choices?.[0]?.message?.content?.trim() || "";
        } catch {
          turkishMeaning = "";
        }

        return NextResponse.json({
          en: entry.word || clean,
          tr: turkishMeaning || "—",
          synonyms: uniqueSyns || "-",
          definition: definition || "-",
          phonetic: phonetic || "",
          source: "dictionary"
        });
      }
    } catch {
      // Sözlük API başarısız — fallback'e devam et
    }

    // ──────────── 2. AI Fallback (sözlükte bulunamadı) ────────────
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ 
          role: "user", 
          content: `Translate the word "${clean}" to Turkish and provide up to 2 English academic synonyms and a short English definition.
          Return ONLY valid JSON: {"en": "${clean}", "tr": "Türkçe karşılığı", "synonyms": "syn1, syn2", "definition": "short English definition"}`
        }],
        response_format: { type: "json_object" },
        temperature: 0.1
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json({
      ...result,
      phonetic: "",
      source: "ai"
    });

  } catch (error) {
    console.error("Translate error:", error);
    return NextResponse.json({ en: "", tr: "Hata", synonyms: "-", definition: "-", phonetic: "", source: "error" }, { status: 500 });
  }
}
