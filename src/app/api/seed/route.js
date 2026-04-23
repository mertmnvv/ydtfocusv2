import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Eski data.js dosyasını bul
    const possiblePaths = [
      path.join(process.cwd(), "..", "YDTFOCUS-main", "data.js"),
      path.join(process.cwd(), "data.js"),
    ];

    let dataPath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) { dataPath = p; break; }
    }

    if (!dataPath) {
      return NextResponse.json({
        success: false,
        error: "data.js bulunamadı. YDTFOCUS-main klasörünün ydtfocus yanında olduğundan emin olun.",
      });
    }

    const rawContent = fs.readFileSync(dataPath, "utf-8");

    // Regex ile kelime objelerini çıkart
    let archiveData = [];
    let phrasalData = [];

    // ydtArchiveData — { word: "...", meaning: "...", syn: "..." } formatı
    const archiveRegex = /\{\s*word:\s*"([^"]+)"\s*,\s*meaning:\s*"([^"]+)"\s*(?:,\s*syn:\s*"([^"]*)")?\s*(?:,\s*level:\s*"([^"]*)")?\s*\}/g;
    const archiveSection = rawContent.match(/const\s+ydtArchiveData\s*=\s*\[([\s\S]*?)\];/);
    if (archiveSection) {
      let m;
      while ((m = archiveRegex.exec(archiveSection[1])) !== null) {
        archiveData.push({ word: m[1], meaning: m[2], syn: m[3] || "", level: m[4] || "" });
      }
    }

    // ydtPhrasalVerbs — { phrase: "...", meaning: "...", syn: "..." } formatı
    const phrasalRegex = /\{\s*phrase:\s*"([^"]+)"\s*,\s*meaning:\s*"([^"]+)"\s*(?:,\s*syn:\s*"([^"]*)")?\s*\}/g;
    const phrasalSection = rawContent.match(/const\s+ydtPhrasalVerbs\s*=\s*\[([\s\S]*?)\];/);
    if (phrasalSection) {
      let m;
      while ((m = phrasalRegex.exec(phrasalSection[1])) !== null) {
        phrasalData.push({ phrase: m[1], meaning: m[2], syn: m[3] || "" });
      }
    }

    // Oxford packs de dahil et
    const oxfordRegex = /const\s+(oxfordMegaPack\d+)\s*=\s*\[([\s\S]*?)\];/g;
    let oxMatch;
    while ((oxMatch = oxfordRegex.exec(rawContent)) !== null) {
      const wordRegex = /\{\s*word:\s*"([^"]+)"\s*,\s*meaning:\s*"([^"]+)"\s*(?:,\s*syn:\s*"([^"]*)")?\s*(?:,\s*level:\s*"([^"]*)")?\s*\}/g;
      let wm;
      while ((wm = wordRegex.exec(oxMatch[2])) !== null) {
        archiveData.push({ word: wm[1], meaning: wm[2], syn: wm[3] || "", level: wm[4] || "" });
      }
    }

    return NextResponse.json({
      success: true,
      archiveCount: archiveData.length,
      phrasalCount: phrasalData.length,
      archiveData,
      phrasalData,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
