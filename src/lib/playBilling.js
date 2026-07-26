// Google Play Developer API (Android Publisher) ile satın alma doğrulama —
// mobil uygulamadaki (ydtfocus-mobile) Play Billing satın almaları
// (hediye premium + premium abonelik) burada doğrulanıyor. Client asla
// kendi premiumUntil/giftCode'unu doğrudan yazamaz; her satın alma bu
// sunucu tarafı kontrolden geçmek zorunda.
//
// GEREKEN MANUEL KURULUM (kod dışı):
// 1. Play Console > Kullanıcılar ve izinler'de, Firebase Admin SDK
//    servis hesabına ("firebase-adminsdk-...@...iam.gserviceaccount.com",
//    FIREBASE_CLIENT_EMAIL ile aynı) "Finansal veriler, siparişler ve
//    iptal anketi yanıtları" izni verilmeli — aksi halde aşağıdaki
//    istekler 403 döner.
// 2. ANDROID_PACKAGE_NAME ortam değişkeni ayarlanmalı (mobil app.json'daki
//    android.package ile aynı: com.mertmanav.ydtfocus).
import { GoogleAuth } from 'google-auth-library';

const ANDROID_PUBLISHER_SCOPE = 'https://www.googleapis.com/auth/androidpublisher';

function getServiceAccountCredentials() {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^"(.*)"$/, '$1')
    : undefined;
  if (!clientEmail || !privateKey) {
    throw new Error('FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY tanımlı değil — Play Billing doğrulaması yapılamaz.');
  }
  return { client_email: clientEmail, private_key: privateKey };
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  if (!token) throw new Error('Google Play erişim token\'ı alınamadı.');
  return token;
}

function getPackageName() {
  return process.env.ANDROID_PACKAGE_NAME || 'com.mertmanav.ydtfocus';
}

// Tek seferlik satın alma (hediye premium) doğrulaması.
// purchaseState: 0 = satın alındı, 1 = iptal edildi, 2 = bekliyor.
export async function verifyAndroidProductPurchase(productId, purchaseToken) {
  const token = await getAccessToken();
  const packageName = getPackageName();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${productId}/tokens/${purchaseToken}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Play Developer API hatası (${res.status}): ${text}`);
  }
  const data = await res.json();
  return { valid: data.purchaseState === 0, orderId: data.orderId, raw: data };
}

// Abonelik doğrulaması (subscriptionsv2 API — Google'ın önerdiği güncel
// endpoint, eski `purchases.subscriptions` yerine).
export async function verifyAndroidSubscriptionPurchase(purchaseToken) {
  const token = await getAccessToken();
  const packageName = getPackageName();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptionsv2/tokens/${purchaseToken}`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Play Developer API hatası (${res.status}): ${text}`);
  }
  const data = await res.json();
  const activeStates = ['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'];
  const valid = activeStates.includes(data.subscriptionState);
  const expiryTime = data.lineItems?.[0]?.expiryTime; // RFC3339 string — Firestore'a doğrudan yazılabilir
  return { valid, expiryTime, raw: data };
}
