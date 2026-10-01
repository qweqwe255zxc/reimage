import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Cursor } from "@/components/Cursor";
import { Providers } from "@/components/Providers";
import { SmoothScroll } from "@/components/SmoothScroll";
import { AUTHOR, REPO_URL, SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = Inter_Tight({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "800"], variable: "--font-sans" });
const serif = Cormorant_Garamond({ subsets: ["latin", "cyrillic"], weight: ["500"], style: ["italic"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-mono" });

const title = "ReImage — пиксели одной картинки собирают другую";
const description =
  "ReImage: загрузи фото, и его пиксели перелетят, чтобы собрать другое изображение. Ни один не теряется и не перекрашивается. Работает в браузере, WebGL.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "ReImage",
  authors: [{ name: AUTHOR, url: REPO_URL }],
  keywords: ["ReImage", "pixel morph", "пиксельный морфинг", "морфинг изображений", "WebGL", "pixel art", "image transition"],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ReImage",
    locale: "ru_RU",
    alternateLocale: "en_US",
    title,
    description,
  },
  twitter: { card: "summary_large_image", title, description },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ReImage",
  url: SITE_URL,
  description,
  applicationCategory: "MultimediaApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires WebGL2",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: AUTHOR },
  sameAs: [REPO_URL],
};

export const viewport: Viewport = { themeColor: "#e8e5de" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Providers>
          <SmoothScroll />
          <Cursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
