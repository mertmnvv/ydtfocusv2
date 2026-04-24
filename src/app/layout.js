import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import "@/styles/globals.css";

export const metadata = {
  title: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
  description: "YDT/YDS sınavlarına hazırlık için yapay zeka destekli modern çalışma platformu.",
  openGraph: {
    siteName: "YDT Focus",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 512,
        height: 512,
        alt: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
    description: "Yapay zeka ile akademik İngilizce artık daha kolay.",
    images: ["/opengraph-image.png"],
  },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0a0a0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="YDT Focus" />
        <link rel="apple-touch-icon" href="/opengraph-image.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
        />
      </head>
      <body>
        <AuthProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
