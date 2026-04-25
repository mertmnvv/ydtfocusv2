import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import "@/styles/globals.css";

export const metadata = {
  metadataBase: new URL("https://ydtfocus.vercel.app"),
  title: {
    default: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
    template: "%s | YDT Focus",
  },
  description: "YDT ve YDS sınavlarına hazırlık için yapay zeka destekli, modern ve bilimsel tabanlı çalışma platformu. Kelime bankası, okuma pratiği ve akıllı tekrar sistemi.",
  keywords: ["YDT", "YDS", "İngilizce Hazırlık", "Akademik Kelimeler", "Dil Öğrenme", "AI Dil Eğitimi", "YDT Focus"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
    description: "Yapay zeka ile akademik İngilizce artık daha kolay.",
    url: "https://ydtfocus.vercel.app",
    siteName: "YDT Focus",
    locale: "tr_TR",
    type: "website",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YDT Focus — AI Destekli Dil Öğrenme Platformu",
    description: "Yapay zeka ile akademik İngilizce artık daha kolay.",
    images: ["/opengraph-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/icon-512.png",
  },
};

export const viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "YDT Focus",
    "url": "https://ydtfocus.vercel.app",
    "logo": "https://ydtfocus.vercel.app/opengraph-image.png",
    "description": "YDT ve YDS sınavlarına hazırlık için yapay zeka destekli dil öğrenme platformu.",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
  };

  return (
    <html lang="tr" data-scroll-behavior="smooth">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
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
