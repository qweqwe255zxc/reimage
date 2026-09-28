import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Cursor } from "@/components/Cursor";
import { Providers } from "@/components/Providers";
import { SmoothScroll } from "@/components/SmoothScroll";
import "./globals.css";

const sans = Inter_Tight({ subsets: ["latin", "cyrillic"], weight: ["400", "500", "600", "800"], variable: "--font-sans" });
const serif = Cormorant_Garamond({ subsets: ["latin", "cyrillic"], weight: ["500"], style: ["italic"], variable: "--font-serif" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], weight: ["400", "500"], variable: "--font-mono" });

const host = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const metadata: Metadata = {
  metadataBase: new URL(host ? `https://${host}` : "http://localhost:3000"),
  title: "ReImage — every pixel finds a new home",
  description: "Pixels of one image fly across and rebuild another one. Nothing lost, nothing recolored.",
  openGraph: {
    title: "ReImage",
    description: "Pixels of one image fly across and rebuild another one.",
    images: ["/demo/sunset.png"],
  },
};

export const viewport: Viewport = { themeColor: "#e8e5de" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <Providers>
          <SmoothScroll />
          <Cursor />
          {children}
        </Providers>
      </body>
    </html>
  );
}
