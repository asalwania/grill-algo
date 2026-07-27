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

export const metadata: Metadata = {
  title: "grill-algo",
  description: "",
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
