"use client";

import { usePathname } from "next/navigation";

// App pages get the centered content container; the landing page at "/"
// renders full-bleed and manages its own layout.
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return <>{children}</>;
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
  );
}
