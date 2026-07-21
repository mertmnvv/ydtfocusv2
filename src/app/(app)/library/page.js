"use client";

import Link from "next/link";

const PRIMARY_MODES = [
  { href: "/reading", label: "Okuma", desc: "AI destekli akademik pasajlar" },
  { href: "/quiz", label: "Quiz", desc: "Karma tur ve hatalar testi" },
  { href: "/flashcards-hub", label: "Kartlar", desc: "Kelime desteleri oluştur, çalış" },
  { href: "/grammar", label: "Gramer", desc: "Yapı ve zaman konuları" },
];

const SECONDARY_LINKS = [
  { href: "/archive", label: "Sözlük", desc: "Kaydettiğin kelimeler" },
  { href: "/mistakes", label: "Hatalarım", desc: "Yanlış bildiklerin" },
  { href: "/hero", label: "Zero to Hero", desc: "Adım adım seviye atlama" },
];

export default function LibraryPage() {
  return (
    <div className="library-page">
      <div className="library-eyebrow">Bir çalışma modu seç</div>
      <div className="library-grid">
        {PRIMARY_MODES.map((m) => (
          <Link key={m.href} href={m.href} className="library-card">
            <span className="library-card-label">{m.label}</span>
            <span className="library-card-desc">{m.desc}</span>
          </Link>
        ))}
      </div>

      <div className="library-eyebrow library-eyebrow-secondary">Kaynaklar</div>
      <div className="library-secondary-grid">
        {SECONDARY_LINKS.map((m) => (
          <Link key={m.href} href={m.href} className="library-secondary-card">
            <span className="library-card-label">{m.label}</span>
            <span className="library-card-desc">{m.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
