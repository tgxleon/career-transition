"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import StageBadge from "@/components/StageBadge";
import OverviewTab from "@/components/job/OverviewTab";
import FitTab from "@/components/job/FitTab";
import ResumeCoverTab from "@/components/job/ResumeCoverTab";
import InterviewTab from "@/components/job/InterviewTab";
import EmailsTab from "@/components/job/EmailsTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "fit", label: "Fit Analysis" },
  { id: "resume", label: "Resume & Cover Letter" },
  { id: "interview", label: "Interview" },
  { id: "emails", label: "Email Drafts" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// Old bookmarked/linked tab ids from the previous 7-tab layout
const LEGACY_TABS: Record<string, TabId> = {
  cover: "resume",
  prep: "interview",
  reflection: "interview",
};

function JobDetailInner({ id }: { id: string }) {
  const { jobs, ready, profile } = useStore();
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("tab") ?? "overview";
  const initial = (LEGACY_TABS[raw] ?? raw) as TabId;
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initial) ? initial : "overview"
  );

  if (!ready) return null;
  const job = jobs.find((j) => j.id === id);
  if (!job) {
    return (
      <div className="card py-12 text-center">
        <p className="text-gray-600">Job not found.</p>
        <Link href="/jobs" className="mt-3 inline-block text-indigo-700 hover:underline">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  const artifactDone: Partial<Record<TabId, boolean>> = {
    fit: !!job.fit,
    resume: !!(job.tailoredResume || job.coverLetter),
    interview: !!(job.interviewPrep || job.reflection),
    emails: !!(job.thankYouEmail || job.followUpEmail),
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/jobs" className="text-sm text-gray-500 hover:text-indigo-700">
            ← All jobs
          </Link>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {job.role}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{job.company}</span>
            {job.location && <span>· {job.location}</span>}
            <StageBadge stage={job.stage} />
            {job.fit && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                Fit {job.fit.score}/100
              </span>
            )}
          </div>
        </div>
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" className="btn-secondary">
            View posting ↗
          </a>
        )}
      </div>

      {!profile.masterResume && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          AI features need your master resume —{" "}
          <Link href="/settings" className="font-medium underline">
            add it in Profile &amp; Settings
          </Link>
          .
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              router.replace(`/jobs/${id}?tab=${t.id}`, { scroll: false });
            }}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "border-indigo-700 text-indigo-800"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
            {artifactDone[t.id] && (
              <span className="ml-1 text-emerald-600">•</span>
            )}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab job={job} />}
      {tab === "fit" && <FitTab job={job} />}
      {tab === "resume" && <ResumeCoverTab job={job} />}
      {tab === "interview" && <InterviewTab job={job} />}
      {tab === "emails" && <EmailsTab job={job} />}
    </div>
  );
}

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <Suspense>
      <JobDetailInner id={id} />
    </Suspense>
  );
}
