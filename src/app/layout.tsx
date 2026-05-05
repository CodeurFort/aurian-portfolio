import type { Metadata } from "next";
import { Fraunces, Inter_Tight, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const serif = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const sans = Inter_Tight({
  subsets: ["latin"],
  weight: ["200", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "aurian. — portfolio",
  description: "Une nuit éditoriale. Cinq planètes de papier. Des fils de menthe.",
  metadataBase: new URL("https://aurian.dev"),
  openGraph: {
    title: "aurian. — portfolio",
    description: "Une nuit éditoriale. Cinq planètes de papier. Des fils de menthe.",
    images: ["/og-image.png"],
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="grain bg-paper-bg text-text antialiased overflow-hidden">{children}</body>
    </html>
  );
}
