import admin from "firebase-admin";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const data = Object.fromEntries(formData.entries());

    const { merchant_oid, status, total_amount, hash } = data;

    // PayTR Bilgileri
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    // Hash Doğrulama
    const hash_str = merchant_oid + merchant_salt + status + total_amount;
    const expected_hash = crypto.createHmac("sha256", merchant_key).update(hash_str).digest("base64");

    if (hash !== expected_hash) {
      console.error("PayTR Callback: Hash mismatch!");
      return new Response("PAYTR: Hash mismatch", { status: 400 });
    }

    if (status === "success") {
      // merchant_oid: YDT-timestamp-uid
      const parts = merchant_oid.split("-");
      const uid = parts[parts.length - 1];

      if (uid && adminDb) {
        const isYearly = parseInt(total_amount) > 30000; // 300 TL üstü yıllık kabul edilir (799.00 TL)
        const durationMonths = isYearly ? 12 : 1;
        
        const now = new Date();
        const expirationDate = new Date();
        expirationDate.setMonth(now.getMonth() + durationMonths);

        await adminDb.collection("users").doc(uid).update({
          role: "premium",
          premiumUntil: expirationDate.toISOString(),
          premiumType: isYearly ? "yearly" : "monthly",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`User ${uid} upgraded to Premium (${isYearly ? 'Yearly' : 'Monthly'})`);
      }
    }

    // PayTR'a "OK" cevabı dönmek zorunludur
    return new Response("OK", { status: 200 });

  } catch (error) {
    console.error("PayTR Callback Error:", error);
    return new Response("Error", { status: 500 });
  }
}
