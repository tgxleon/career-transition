import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Nav from "@/components/Nav";
import AppShell from "@/components/AppShell";

// LE CAMP style system: Bricolage Grotesque substitutes for Agrandir
// (display voice), DM Sans is the workhorse, DM Mono the wayfinding voice.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "800"],
  variable: "--font-display",
});
const sans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
});
const mono = DM_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Career Compass — Base camp for your job search",
  description:
    "Track every application from fit assessment to thank-you note: AI fit scoring out of 100, ATS resume tailoring, interview prep packs, post-interview vibe checks, and reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="min-h-screen font-[family-name:var(--font-sans)] antialiased">
        <StoreProvider>
          <Nav />
          <AppShell>{children}</AppShell>
        </StoreProvider>
      </body>
    </html>
  );
}
