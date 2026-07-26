import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAndroidSubscriptionPurchase } from "@/lib/playBilling";
import admin from "firebase-admin";

// Mobil (ydtfocus-mobile) uygulamasında Play Billing ile satın alınan
// premium aboneliği doğrular ve users/{uid}'i günceller — PayTR
// callback'iyle (src/app/api/paytr/callback/route.js) AYNI alan
// isimlerini/formatını kullanır (premiumUntil: ISO tarih string'i,
// role: "premium", premiumType) — mobil ve web aynı Firestore
// dökümanını okuduğundan format tutarlılığı şart.
const PREMIUM_PRODUCT_TYPE = {
  premium_monthly: "monthly",
  premium_yearly: "yearly",
};

export async function POST(req) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Sunucu yapılandırması eksik" }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Yetkilendirme eksik" }, { status: 401 });
    }
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const { purchaseToken, productId } = await req.json();
    const premiumType = PREMIUM_PRODUCT_TYPE[productId];
    if (!purchaseToken || !premiumType) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const result = await verifyAndroidSubscriptionPurchase(purchaseToken);
    if (!result.valid || !result.expiryTime) {
      return NextResponse.json({ error: "Abonelik doğrulanamadı" }, { status: 400 });
    }

    await adminDb.collection("users").doc(uid).update({
      role: "premium",
      premiumUntil: result.expiryTime,
      premiumType,
      premiumSource: "play_billing",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ premiumUntil: result.expiryTime });
  } catch (error) {
    console.error("verify-subscription error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
