"use client";

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Job, KnockoutCheck, ResumeAudit } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";

const KNOCKOUT_STYLE: Record<KnockoutCheck["status"], string> = {
  met: "bg-emerald-50 text-emerald-800",
  unclear: "bg-amber-50 text-amber-800",
  not_met: "bg-red-50 text-red-700",
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-800",
  low: "bg-gray-100 text-gray-600",
};

function Stepper({ job }: { job: Job }) {
  const steps = [
    { n: 1, label: "Analyse fit", done: !!job.fit },
    { n: 2, label: "Tailor resume", done: !!job.tailoredResume },
    { n: 3, label: "Final audit", done: !!job.resumeAudit },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              s.done
                ? "bg-emerald-50 text-emerald-800"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                s.done ? "bg-emerald-600 text-white" : "bg-gray-300 text-white"
              }`}
            >
              {s.done ? "✓" : s.n}
            </span>
            {s.label}
          </div>
          {i < steps.length - 1 && <span className="text-gray-300">→</span>}
        </div>
      ))}
    </div>
  );
}

export default function ResumeCoverTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const resumeAi = useAi<string>();
  const coverAi = useAi<string>();
  const auditAi = useAi<Omit<ResumeAudit, "generatedAt">>();
  const [editingResume, setEditingResume] = useState(false);
  const [editingCover, setEditingCover] = useState(false);
  // Cover letter is optional — only show the section once the user opts in
  // (or a draft already exists).
  const [showCover, setShowCover] = useState(!!job.coverLetter);

  const canRun = !!profile.masterResume && !!job.description;
  const resume = job.tailoredResume;
  const letter = job.coverLetter;
  const audit = job.resumeAudit;

  const generateResume = async (applyPunchList = false) => {
    const data = await resumeAi.run({
      task: "resume",
      job: jobContext(job),
      profile: profileContext(profile),
      // Strategist brief from Step 1, if it exists
      fit: job.fit
        ? {
            mustHaveKeywords: job.fit.mustHaveKeywords,
            reorderingPlan: job.fit.reorderingPlan,
          }
        : undefined,
      // Auditor punch list from Step 3, when regenerating to apply fixes
      punchList:
        applyPunchList && audit
          ? audit.punchList.map((p) => `[${p.priority}] ${p.fix}`)
          : undefined,
    });
    if (data) {
      // A new draft invalidates the previous audit
      updateJob(job.id, { tailoredResume: data, resumeAudit: undefined });
    }
  };

  const runAudit = async () => {
    if (!resume) return;
    const data = await auditAi.run({
      task: "audit",
      job: jobContext(job),
      profile: profileContext(profile),
      resume,
    });
    if (data) {
      updateJob(job.id, {
        resumeAudit: { ...data, generatedAt: new Date().toISOString() },
      });
    }
  };

  const generateCover = async () => {
    const data = await coverAi.run({
      task: "cover_letter",
      job: jobContext(job),
      profile: profileContext(profile),
    });
    if (data) updateJob(job.id, { coverLetter: data });
  };

  return (
    <div className="space-y-5">
      <Stepper job={job} />

      {/* ATS resume */}
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Step 2 of 3 — Tailor
          </div>
          <h2 className="font-semibold">ATS-tailored resume</h2>
          <p className="text-sm text-gray-500">
            Rewrites your master resume for this posting: XYZ-format bullets,
            single-column ATS format, missing must-have keywords woven in where
            true — with tailoring notes explaining every change.
          </p>
          {!canRun && (
            <p className="mt-1 text-xs text-amber-700">
              Needs the job description (Overview tab) and your master resume
              (Settings).
            </p>
          )}
          {canRun && !job.fit && (
            <p className="mt-1 text-xs text-amber-700">
              Tip: run{" "}
              <Link href={`/jobs/${job.id}?tab=fit`} className="underline">
                Step 1 (Analyse fit)
              </Link>{" "}
              first — the tailoring then targets the exact missing keywords and
              applies the reordering plan.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {resume && <CopyButton text={resume} />}
          {resume && (
            <button
              className="btn-secondary text-xs"
              onClick={() => setEditingResume(!editingResume)}
            >
              {editingResume ? "Preview" : "Edit"}
            </button>
          )}
          <button
            className="btn-primary"
            onClick={() => generateResume(false)}
            disabled={resumeAi.loading || !canRun}
          >
            {resumeAi.loading
              ? "Tailoring… (can take a minute)"
              : resume
                ? "Regenerate"
                : "Tailor resume"}
          </button>
        </div>
      </div>

      {resumeAi.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {resumeAi.error}
        </div>
      )}

      {resume &&
        (editingResume ? (
          <textarea
            className="input min-h-[32rem] font-mono text-xs"
            value={resume}
            onChange={(e) =>
              updateJob(job.id, { tailoredResume: e.target.value })
            }
          />
        ) : (
          <div className="card">
            <Markdown>{resume}</Markdown>
          </div>
        ))}

      {/* Final audit — the strict check before applying */}
      {resume && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Step 3 of 3 — Audit
              </div>
              <h2 className="font-semibold">Final audit</h2>
              <p className="text-sm text-gray-500">
                A strict last check before you apply: keyword coverage of the
                tailored draft, machine-readability flags, knockout
                requirements, and a prioritized punch list of final fixes.
              </p>
            </div>
            <button
              className="btn-primary"
              onClick={runAudit}
              disabled={auditAi.loading}
            >
              {auditAi.loading
                ? "Auditing…"
                : audit
                  ? "Re-run audit"
                  : "Run final audit"}
            </button>
          </div>

          {auditAi.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {auditAi.error}
            </div>
          )}

          {audit && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 rounded-xl bg-gray-50 p-4">
                <div className="text-center">
                  <div
                    className={`text-4xl font-bold tabular-nums ${
                      audit.coverageScore >= 80
                        ? "text-emerald-700"
                        : audit.coverageScore >= 60
                          ? "text-amber-700"
                          : "text-red-700"
                    }`}
                  >
                    {audit.coverageScore}
                  </div>
                  <div className="text-xs text-gray-400">coverage /100</div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{audit.verdict}</p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Audited {new Date(audit.generatedAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {audit.missingKeywords.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
                    Still missing or buried
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {audit.missingKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Machine readability
                </div>
                {audit.readabilityFlags.length === 0 ? (
                  <p className="text-sm text-emerald-700">
                    ✓ Clean — nothing found that would scramble in ATS parsing.
                  </p>
                ) : (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
                    {audit.readabilityFlags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>

              {audit.knockouts.length > 0 && (
                <div>
                  <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Knockout requirements
                  </div>
                  <ul className="space-y-2">
                    {audit.knockouts.map((k, i) => (
                      <li
                        key={i}
                        className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3"
                      >
                        <div>
                          <div className="text-sm font-semibold">
                            {k.requirement}
                          </div>
                          <p className="mt-0.5 text-sm text-gray-600">{k.note}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${KNOCKOUT_STYLE[k.status]}`}
                        >
                          {k.status === "not_met"
                            ? "Not met"
                            : k.status === "met"
                              ? "Met"
                              : "Unclear"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {audit.punchList.length > 0 && (
                <div>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Punch list — final fixes
                    </div>
                    <button
                      className="btn-secondary text-xs"
                      onClick={() => generateResume(true)}
                      disabled={resumeAi.loading}
                    >
                      {resumeAi.loading
                        ? "Applying…"
                        : "Apply punch list & regenerate"}
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {audit.punchList.map((p, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 rounded-lg bg-gray-50 p-3"
                      >
                        <span
                          className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${PRIORITY_STYLE[p.priority]}`}
                        >
                          {p.priority}
                        </span>
                        <span className="text-sm">{p.fix}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cover letter — optional */}
      {!showCover ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-dashed">
          <div>
            <h2 className="font-semibold text-gray-700">
              Cover letter{" "}
              <span className="text-sm font-normal text-gray-400">
                (optional)
              </span>
            </h2>
            <p className="text-sm text-gray-500">
              Not every application needs one. Add it only if this job asks for
              it or you want the extra edge.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => setShowCover(true)}>
            + Add cover letter
          </button>
        </div>
      ) : (
        <>
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                Cover letter{" "}
                <span className="text-sm font-normal text-gray-400">
                  (optional)
                </span>
              </h2>
              <p className="text-sm text-gray-500">
                A specific, human-sounding draft (250–350 words) that maps your
                proof points to this job&apos;s top requirements —
                career-transition framing included.
              </p>
            </div>
            <div className="flex gap-2">
              {letter && <CopyButton text={letter} />}
              {letter && (
                <button
                  className="btn-secondary text-xs"
                  onClick={() => setEditingCover(!editingCover)}
                >
                  {editingCover ? "Preview" : "Edit"}
                </button>
              )}
              {!letter && (
                <button
                  className="btn-secondary"
                  onClick={() => setShowCover(false)}
                >
                  Hide
                </button>
              )}
              <button
                className="btn-primary"
                onClick={generateCover}
                disabled={coverAi.loading || !canRun}
              >
                {coverAi.loading
                  ? "Drafting…"
                  : letter
                    ? "Regenerate"
                    : "Draft cover letter"}
              </button>
            </div>
          </div>

          {coverAi.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {coverAi.error}
            </div>
          )}

          {letter &&
            (editingCover ? (
              <textarea
                className="input min-h-96 font-mono text-xs"
                value={letter}
                onChange={(e) =>
                  updateJob(job.id, { coverLetter: e.target.value })
                }
              />
            ) : (
              <div className="card">
                <Markdown>{letter}</Markdown>
              </div>
            ))}
        </>
      )}
    </div>
  );
}
