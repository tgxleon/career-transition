"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { TRACKER_HEADERS, jobToRow } from "@/lib/csv";

export default function SheetsSyncButton() {
  const { jobs, profile } = useStore();
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(
    "idle"
  );
  const [message, setMessage] = useState("");

  if (!profile.sheetsWebhookUrl) {
    return (
      <Link href="/settings" className="btn-secondary" title="Configure Google Sheets sync in Settings">
        Sync to Sheets…
      </Link>
    );
  }

  const sync = async () => {
    setState("busy");
    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: profile.sheetsWebhookUrl,
          headers: TRACKER_HEADERS,
          rows: jobs.map(jobToRow),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      setState("done");
      setMessage(`Synced ${data.count} rows`);
      setTimeout(() => setState("idle"), 2500);
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "Sync failed");
      setTimeout(() => setState("idle"), 4000);
    }
  };

  return (
    <button
      className="btn-secondary"
      onClick={sync}
      disabled={state === "busy" || jobs.length === 0}
      title={state === "error" ? message : "Push all jobs to your Google Sheet"}
    >
      {state === "busy"
        ? "Syncing…"
        : state === "done"
          ? message + " ✓"
          : state === "error"
            ? "Sync failed — see Settings"
            : "Sync to Google Sheets"}
    </button>
  );
}
