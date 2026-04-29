import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export const runtime = "edge";

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json();

    const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GEMINI_API_KEY) {
      return new Response("Gemini API Key missing", { status: 500 });
    }

    const encoder = new TextEncoder();

    // GEMINI DENEMESİ
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: systemPrompt 
      });

      // Mesajları Gemini formatına çevir (Son 10 mesaj)
      const history = messages.slice(-10).map(m => ({
        role: m.role === "ai" || m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const lastUserMsg = history.pop()?.parts[0].text || "";

      const chat = model.startChat({
        history: history,
      });

      const result = await chat.sendMessageStream(lastUserMsg);

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                controller.enqueue(encoder.encode(chunkText));
              }
              controller.close();
            } catch (e) {
              console.error("Gemini Stream Error:", e);
              controller.error(e);
            }
          }
        }),
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );

    } catch (geminiError) {
      console.error("Gemini failed, falling back to Groq:", geminiError);
      
      // GROQ FALLBACK
      if (!GROQ_API_KEY) {
        return new Response("Both APIs failed.", { status: 500 });
      }

      const groq = new Groq({ apiKey: GROQ_API_KEY });
      const groqResponse = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.slice(-10).map(m => ({
            role: m.role === "ai" ? "assistant" : "user",
            content: m.content
          }))
        ],
        model: "llama-3.1-8b-instant",
        stream: true,
      });

      return new Response(
        new ReadableStream({
          async start(controller) {
            for await (const chunk of groqResponse) {
              const content = chunk.choices[0]?.delta?.content || "";
              controller.enqueue(encoder.encode(content));
            }
            controller.close();
          }
        }),
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

  } catch (error) {
    console.error("Critical API Error:", error);
    return new Response("Sunucu hatası oluştu.", { status: 500 });
  }
}
