"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { newId, useStore } from "@/lib/store";
import { Job, STAGES, STAGE_LABELS, Stage } from "@/lib/types";
import StageBadge from "@/components/StageBadge";
import { downloadCsv } from "@/lib/csv";
import SheetsSyncButton from "@/components/SheetsSyncButton";

function emptyJob(): Job {
  const now = new Date().toISOString();
  return {
    id: newId(),
    company: "",
    role: "",
    location: "",
    url: "",
    salary: "",
    description: "",
    stage: "saved",
    appliedDate: "",
    interviewDate: "",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function JobsInner() {
  const { jobs, addJob, ready } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [showForm, setShowForm] = useState(params.get("new") === "1");
  const [draft, setDraft] = useState<Job>(emptyJob);
  const [filter, setFilter] = useState<Stage | "all">(
    (params.get("stage") as Stage) || "all"
  );
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    let list = [...jobs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    if (filter !== "all") list = list.filter((j) => j.stage === filter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (j) =>
          j.company.toLowerCase().includes(q) ||
          j.role.toLowerCase().includes(q)
      );
    }
    return list;
  }, [jobs, filter, query]);

  if (!ready) return null;

  const submit = () => {
    if (!draft.company.trim() || !draft.role.trim()) return;
    addJob(draft);
    setShowForm(false);
    router.push(`/jobs/${draft.id}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
        <div className="flex flex-wrap gap-2">
          <SheetsSyncButton />
          <button
            className="btn-secondary"
            onClick={() => downloadCsv(jobs)}
            disabled={jobs.length === 0}
          >
            Export CSV
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setDraft(emptyJob());
              setShowForm(true);
            }}
          >
            + Add job
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold">New job</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Company *</label>
              <input
                className="input"
                value={draft.company}
                onChange={(e) => setDraft({ ...draft, company: e.target.value })}
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="label">Role *</label>
              <input
                className="input"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                placeholder="Product Manager"
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                placeholder="Singapore / Remote"
              />
            </div>
            <div>
              <label className="label">Job posting URL</label>
              <input
                className="input"
                value={draft.url}
                onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://…"
              />
            </div>
            <div>
              <label className="label">Salary range</label>
              <input
                className="input"
                value={draft.salary}
                onChange={(e) => setDraft({ ...draft, salary: e.target.value })}
                placeholder="$8k–10k/mo"
              />
            </div>
            <div>
              <label className="label">Stage</label>
              <select
                className="input"
                value={draft.stage}
                onChange={(e) =>
                  setDraft({ ...draft, stage: e.target.value as Stage })
                }
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">
              Job description (paste the full posting — powers all AI features)
            </label>
            <textarea
              className="input min-h-40 font-mono text-xs"
              value={draft.description}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
              placeholder="Paste the full job description here…"
            />
          </div>
          <div className="flex gap-2">
            <button className="btn-primary" onClick={submit}>
              Save job
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          className="input max-w-xs"
          placeholder="Search company or role…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-1">
          {(["all", ...STAGES] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as Stage | "all")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-indigo-700 text-white"
                  : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
              }`}
            >
              {s === "all" ? "All" : STAGE_LABELS[s as Stage]}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="card py-12 text-center text-sm text-gray-500">
          {jobs.length === 0
            ? "No jobs yet — add your first application above."
            : "No jobs match this filter."}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`} className="card block hover:border-indigo-300">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate font-semibold">{j.role}</div>
                  <div className="truncate text-sm text-gray-600">
                    {j.company}
                    {j.location && ` · ${j.location}`}
                  </div>
                </div>
                <StageBadge stage={j.stage} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                {j.fit && (
                  <span className="font-medium text-gray-700">
                    Fit {j.fit.score}/100
                  </span>
                )}
                {j.interviewDate && (
                  <span>
                    Interview{" "}
                    {new Date(j.interviewDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
                <span>
                  Updated {new Date(j.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                {j.fit && <Artifact label="Fit ✓" />}
                {j.tailoredResume && <Artifact label="Resume ✓" />}
                {j.coverLetter && <Artifact label="Cover letter ✓" />}
                {j.interviewPrep && <Artifact label="Prep pack ✓" />}
                {j.thankYouEmail && <Artifact label="Thank-you ✓" />}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Artifact({ label }: { label: string }) {
  return (
    <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">
      {label}
    </span>
  );
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsInner />
    </Suspense>
  );
}
