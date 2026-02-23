import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/Header";
import { PwaRegister } from "@/components/PwaRegister";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSiteUrl } from "@/lib/siteUrl";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600"],
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    default: "HifzDeen — Quran Memorization, Recitation & Listening",
    template: "%s | HifzDeen",
  },
  description:
    "An immersive platform for Quran memorization (hifz), recitation, and listening. Learn and reflect with beautiful recitations, translations, and interactive tools.",
  keywords: [
    "HifzDeen",
    "Quran memorization",
    "hifz",
    "Hifzul Quran",
    "Quran recitation",
    "Quran listening",
    "zakat calculator",
    "zakat calculator online",
    "Quran learning",
    "Quran Audio",
    "Quran Mp3",
  ],
  authors: [{ name: "HifzDeen" }],
  creator: "HifzDeen",
  metadataBase: new URL(siteUrl),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "HifzDeen",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "HifzDeen — Quran Memorization, Recitation & Listening",
    description:
      "An immersive platform for Quran memorization, recitation, and listening. Experience the Holy Quran with beautiful recitations and interactive learning tools.",
    type: "website",
    url: siteUrl,
    siteName: "HifzDeen",
  },
  twitter: {
    card: "summary_large_image",
    title: "HifzDeen — Quran Memorization, Recitation & Listening",
    description:
      "An immersive platform for Quran memorization, recitation, and listening.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0f0e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.className} ${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <PwaRegister />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem('hifzdeen-theme');var a=localStorage.getItem('hifzdeen-accent');var r=t==='dark'?'dark':'light';document.documentElement.setAttribute('data-theme',r);document.documentElement.setAttribute('data-accent',a||'green');})();`,
          }}
        />
        <ThemeProvider>
          <div className="relative min-h-screen">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-[-1] h-64 bg-gradient-to-b from-brand/20 to-transparent" />
            <Header />
            <div className="pt-14 sm:pt-16">{children}</div>
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
