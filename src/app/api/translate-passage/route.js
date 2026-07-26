import { NextResponse } from "next/server";
import { AI_MODELS, buildPassageTranslationPrompt } from "@/constants/prompts";

export const runtime = "edge";

// Pasaj Türkçe çevirisi — okuma metni İngilizce olarak birincil gösterilir,
// bu uç yalnızca kullanıcı "Türkçe Göster" toggle'ını açtığında istenir.
export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Metin eksik" }, { status: 400 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODELS.FAST,
        messages: [{ role: "user", content: buildPassageTranslationPrompt(text) }],
        temperature: 0.1,
      }),
    });
    const data = await response.json();
    const tr = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ tr });
  } catch (error) {
    console.error("Passage translation error:", error);
    return NextResponse.json({ error: "Çeviri hatası" }, { status: 500 });
  }
}
