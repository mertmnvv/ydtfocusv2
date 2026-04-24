import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

const NOTIFICATION_TYPES = [
  {
    title: "Çalışma Vakti! 📚",
    body: "Bugün yeni kelimeler öğrenmeye ne dersin? Hedeflerine ulaşmak için küçük bir adım at.",
  },
  {
    title: "Serini Bozma! 🔥",
    body: "Harika bir ilerleme kaydediyorsun. Bugünün hedefini tamamlamak için sadece 5 dakikanı ayır.",
  },
  {
    title: "Hafızanı Tazele! 🧠",
    body: "Bankandaki kelimeler tekrar edilmeyi bekliyor. Akıllı tekrar ile bilgilerini pekiştir.",
  },
  {
    title: "Günün Motivasyonu ✨",
    body: "Dil öğrenmek sabır işidir. Bugün öğrendiğin her kelime seni hedefine bir adım daha yaklaştırır.",
  },
  {
    title: "Kelime Avı Başladı! 🎯",
    body: "Arşivde keşfedilmeyi bekleyen binlerce akademik kelime var. Göz atmaya ne dersiniz?",
  }
];

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  
  // Security check for Cron
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const usersSnapshot = await adminDb.collection("users").get();
    const tokens = [];
    const messages = [];

    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.fcmToken) {
        // Pick a random notification type
        const randomType = NOTIFICATION_TYPES[Math.floor(Math.random() * NOTIFICATION_TYPES.length)];
        
        messages.push({
          token: userData.fcmToken,
          notification: {
            title: randomType.title,
            body: randomType.body,
          },
          webpush: {
            notification: {
              icon: "https://ydtfocus.vercel.app/icon-512.png", // Replace with your production URL if different
            },
          },
        });
      }
    });

    if (messages.length === 0) {
      return NextResponse.json({ message: "No tokens found" });
    }

    // Send messages in batches (FCM limit is 500 per request, but admin.messaging().sendEach is easier)
    const response = await adminMessaging.sendEach(messages);

    return NextResponse.json({ 
      success: true, 
      sentCount: response.successCount, 
      failureCount: response.failureCount 
    });

  } catch (error) {
    console.error("Notification Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
