import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const API_KEY = process.env.GROQ_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Sunucu hatası oluştu." }, { status: 500 });
  }
}
