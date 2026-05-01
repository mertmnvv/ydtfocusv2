import { NextResponse } from "next/server";

// Her konuda birden fazla arama sorgusu — her istekte rastgele biri seçilir
const TOPIC_SEARCH_MAP = {
  animals: [
    "animal kingdom species",
    "mammals evolution wildlife",
    "birds migration ornithology",
    "marine life ocean animals",
    "reptiles amphibians nature",
    "insects entomology biodiversity",
    "endangered species conservation",
  ],
  biography: [
    "famous scientist biography",
    "historical figure biography",
    "famous artist biography",
    "world leader biography",
    "inventor biography life",
    "famous author writer life",
  ],
  geography: [
    "geography country physical",
    "world geography mountains",
    "rivers lakes geography",
    "continents nations culture",
    "capital cities history",
    "deserts geography climate",
  ],
  history: [
    "world history ancient civilization empire",
    "Roman Empire history",
    "Renaissance Europe cultural history",
    "Industrial Revolution economic change",
    "World War II global conflict",
    "Ottoman Empire history",
    "ancient Egypt pharaoh civilization",
    "medieval history feudalism",
  ],
  science: [
    "natural science research discovery",
    "biology evolution genetics",
    "chemistry molecular structure",
    "physics quantum mechanics",
    "neuroscience brain research",
    "paleontology fossil dinosaur",
  ],
  mythology: [
    "Greek mythology gods",
    "Norse mythology legends",
    "Roman mythology deities",
    "Egyptian mythology ancient",
    "folklore legends myths",
    "Celtic mythology folklore",
  ],
  space: [
    "astronomy universe space exploration",
    "NASA space mission astronaut",
    "black hole galaxy cosmology",
    "solar system planets asteroid",
    "exoplanet habitable zone discovery",
  ],
  technology: [
    "technology innovation computer science",
    "artificial intelligence machine learning",
    "robotics automation engineering",
    "cybersecurity information security",
    "Internet of Things smart devices",
  ],
  art: [
    "art painting sculpture visual",
    "Renaissance art Michelangelo Leonardo",
    "modern art contemporary abstract",
    "impressionism Monet Renoir",
    "architecture design building",
  ],
  music: [
    "music history classical composers",
    "jazz history musicians",
    "rock music history bands",
    "traditional folk music instruments",
    "music theory genres",
  ],
  cinema: [
    "cinema film history directors",
    "classic Hollywood movies",
    "foreign language films cinema",
    "documentary filmmaking",
    "film genres history",
  ],
  sports: [
    "sports athletics Olympic games",
    "football soccer FIFA World Cup",
    "basketball NBA history",
    "tennis Grand Slam tournament",
    "martial arts combat sports",
  ],
  landmarks: [
    "world heritage site landmark",
    "famous monuments history",
    "historical buildings architecture",
    "seven wonders of the world",
    "famous bridges structures",
  ],
  food: [
    "food culture cuisine tradition",
    "history of food agriculture",
    "culinary arts cooking techniques",
    "world cuisine traditional dishes",
    "beverage history tea coffee",
  ],
  inventions: [
    "history of technology inventions",
    "famous inventors creations",
    "industrial revolution machines",
    "medical inventions discoveries",
    "communication technology history",
  ]
};

const HEADERS = { "Api-User-Agent": "YDTFocus/1.0 (https://ydtfocus.com)" };

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// AI ile birebir çeviri (Uzunluk ve anlam uyumu için)
async function translateTextWithAI(text) {
  try {
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
          content: `Translate the following English academic text to professional Turkish. Provide ONLY the translation, nothing else.\n\nText:\n${text}`
        }],
        temperature: 0.1,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.error("AI Translation error:", err);
    return "";
  }
}

export async function POST(request) {
  try {
    const { topic } = await request.json();

    let title, extract, thumbnail, url;

    if (topic === "random") {
      const resp = await fetch(
        "https://en.wikipedia.org/api/rest_v1/page/random/summary",
        { headers: HEADERS }
      );
      if (!resp.ok) throw new Error("Wikipedia random API failed");
      const data = await resp.json();
      title = data.title;
      extract = data.extract;
      thumbnail = data.thumbnail?.source || "";
      url = data.content_urls?.desktop?.page || "";
    } else {
      // 1. Rastgele bir arama sorgusu seç
      const queries = TOPIC_SEARCH_MAP[topic] || [topic];
      const searchQuery = pickRandom(queries);
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=30&srnamespace=0&format=json&origin=*`;

      const searchResp = await fetch(searchUrl, { headers: HEADERS });
      const searchData = await searchResp.json();
      const results = searchData.query?.search || [];

      if (results.length === 0) {
        return NextResponse.json({ error: "Makale bulunamadı" }, { status: 404 });
      }

      const picked = results[Math.floor(Math.random() * Math.min(results.length, 20))];
      title = picked.title;

      // 2. Extract + thumbnail
      const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts|pageimages&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

      const extractResp = await fetch(extractUrl, { headers: HEADERS });
      const extractData = await extractResp.json();
      const pages = extractData.query?.pages || {};
      const page = Object.values(pages)[0];

      extract = page?.extract || "";
      thumbnail = page?.thumbnail?.source || "";
      url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
    }

    // Çok kısa ise daha fazla içerik al
    if (extract && extract.split(/\s+/).length < 60) {
      const fullUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=true&exchars=3000&format=json&origin=*`;
      const fullResp = await fetch(fullUrl, { headers: HEADERS });
      const fullData = await fullResp.json();
      const pages = fullData.query?.pages || {};
      const page = Object.values(pages)[0];
      if (page?.extract && page.extract.split(/\s+/).length > extract.split(/\s+/).length) {
        extract = page.extract;
      }
    }

    // 3. AI ile tam çeviri al
    const trText = await translateTextWithAI(extract);

    return NextResponse.json({
      title,
      text: extract,
      tr: trText,
      trTitle: title, // title'ı aynı bırakıyoruz veya çevirebiliriz ama metin çevirisi yeterli
      thumbnail,
      url,
    });

  } catch (error) {
    console.error("Wikipedia API error:", error);
    return NextResponse.json({ error: "Wikipedia bağlantı hatası" }, { status: 500 });
  }
}
