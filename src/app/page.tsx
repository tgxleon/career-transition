"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { REMINDER_TYPE_LABELS, STAGE_LABELS, Stage } from "@/lib/types";
import StageBadge from "@/components/StageBadge";

function relativeDue(due: string): { text: string; overdue: boolean } {
  const diff = new Date(due).getTime() - Date.now();
  const overdue = diff < 0;
  const abs = Math.abs(diff);
  const hours = Math.round(abs / 3_600_000);
  const days = Math.round(abs / 86_400_000);
  const text =
    hours < 1
      ? "now"
      : hours < 24
        ? `${hours}h ${overdue ? "overdue" : "away"}`
        : `${days}d ${overdue ? "overdue" : "away"}`;
  return { text, overdue };
}

const PIPELINE: Stage[] = ["saved", "applied", "interview", "offer"];

export default function Dashboard() {
  const { jobs, reminders, profile, ready } = useStore();
  if (!ready) return null;

  const counts = Object.fromEntries(
    PIPELINE.map((s) => [s, jobs.filter((j) => j.stage === s).length])
  ) as Record<Stage, number>;

  const active = jobs.filter(
    (j) => j.stage !== "rejected" && j.stage !== "withdrawn"
  );
  const scored = jobs.filter((j) => j.fit);
  const avgFit = scored.length
    ? Math.round(scored.reduce((a, j) => a + j.fit!.score, 0) / scored.length)
    : null;

  const upcoming = reminders
    .filter((r) => !r.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 6);

  const interviews = jobs
    .filter((j) => j.interviewDate && new Date(j.interviewDate) > new Date())
    .sort((a, b) => a.interviewDate.localeCompare(b.interviewDate));

  const recent = [...jobs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.name ? `Welcome back, ${profile.name.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-500">
            Your job search at a glance.
          </p>
        </div>
        <Link href="/jobs?new=1" className="btn-primary">
          + Add job
        </Link>
      </div>

      {/* Pipeline stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {PIPELINE.map((s) => (
          <Link key={s} href={`/jobs?stage=${s}`} className="card !p-4 hover:border-indigo-300">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {STAGE_LABELS[s]}
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">
              {counts[s]}
            </div>
          </Link>
        ))}
        <div className="card !p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Active
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums">
            {active.length}
          </div>
        </div>
        <div className="card !p-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Avg fit score
          </div>
          <div className="mt-1 text-3xl font-bold tabular-nums">
            {avgFit ?? "—"}
            {avgFit !== null && (
              <span className="text-sm font-normal text-gray-400">/100</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming reminders */}
        <section className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Reminders</h2>
            <Link href="/reminders" className="text-sm text-indigo-700 hover:underline">
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">
              Nothing pending. Add reminders for interviews, thank-you notes
              and follow-ups from any job page.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {upcoming.map((r) => {
                const { text, overdue } = relativeDue(r.due);
                const job = jobs.find((j) => j.id === r.jobId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{r.title}</div>
                      <div className="text-xs text-gray-500">
                        {REMINDER_TYPE_LABELS[r.type]}
                        {job && ` · ${job.company}`}
                        {" · "}
                        {new Date(r.due).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        overdue
                          ? "bg-red-50 text-red-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Upcoming interviews */}
        <section className="card">
          <h2 className="mb-3 font-semibold">Upcoming interviews</h2>
          {interviews.length === 0 ? (
            <p className="text-sm text-gray-500">
              No interviews scheduled. When one lands, set the date on the job
              and generate a prep pack.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {interviews.map((j) => (
                <li key={j.id} className="py-2">
                  <Link
                    href={`/jobs/${j.id}?tab=prep`}
                    className="flex items-center justify-between gap-3 hover:text-indigo-700"
                  >
                    <div>
                      <div className="text-sm font-medium">
                        {j.role} · {j.company}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(j.interviewDate).toLocaleString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-indigo-700">
                      Prep →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent activity */}
      <section className="card">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recently updated</h2>
          <Link href="/jobs" className="text-sm text-indigo-700 hover:underline">
            All jobs
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-500">
            No jobs yet.{" "}
            <Link href="/jobs?new=1" className="text-indigo-700 hover:underline">
              Add your first one
            </Link>{" "}
            — then run a fit analysis, tailor your resume and draft a cover
            letter, all from the job page.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((j) => (
              <li key={j.id} className="py-2">
                <Link
                  href={`/jobs/${j.id}`}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium hover:text-indigo-700">
                      {j.role} · {j.company}
                    </div>
                    <div className="text-xs text-gray-500">
                      Updated {new Date(j.updatedAt).toLocaleDateString()}
                      {j.fit && ` · Fit ${j.fit.score}/100`}
                    </div>
                  </div>
                  <StageBadge stage={j.stage} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!profile.masterResume && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Set up your profile first:</strong> paste your master resume
          and career background in{" "}
          <Link href="/settings" className="font-medium underline">
            Profile &amp; Settings
          </Link>{" "}
          — every AI feature (fit scoring, resume tailoring, cover letters,
          interview prep) uses it as source material.
        </div>
      )}
    </div>
  );
}
