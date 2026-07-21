"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { checkAndGrantBadges, getUserHeroStats, subscribeToUserWords, subscribeToUserStats } from "@/lib/firestore";
import Link from "next/link";

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [words, setWords] = useState([]);
  const [stats, setStats] = useState({ streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubWords = () => { };
    let unsubStats = () => { };

    const setupListeners = async () => {
      try {
        const h = await getUserHeroStats(user.uid);

        unsubWords = subscribeToUserWords(user.uid, (wordList) => {
          if (!isMounted) return;
          setWords(wordList);
          setLoading(false);
        });

        unsubStats = subscribeToUserStats(user.uid, (s) => {
          if (!isMounted) return;
          setStats({ ...(s || {}), streak: s?.streak || 0 });
          checkAndGrantBadges(user.uid, s, words.length, h.levels, words);
        });
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    setupListeners();
    return () => {
      isMounted = false;
      unsubWords();
      unsubStats();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user && stats && words.length > 0) {
      getUserHeroStats(user.uid).then(h => {
        checkAndGrantBadges(user.uid, stats, words.length, h.levels, words);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, stats]);

  if (loading) return <div className="page-loading"><div className="spinner-ring"></div></div>;

  const total = words.length;
  const masteredCount = words.filter(w => w.level >= 4).length;
  const retainedPct = total > 0 ? Math.round((masteredCount / total) * 100) : 0;
  const dueCount = words.filter(w => (w.nextReview || 0) <= Date.now()).length;

  const firstName = (userProfile?.displayName || "Arkadaşım").split(" ")[0];

  return (
    <div className="today-page">
      <div className="today-eyebrow">{firstName.toUpperCase()}, GÜNAYDIN</div>

      {dueCount > 0 ? (
        <>
          <h1 className="today-headline">{dueCount} kelime tekrar bekliyor</h1>
          <p className="today-subtext">Unutma eğrisine yenik düşmeden kelimelerini şimdi tazelemelisin.</p>
        </>
      ) : (
        <>
          <h1 className="today-headline">Harika, her şey taze</h1>
          <p className="today-subtext">Tüm kelimelerin şu an güvende. Sözlüğüne göz atıp yeni kelimeler ekleyebilirsin.</p>
        </>
      )}

      <Link href={dueCount > 0 ? "/srs" : "/archive"} className="today-cta">
        {dueCount > 0 ? "Tekrara Başla" : "Sözlüğe Göz At"}
      </Link>

      <div className="today-stats-row">
        <div className="today-stat">
          <div className="today-stat-value">{stats.streak || 0}</div>
          <div className="today-stat-label">Gün Seri</div>
        </div>
        <div className="today-stat">
          <div className="today-stat-value">%{retainedPct}</div>
          <div className="today-stat-label">Kalıcı</div>
        </div>
        <div className="today-stat">
          <div className="today-stat-value">{total}</div>
          <div className="today-stat-label">Kelime</div>
        </div>
      </div>
    </div>
  );
}
