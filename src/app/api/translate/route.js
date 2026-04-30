import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { word } = await request.json();
    if (!word) return NextResponse.json({ error: "Kelime eksik" }, { status: 400 });

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
          content: `Translate the word "${word}" to Turkish and provide 3 academic synonyms. 
          Return ONLY a valid JSON: {"en": "${word}", "tr": "Türkçe karşılığı", "synonyms": "syn1, syn2, syn3"}`
        }],
        response_format: { type: "json_object" },
        temperature: 0.1
      }),
    });

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ en: word, tr: "Hata", synonyms: "-" }, { status: 500 });
  }
}
