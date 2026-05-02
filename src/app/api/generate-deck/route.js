import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { count = 20, level = "B1", topic = "General" } = await req.json();

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "GROQ_API_KEY is not defined" }, { status: 500 });
    }

    const systemPrompt = `You are an expert English teacher creating vocabulary flashcards for Turkish speakers.
Generate exactly ${count} English vocabulary words suitable for a ${level} proficiency level.
The theme/topic is: ${topic}

Requirements:
- Output MUST be a valid, raw JSON array of objects. Do NOT wrap it in markdown code blocks like \`\`\`json.
- Each object MUST have these exact keys: "word" (English word), "meaning" (Turkish translation), "sentence" (A short, clear ${level}-level English example sentence using the word).
- The words must be highly relevant to the topic.

Example output format:
[
  {"word": "surgery", "meaning": "ameliyat", "sentence": "He needs surgery on his knee."},
  {"word": "prescription", "meaning": "reçete", "sentence": "The doctor wrote a prescription for the pain."}
]`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile", // Use the smartest model to ensure strict JSON output
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Generate the flashcards array now." }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" } // Using json_object might require the prompt to output an object, but we want an array. 
        // Llama supports json mode but expects an object with an array inside.
      }),
    });

    const data = await res.json();
    let text = data.choices[0].message.content.trim();
    
    // Parse the JSON
    // If we used json_object, groq might wrap the array in an object like { "flashcards": [...] }
    let parsed;
    try {
      parsed = JSON.parse(text);
      // Extract array if wrapped
      if (!Array.isArray(parsed)) {
        const key = Object.keys(parsed)[0];
        if (Array.isArray(parsed[key])) {
          parsed = parsed[key];
        } else {
          throw new Error("Could not find array in JSON response");
        }
      }
    } catch (err) {
      // Fallback: try to match array with regex if model failed to output pure JSON
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse JSON array from AI response: " + text);
      }
    }

    return NextResponse.json({ flashcards: parsed });
  } catch (error) {
    console.error("Generate deck API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
