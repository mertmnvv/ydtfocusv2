import { NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

const MORNING_NOTIFICATIONS = [
  {
    title: "Yeni Güne Yeni Kelimeler ☀️",
    body: "Güne 5 yeni akademik kelime ile başlamaya ne dersin? Hedefine bir adım daha yaklaş."
  },
  {
    title: "YDT Maratonu Devam Ediyor 🏃‍♂️",
    body: "Sabah serinliğinde okuma pratiği yapmak odaklanmanı artırır. Haydi başlayalım!"
  },
  {
    title: "Zihnini Tazele 🧠",
    body: "Kelime bankandaki tekrarları tamamlayarak güne verimli bir başlangıç yap."
  }
];

const EVENING_NOTIFICATIONS = [
  {
    title: "Günün Hasadı 🌙",
    body: "Bugün öğrendiğin her şeyi pekiştirme vakti. Kısa bir tekrar kalıcılığı artırır."
  },
  {
    title: "Uykudan Önce Son Dokunuş ✨",
    body: "Yeni öğrendiğin kelimelerin kalıcı olması için son bir göz atmaya ne dersiniz?"
  },
  {
    title: "Başarı Sürekliliktir 🏆",
    body: "Bugünkü hedeflerini tamamladın mı? Kontrol etmek ve serini korumak için tıkla."
  }
];

export async function GET(request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!adminDb || !adminMessaging) {
      throw new Error("Firebase Admin SDK is not initialized. Check environment variables.");
    }

    const now = new Date();
    const turkeyHour = (now.getUTCHours() + 3) % 24;

    let pool = [...MORNING_NOTIFICATIONS, ...EVENING_NOTIFICATIONS];
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
