importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD41GCUqXJDryylH78RRov87vfVUk2GkWk",
  authDomain: "ydtfocus.firebaseapp.com",
  projectId: "ydtfocus",
  storageBucket: "ydtfocus.firebasestorage.app",
  messagingSenderId: "856274397620",
  appId: "1:856274397620:web:b2c5328d5cf85ce4eceae1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-512.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
