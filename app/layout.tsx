import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VIEM — Konekta Farms for Timor-Leste",
    template: "%s · VIEM",
  },
  description:
    "VIEM (Visionary Innovation for Environmental Management) builds connected, solar-powered circular hydroponic and aquaponic farms run by suco cooperatives in Timor-Leste.",
  applicationName: "VIEM",
  keywords: [
    "VIEM",
    "Timor-Leste",
    "aquaponics",
    "hydroponics",
    "circular agriculture",
    "Vorakai Konekta",
    "Tetum",
    "smart farming",
  ],
  openGraph: {
    type: "website",
    siteName: "VIEM",
    title: "VIEM — Konekta Farms for Timor-Leste",
    description:
      "Fish feed the plants, waste feeds the fish, and the suco's new connection keeps the whole loop alive.",
    locale: "en",
  },
};

export const viewport: Viewport = {
  themeColor: "#081f1c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} antialiased`} data-scroll-behavior="smooth">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
