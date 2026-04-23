import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { word } = await request.json();
    if (!word) return NextResponse.json({ error: "Kelime eksik" }, { status: 400 });

    // Önce otomatik dilden Türkçeye çevirmeyi dene
    const r1 = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=tr&dt=t&q=${encodeURIComponent(word)}`
    );
    const d1 = await r1.json();

    // Eğer girilen kelime zaten Türkçeyse, İngilizceye çevir
    if (d1[2] === "tr") {
      const r2 = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=tr&tl=en&dt=t&q=${encodeURIComponent(word)}`
      );
      const d2 = await r2.json();
      return NextResponse.json({ en: d2[0][0][0].toLowerCase(), tr: word });
    }

    return NextResponse.json({ en: word, tr: d1[0][0][0].toLowerCase() });
  } catch (error) {
    return NextResponse.json({ en: word || "", tr: "Hata" }, { status: 500 });
  }
}
