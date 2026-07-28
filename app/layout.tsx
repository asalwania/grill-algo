import type { Metadata } from "next";
import { Instrument_Serif, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Instrument Serif is NOT a variable font — weight is required.
   Only 400 is used anywhere in the design export. */
const displaySerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display-family",
});

/* Inter and JetBrains Mono are variable — no weight needed. Which weights are
   actually reachable is constrained in globals.css (400 and 500 only). */
const bodySans = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans-family",
});

const codeMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono-family",
});

/**
 * No header/footer here on purpose — the learning view lays itself out with
 * `lg:h-screen`, so shared chrome is mounted per-page instead. See
 * components/chrome/SiteHeader.tsx.
 *
 * F18 still owns canonical URLs, the OG image route, JSON-LD, sitemap and
 * robots; this is only the title template and a real default description,
 * which every page under it needs before any of that is worth doing.
 */
export const metadata: Metadata = {
  title: {
    default: "Execution Visualizer — Watch algorithms think.",
    template: "%s — Execution Visualizer",
  },
  description:
    "Step through real algorithm execution, one frame at a time — no guessing, no hand-waving.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${displaySerif.variable} ${bodySans.variable} ${codeMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
