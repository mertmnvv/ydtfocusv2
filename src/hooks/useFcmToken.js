// "use client";

// import { useEffect, useState } from "react";
// import { messaging } from "@/lib/firebase";
// import { getToken, onMessage } from "firebase/messaging";
// import { updateFcmToken } from "@/lib/firestore";
// import { useNotification } from "@/context/NotificationContext";

// const VAPID_KEY = "BHF58OkwU2lzK_-pmHFh0rC0jJ5892PhZ13SwUreEqMI7VHT-scE13GApAEcvyufJFBpmzyP4gcSmyGVh2WtVQs";

// export const useFcmToken = (user) => {
//   const [token, setToken] = useState(null);
//   const { showNotification } = useNotification();

//   useEffect(() => {
//     if (!user || !messaging) return;

//     const requestPermission = async () => {
//       try {
//         const permission = await Notification.requestPermission();
//         if (permission === "granted") {
//           const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
//           if (currentToken) {
//             setToken(currentToken);
//             await updateFcmToken(user.uid, currentToken);
//           }
//         }
//       } catch (error) {
//         console.error("FCM Token Error:", error);
//       }
//     };

//     requestPermission();

//     // Handle foreground messages
//     const unsubscribe = onMessage(messaging, (payload) => {
//       console.log("Foreground Message:", payload);
//       showNotification(payload.notification.title + ": " + payload.notification.body, "info", 5000);
//     });

//     return () => unsubscribe();
//   }, [user, showNotification]);

//   return token;
// };
