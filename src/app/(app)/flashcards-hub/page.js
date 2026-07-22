"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// /flashcards-hub artık ayrı bir ekran değil — Reading-hub mimarisinde
// Reading üzerinden açılan bir panel (bkz. docs/DESIGN.md, "Sonraki
// karar: Reading-merkezli IA"). Bu sayfa sadece geriye dönük uyumluluk
// için: eski bağlantılar/yer imleri hâlâ buraya gelebilir.
// Not: /flashcards-hub/[deckId] (deste oynatma ekranı) bu redirect'ten
// etkilenmez, kendi route'unda tam sayfa olarak kalmaya devam eder.
export default function FlashcardsHubRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reading?panel=flashcards");
  }, [router]);

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-brand">ydt<span>focus</span></div>
      </div>
    </div>
  );
}
