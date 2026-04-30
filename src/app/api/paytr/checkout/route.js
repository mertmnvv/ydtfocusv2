import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(req) {
  try {
    const { uid, email, displayName, plan } = await req.json();

    if (!uid || !email) {
      return NextResponse.json({ error: "Eksik kullanıcı bilgisi" }, { status: 400 });
    }

    // PayTR Bilgileri (Çevresel değişkenlerden alınacak)
    const merchant_id = process.env.PAYTR_MERCHANT_ID;
    const merchant_key = process.env.PAYTR_MERCHANT_KEY;
    const merchant_salt = process.env.PAYTR_MERCHANT_SALT;

    if (!merchant_id || !merchant_key || !merchant_salt) {
      return NextResponse.json({ error: "PayTR yapılandırması eksik" }, { status: 500 });
    }

    // Fiyat Belirleme
    const payment_amount = plan === "yearly" ? 79900 : 9900; // Kuruş cinsinden (799.00 TL / 99.00 TL)
    const merchant_oid = `YDT-${Date.now()}-${uid}`; // Full UID for identification
    const user_ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const merchant_ok_url = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?status=success`;
    const merchant_fail_url = `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?status=fail`;

    // Sepet İçeriği
    const basket = JSON.stringify([
      [plan === "yearly" ? "Yıllık Elite Üyelik" : "Aylık Elite Üyelik", payment_amount / 100, 1]
    ]);
    const user_basket = Buffer.from(basket).toString("base64");

    // Diğer Parametreler
    const debug_on = 1;
    const test_mode = 1; // Başlangıçta test modu aktif
    const no_installment = 1; // Taksit yok (Abonelik tipi olduğu için)
    const max_installment = 0;
    const currency = "TL";
    const timeout_limit = "30";

    // Hash Hesaplama
    const hash_str = merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode + merchant_salt;
    const paytr_token = crypto.createHmac("sha256", merchant_key).update(hash_str).digest("base64");

    const params = {
      merchant_id,
      user_ip,
      merchant_oid,
      email,
      payment_amount,
      paytr_token,
      user_basket,
      debug_on,
      test_mode,
      no_installment,
      max_installment,
      user_name: displayName || "Kullanıcı",
      user_address: "YDT Focus Digital Service",
      user_phone: "05000000000",
      merchant_ok_url,
      merchant_fail_url,
      timeout_limit,
      currency
    };

    const response = await fetch("https://www.paytr.com/odeme/api/get-token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(params).toString()
    });

    const result = await response.json();

    if (result.status === "success") {
      return NextResponse.json({ token: result.token });
    } else {
      return NextResponse.json({ error: result.reason || "Token alınamadı" }, { status: 500 });
    }

  } catch (error) {
    console.error("PayTR Checkout Error:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
