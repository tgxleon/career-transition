"use client";

import { useEffect } from "react";
import { useAiActivity } from "@/lib/ai-client";

// While any AI generation is in flight: show a floating indicator, block
// tab-close/refresh with the browser prompt, and confirm before in-app
// navigation so a click elsewhere doesn't silently hide a running job.
export default function GenerationGuard() {
  const busy = useAiActivity();

  useEffect(() => {
    if (!busy) return;

    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onClickCapture = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const anchor = target?.closest?.("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      // only guard real navigations (internal routes and external links)
      if (href.startsWith("#")) return;
      const ok = window.confirm(
        "An AI generation is still running. If you leave this page it may be interrupted and you'll have to run it again.\n\nLeave anyway?"
      );
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClickCapture, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClickCapture, true);
    };
  }, [busy]);

  if (!busy) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
      <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      AI is working — keep this page open
    </div>
  );
}
