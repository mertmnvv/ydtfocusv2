import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { verifyAndroidProductPurchase } from "@/lib/playBilling";
import admin from "firebase-admin";

// Mobil (ydtfocus-mobile) uygulamasında Play Billing ile satın alınan
// "hediye premium" ürününü doğrular ve giftCodes/{code} dökümanını
// SUNUCU tarafında oluşturur — client'ın kendi premiumUntil'ini veya
// giftCodes dökümanını doğrudan yazmasına asla izin verilmiyor
// (bkz. ydtfocus-mobile/src/lib/iap.ts, TODO.md "Hediye Premium").
const GIFT_PRODUCT_DAYS = {
  gift_premium_7d: 7,
  gift_premium_30d: 30,
  gift_premium_365d: 365,
};

function generateGiftCode() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`.toUpperCase();
}

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
    const days = GIFT_PRODUCT_DAYS[productId];
    if (!purchaseToken || !days) {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    // Aynı purchaseToken ile iki kere kod üretilmesin (istemci retry'ı vb.)
    const existing = await adminDb
      .collection("giftCodes")
      .where("playPurchaseToken", "==", purchaseToken)
      .limit(1)
      .get();
    if (!existing.empty) {
      const doc = existing.docs[0].data();
      return NextResponse.json({ giftCode: doc.code, days: doc.days });
    }

    const result = await verifyAndroidProductPurchase(productId, purchaseToken);
    if (!result.valid) {
      return NextResponse.json({ error: "Satın alma doğrulanamadı" }, { status: 400 });
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const fromName = userDoc.exists ? userDoc.data().displayName || "Bir kullanıcı" : "Bir kullanıcı";

    const code = generateGiftCode();
    await adminDb.collection("giftCodes").doc(code).set({
      code,
      fromUid: uid,
      fromName,
      days,
      source: "purchase",
      playOrderId: result.orderId || null,
      playPurchaseToken: purchaseToken,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      redeemed: false,
      redeemedBy: null,
      redeemedAt: null,
    });

    return NextResponse.json({ giftCode: code, days });
  } catch (error) {
    console.error("verify-gift error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
