"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Profile } from "@/lib/types";

const APPS_SCRIPT_SNIPPET = `function doPost(e) {
  var data = JSON.parse(e.postData.contents);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.clearContents();
  sheet.appendRow(data.headers);
  data.rows.forEach(function (row) { sheet.appendRow(row); });
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, count: data.rows.length })
  ).setMimeType(ContentService.MimeType.JSON);
}`;

export default function SettingsPage() {
  const { profile, setProfile, ready } = useStore();
  const [draft, setDraft] = useState<Profile>(profile);
  const [saved, setSaved] = useState(false);
  const [uploadState, setUploadState] = useState<
    { status: "idle" } | { status: "busy" } | { status: "done"; note: string } | { status: "error"; note: string }
  >({ status: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadResume = async (file: File) => {
    setUploadState({ status: "busy" });
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setDraft((d) => ({ ...d, masterResume: data.text }));
      setUploadState({
        status: "done",
        note: `Extracted ${data.chars.toLocaleString()} characters from ${data.filename} — review below, then Save.`,
      });
    } catch (err) {
      setUploadState({
        status: "error",
        note: err instanceof Error ? err.message : "Upload failed",
      });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (ready) setDraft(profile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!ready) return null;

  const save = () => {
    setProfile(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Profile &amp; Settings
        </h1>
        <p className="text-sm text-gray-500">
          Your master resume and background power every AI feature. Data is
          stored locally in your browser.
        </p>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">About you</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="label">Target role / direction</label>
            <input
              className="input"
              value={draft.targetRole}
              onChange={(e) => setDraft({ ...draft, targetRole: e.target.value })}
              placeholder="e.g. Transitioning from teaching into L&D / HR tech"
            />
          </div>
        </div>
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="label !mb-0">
              Master resume * (the single source of truth everything is
              analysed and tailored against)
            </label>
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadResume(f);
                }}
              />
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={uploadState.status === "busy"}
                onClick={() => fileRef.current?.click()}
              >
                {uploadState.status === "busy"
                  ? "Extracting…"
                  : "⬆ Upload resume (PDF / DOCX / TXT)"}
              </button>
            </div>
          </div>
          {uploadState.status === "done" && (
            <p className="mb-2 text-xs font-medium text-emerald-700">
              ✓ {uploadState.note}
            </p>
          )}
          {uploadState.status === "error" && (
            <p className="mb-2 text-xs font-medium text-red-700">
              {uploadState.note}
            </p>
          )}
          <textarea
            className="input min-h-72 font-mono text-xs"
            value={draft.masterResume}
            onChange={(e) => setDraft({ ...draft, masterResume: e.target.value })}
            placeholder="Paste your complete resume here. Include everything — the AI selects and reorders what's relevant per job, and never invents anything that isn't here."
          />
        </div>
        <div>
          <label className="label">
            Career background &amp; transition story (optional but powerful)
          </label>
          <textarea
            className="input min-h-40"
            value={draft.background}
            onChange={(e) => setDraft({ ...draft, background: e.target.value })}
            placeholder="In your own words: why you're changing careers, what you're moving from/to, constraints, motivations, and anything a coach should know. This shapes cover letters, interview prep and difficult-question strategies."
          />
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold">Google Sheets sync</h2>
        <p className="text-sm text-gray-600">
          The <em>Sync to Google Sheets</em> button (on the Jobs page) pushes
          your full tracker to a sheet you own. One-time setup:
        </p>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm text-gray-700">
          <li>
            Create a Google Sheet, then open{" "}
            <strong>Extensions → Apps Script</strong>.
          </li>
          <li>Replace the default code with the snippet below and save.</li>
          <li>
            Click <strong>Deploy → New deployment → Web app</strong>. Set
            &quot;Execute as&quot; to <em>Me</em> and &quot;Who has
            access&quot; to <em>Anyone</em>.
          </li>
          <li>Copy the web app URL and paste it here.</li>
        </ol>
        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">
          {APPS_SCRIPT_SNIPPET}
        </pre>
        <div>
          <label className="label">Apps Script web app URL</label>
          <input
            className="input"
            value={draft.sheetsWebhookUrl}
            onChange={(e) =>
              setDraft({ ...draft, sheetsWebhookUrl: e.target.value })
            }
            placeholder="https://script.google.com/macros/s/…/exec"
          />
        </div>
        <p className="text-xs text-gray-500">
          Prefer not to set this up? The <em>Export CSV</em> button gives you a
          file you can import into Sheets manually (File → Import).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={save}>
          Save settings
        </button>
        {saved && (
          <span className="text-sm font-medium text-emerald-700">Saved ✓</span>
        )}
      </div>
    </div>
  );
}
