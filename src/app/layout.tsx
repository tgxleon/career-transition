import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Career Compass — Job Search Companion",
  description:
    "Track every application from job-fit assessment to thank-you note: AI fit scoring, ATS resume tailoring, interview prep, reflections, and reminders.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <StoreProvider>
          <Nav />
          <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            {children}
          </main>
        </StoreProvider>
      </body>
    </html>
  );
}
