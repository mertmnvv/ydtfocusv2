import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

const MORNING_NOTIFICATIONS = [
  { title: "Günaydın! ☀️", body: "Güne yeni bir kelimeyle başlamaya ne dersin? Bugün senin günün olsun." },
  { title: "Sabah Kahvesi ve Kelimeler ☕", body: "Günün ilk okuma pratiğini yapmak için harika bir zaman." },
  { title: "Zihin Taze, Hafıza Açık! 🧠", body: "Sabah saatleri kelime öğrenmek için en verimli saatlerdir. Hadi başlayalım!" }
];

const EVENING_NOTIFICATIONS = [
  { title: "İyi Akşamlar ✨", body: "Günü kapatmadan önce bankandaki kelimelere son bir göz atmak ister misin?" },
  { title: "Günün Yorgunluğunu At 🌙", body: "Kısa bir quiz çözerek bugünün verimli geçmesini sağla." },
  { title: "Uyumadan Önce Son Tekrar 😴", body: "Uykudan önce öğrenilenler akılda daha kalıcı olur. Serini bozma!" }
];

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Türkiye saati tespiti (UTC+3)
    const now = new Date();
    const turkeyHour = (now.getUTCHours() + 3) % 24;
    
    // Saat aralığına göre mesaj havuzunu seç
    let pool = [...MORNING_NOTIFICATIONS, ...EVENING_NOTIFICATIONS]; // Varsayılan karışık
    if (turkeyHour >= 5 && turkeyHour < 14) {
      pool = MORNING_NOTIFICATIONS;
    } else if (turkeyHour >= 17 || turkeyHour < 5) {
      pool = EVENING_NOTIFICATIONS;
    }

    const usersSnapshot = await adminDb.collection("users").get();
    const messages = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmToken) {
        const randomMsg = pool[Math.floor(Math.random() * pool.length)];
        
        messages.push({
          token: userData.fcmToken,
          notification: {
            title: randomMsg.title,
            body: randomMsg.body,
          },
          webpush: {
            notification: {
              icon: "https://ydtfocus.vercel.app/icon-512.png",
            },
          },
        });
      }
    });

    if (messages.length === 0) return NextResponse.json({ message: "No tokens found" });

    const response = await adminMessaging.sendEach(messages);

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount, 
      hour: turkeyHour 
    });

  } catch (error) {
    console.error("Notification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
