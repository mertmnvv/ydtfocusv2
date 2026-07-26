const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

// ===== Ortak yardımcılar =====
// getWeekNumber, ydtfocus-mobile/src/lib/firestore.ts'teki AYNI ISO
// hafta hesabı — çark'ın haftalık sınırı iki tarafta da tutarlı olsun.
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// SPIN_PRIZES, ydtfocus-mobile/src/constants/spin-wheel.ts ile AYNI
// ağırlıklar — iki tarafta da değişirse elle senkron edilmeli.
const SPIN_PRIZES = [
  { days: 0, label: "Bir Dahaki Sefere", weight: 50 },
  { days: 1, label: "1 Gün Premium", weight: 30 },
  { days: 3, label: "3 Gün Premium", weight: 15 },
  { days: 7, label: "7 Gün Premium", weight: 5 },
];
const MAX_AD_SPINS_PER_WEEK = 2;

function pickSpinPrize(prizes) {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const prize of prizes) {
    if (roll < prize.weight) return prize;
    roll -= prize.weight;
  }
  return prizes[0];
}

// config/spinWheel dökümanı artık admin panelinden düzenlenebiliyor
// (bkz. src/app/admin/spin-wheel/page.js + src/lib/firestore.js
// getSpinWheelConfig/saveSpinWheelConfig). Doküman yoksa/boşsa yukarıdaki
// SPIN_PRIZES sabitine düşülür — çark hiçbir zaman kırılmaz. Bilinçli
// olarak transaction DIŞINDA, tek seferlik bir okuma: ağırlıklar
// per-user tutarlılık gerektirmiyor, sadece admin panelinden anlık
// güncel değeri yansıtması yeterli.
async function getActiveSpinPrizes() {
  try {
    const snap = await db.collection("config").doc("spinWheel").get();
    const prizes = snap.exists ? snap.data()?.prizes : null;
    if (Array.isArray(prizes) && prizes.length > 0) return prizes;
  } catch (err) {
    console.error("spinWheel config okunamadı, varsayılana düşülüyor:", err);
  }
  return SPIN_PRIZES;
}

function premiumUntilMs(value) {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? 0 : ms;
}

function generateGiftCode() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Giriş yapmanız gerekiyor.");
  }
  return request.auth.uid;
}

// ===== spinWheel =====
// Çark çevirme hakkını ve ödülü SUNUCU tarafında belirler — client artık
// pickSpinPrize'ı kendi çağırmıyor (bkz. ydtfocus-mobile/src/lib/functions.ts),
// aksi halde client kendi kazandığı ödülü uydurabilirdi. Kazanılan ödül
// users/{uid}/data/wheel.pendingPrize'a yazılır (bu alan client'a
// KAPALI, bkz. firestore.rules) — claimWheelPrize bunu okuyup kullanır.
exports.spinWheel = onCall(async (request) => {
  const uid = requireAuth(request);
  const mode = request.data?.mode === "ad" ? "ad" : "free";

  const wheelRef = db.collection("users").doc(uid).collection("data").doc("wheel");
  const now = new Date();
  const thisWeek = getWeekNumber(now);
  const prizes = await getActiveSpinPrizes();

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(wheelRef);
    const data = snap.exists ? snap.data() : {};

    if (mode === "free") {
      if (data.lastFreeSpinWeek === thisWeek) {
        throw new HttpsError("failed-precondition", "Bu haftaki ücretsiz hakkın bitti.");
      }
    } else {
      const usedThisWeek = data.lastAdSpinWeek === thisWeek ? data.adSpinsUsedThisWeek || 0 : 0;
      if (usedThisWeek >= MAX_AD_SPINS_PER_WEEK) {
        throw new HttpsError("failed-precondition", "Bu hafta için ekstra hakların bitti.");
      }
    }

    const prize = pickSpinPrize(prizes);

    const updates = { pendingPrize: { days: prize.days, label: prize.label, wonAt: Date.now() } };
    if (mode === "free") {
      updates.lastFreeSpinWeek = thisWeek;
    } else {
      const usedThisWeek = data.lastAdSpinWeek === thisWeek ? data.adSpinsUsedThisWeek || 0 : 0;
      updates.lastAdSpinWeek = thisWeek;
      updates.adSpinsUsedThisWeek = usedThisWeek + 1;
    }

    tx.set(wheelRef, updates, { merge: true });
    return prize;
  });

  return result;
});

// ===== claimWheelPrize =====
// Bir önceki spinWheel çağrısının pendingPrize'ını kendine kullan veya
// hediye kodu olarak devret. pendingPrize client tarafından
// yazılamadığından (firestore.rules), burada güvenle güveniliyor.
exports.claimWheelPrize = onCall(async (request) => {
  const uid = requireAuth(request);
  const action = request.data?.action === "gift" ? "gift" : "self";

  const wheelRef = db.collection("users").doc(uid).collection("data").doc("wheel");
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const wheelSnap = await tx.get(wheelRef);
    const pendingPrize = wheelSnap.exists ? wheelSnap.data().pendingPrize : null;
    if (!pendingPrize || typeof pendingPrize.days !== "number") {
      throw new HttpsError("failed-precondition", "Önce çarkı çevirmelisin.");
    }

    if (pendingPrize.days === 0) {
      tx.set(wheelRef, { pendingPrize: null }, { merge: true });
      return { ok: true };
    }

    if (action === "self") {
      const userSnap = await tx.get(userRef);
      const current = userSnap.exists ? userSnap.data() : {};
      const baseMs = Math.max(premiumUntilMs(current.premiumUntil), Date.now());
      tx.update(userRef, {
        role: "premium",
        premiumUntil: new Date(baseMs + pendingPrize.days * 86400000).toISOString(),
      });
      tx.set(wheelRef, { pendingPrize: null }, { merge: true });
      return { ok: true };
    }

    // action === "gift"
    const userSnap = await tx.get(userRef);
    const fromName = userSnap.exists ? userSnap.data().displayName || "Bir arkadaşın" : "Bir arkadaşın";
    const code = generateGiftCode();
    const codeRef = db.collection("giftCodes").doc(code);
    tx.set(codeRef, {
      code,
      fromUid: uid,
      fromName,
      days: pendingPrize.days,
      source: "wheel",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      redeemed: false,
      redeemedBy: null,
      redeemedAt: null,
    });
    tx.set(wheelRef, { pendingPrize: null }, { merge: true });
    return { ok: true, giftCode: code };
  });
});

// ===== redeemGiftCode =====
// Hediye kodu kullanma — artık tamamen sunucu tarafında (client'ın
// giftCodes'a hiç erişimi yok, bkz. firestore.rules).
exports.redeemGiftCode = onCall(async (request) => {
  const uid = requireAuth(request);
  const rawCode = request.data?.code;
  if (!rawCode || typeof rawCode !== "string") {
    throw new HttpsError("invalid-argument", "Kod gerekli.");
  }
  const code = rawCode.trim().toUpperCase();

  const codeRef = db.collection("giftCodes").doc(code);
  const userRef = db.collection("users").doc(uid);

  return db.runTransaction(async (tx) => {
    const codeSnap = await tx.get(codeRef);
    if (!codeSnap.exists) throw new HttpsError("not-found", "Kod bulunamadı.");
    const giftData = codeSnap.data();
    if (giftData.redeemed) throw new HttpsError("failed-precondition", "Bu kod zaten kullanılmış.");
    if (giftData.fromUid === uid) throw new HttpsError("permission-denied", "Kendi kodunu kullanamazsın.");

    const userSnap = await tx.get(userRef);
    const current = userSnap.exists ? userSnap.data() : {};
    const baseMs = Math.max(premiumUntilMs(current.premiumUntil), Date.now());

    tx.update(codeRef, { redeemed: true, redeemedBy: uid, redeemedAt: admin.firestore.FieldValue.serverTimestamp() });
    tx.update(userRef, {
      role: "premium",
      premiumUntil: new Date(baseMs + giftData.days * 86400000).toISOString(),
    });

    return { days: giftData.days };
  });
});
