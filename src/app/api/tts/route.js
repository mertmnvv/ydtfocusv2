import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { text, voice } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Google Translate TTS API - Hem kararlı hem de kaliteli bir "doğal" ses sunar.
    // Edge-TTS websocket sorunlarına karşı en iyi ve en hızlı alternatif.
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=en&client=tw-ob`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error("Google TTS sunucusu yanıt vermedi");
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error("TTS API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
