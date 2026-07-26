import { NextResponse } from "next/server";
import { AI_MODELS, buildLevelSimplificationPrompt } from "@/constants/prompts";

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

export const runtime = "edge";

const HEADERS = { 
  "User-Agent": "YDTFocusBot/1.0 (https://ydtfocus.com; mertmanav@gmail.com)",
  "Api-User-Agent": "YDTFocusBot/1.0 (https://ydtfocus.com; mertmanav@gmail.com)" 
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// News in Levels tarzı: A2/B1 için Simple English Wikipedia (zaten
// sade/kısa İngilizce metin), B2/C1 için normal İngilizce Wikipedia
// kullanılır. Pasaj tamamen İngilizce kalır — Türkçe çeviri artık burada
// hesaplanmıyor, /api/translate-passage'a taşındı (yalnızca kullanıcı
// "Türkçe Göster"i açtığında istenir).
const SIMPLE_LEVELS = ["A2", "B1"];

function wikiHost(level) {
  return SIMPLE_LEVELS.includes(level) ? "simple.wikipedia.org" : "en.wikipedia.org";
}

// AI ile metni hedef CEFR seviyesine sadeleştirir. Hata durumunda
// (network/API) sessizce orijinal metni döndürür, route'u çökertmez.
async function simplifyTextForLevel(text, level) {
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
          content: buildLevelSimplificationPrompt(text, level)
        }],
        temperature: 0.3,
      }),
    });
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (err) {
    console.error("AI Simplification error:", err);
    return text;
  }
}

export async function POST(request) {
  try {
    const { topic, level } = await request.json();

    let host = wikiHost(level);
    let title, extract, thumbnail, url, source;

    async function fetchFrom(targetHost) {
      if (topic === "random") {
        const resp = await fetch(
          `https://${targetHost}/api/rest_v1/page/random/summary`,
          { headers: HEADERS }
        );
        if (!resp.ok) throw new Error("Wikipedia random API failed");
        const data = await resp.json();
        return {
          title: data.title,
          extract: data.extract,
          thumbnail: data.thumbnail?.source || "",
          url: data.content_urls?.desktop?.page || "",
        };
      }

      const queries = TOPIC_SEARCH_MAP[topic] || [topic];
      const searchQuery = pickRandom(queries);
      const searchUrl = `https://${targetHost}/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srlimit=30&srnamespace=0&format=json&origin=*`;

      const searchResp = await fetch(searchUrl, { headers: HEADERS });
      const searchData = await searchResp.json();
      const results = searchData.query?.search || [];
      if (results.length === 0) return null;

      const picked = results[Math.floor(Math.random() * Math.min(results.length, 20))];
      const pickedTitle = picked.title;

      const extractUrl = `https://${targetHost}/w/api.php?action=query&titles=${encodeURIComponent(pickedTitle)}&prop=extracts|pageimages&exintro=true&explaintext=true&piprop=thumbnail&pithumbsize=400&format=json&origin=*`;

      const extractResp = await fetch(extractUrl, { headers: HEADERS });
      const extractData = await extractResp.json();
      const pages = extractData.query?.pages || {};
      const page = Object.values(pages)[0];

      return {
        title: pickedTitle,
        extract: page?.extract || "",
        thumbnail: page?.thumbnail?.source || "",
        url: `https://${targetHost}/wiki/${encodeURIComponent(pickedTitle)}`,
      };
    }

    let result = await fetchFrom(host);

    // Simple English Wikipedia'da bu konu/madde yoksa (küçük bir wiki,
    // her başlık için karşılığı olmayabilir) normal İngilizce Wikipedia'ya
    // düş — News in Levels tarzı sadelik olmasa da makale her zaman bulunur.
    if ((!result || !result.extract) && host === "simple.wikipedia.org") {
      host = "en.wikipedia.org";
      result = await fetchFrom(host);
    }

    if (!result) {
      return NextResponse.json({ error: "Makale bulunamadı" }, { status: 404 });
    }

    ({ title, extract, thumbnail, url } = result);
    source = host === "simple.wikipedia.org" ? "simple-wikipedia" : "wikipedia";

    // Çok kısa ise daha fazla içerik al
    if (extract && extract.split(/\s+/).length < 60) {
      const fullUrl = `https://${host}/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&explaintext=true&exchars=3000&format=json&origin=*`;
      const fullResp = await fetch(fullUrl, { headers: HEADERS });
      const fullData = await fullResp.json();
      const pages = fullData.query?.pages || {};
      const page = Object.values(pages)[0];
      if (page?.extract && page.extract.split(/\s+/).length > extract.split(/\s+/).length) {
        extract = page.extract;
      }
    }

    // Simple Wikipedia zaten hedef seviyeye yakın sade İngilizce olduğundan
    // ek AI sadeleştirmesi yalnızca normal Wikipedia'dan gelen (B2/C1 veya
    // simple wiki'de bulunamayıp fallback edilen) metinlere uygulanır.
    const ALLOWED_LEVELS = ["A2", "B1", "B2", "C1"];
    if (extract && source === "wikipedia" && ALLOWED_LEVELS.includes(level)) {
      extract = await simplifyTextForLevel(extract, level);
    }

    return NextResponse.json({
      title,
      text: extract,
      tr: null,
      thumbnail,
      url,
      source,
    });

  } catch (error) {
    console.error("Wikipedia API error:", error);
    return NextResponse.json({ error: "Wikipedia bağlantı hatası" }, { status: 500 });
  }
}
