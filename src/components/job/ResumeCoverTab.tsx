"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { FitAnalysis, Job, KnockoutCheck, ResumeAudit } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";
import { downloadDocx, downloadPdf, safeFilename } from "@/lib/resume-export";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";

function DownloadButtons({ md, filename }: { md: string; filename: string }) {
  const [busy, setBusy] = useState<"" | "docx" | "pdf">("");
  const make = (kind: "docx" | "pdf") => async () => {
    setBusy(kind);
    try {
      if (kind === "docx") await downloadDocx(md, filename);
      else await downloadPdf(md, filename);
    } finally {
      setBusy("");
    }
  };
  return (
    <>
      <button
        className="btn-secondary text-xs"
        onClick={make("docx")}
        disabled={busy !== ""}
        title="Download as Word document (best for ATS portals)"
      >
        {busy === "docx" ? "…" : "⬇ DOCX"}
      </button>
      <button
        className="btn-secondary text-xs"
        onClick={make("pdf")}
        disabled={busy !== ""}
        title="Download as PDF"
      >
        {busy === "pdf" ? "…" : "⬇ PDF"}
      </button>
    </>
  );
}

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

type PipelineStage = "fit" | "draft" | "audit" | null;

function Stepper({ job, active }: { job: Job; active: PipelineStage }) {
  const steps = [
    { n: 1, label: "Analyse fit", done: !!job.fit, stage: "fit" as const },
    {
      n: 2,
      label: "Tailor resume",
      done: !!job.tailoredResume,
      stage: "draft" as const,
    },
    // a stale audit belongs to a previous draft — step 3 is no longer done
    {
      n: 3,
      label: "Final audit",
      done: !!job.resumeAudit && !job.resumeAudit.stale,
      stage: "audit" as const,
    },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((s, i) => {
        const running = active === s.stage;
        return (
          <div key={s.n} className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                running
                  ? "animate-pulse bg-indigo-100 text-indigo-800"
                  : s.done
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  running
                    ? "bg-indigo-600 text-white"
                    : s.done
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-300 text-white"
                }`}
              >
                {running ? "…" : s.done ? "✓" : s.n}
              </span>
              {s.label}
              {running && "…"}
            </div>
            {i < steps.length - 1 && <span className="text-gray-300">→</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function ResumeCoverTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const fitAi = useAi<Omit<FitAnalysis, "generatedAt">>();
  const resumeAi = useAi<string>();
  const coverAi = useAi<string>();
  const auditAi = useAi<Omit<ResumeAudit, "generatedAt">>();
  const [stage, setStage] = useState<PipelineStage>(null);
  const [editingResume, setEditingResume] = useState(false);
  const [editingCover, setEditingCover] = useState(false);
  // Cover letter is optional — only show the section once the user opts in
  // (or a draft already exists).
  const [showCover, setShowCover] = useState(!!job.coverLetter);

  const canRun = !!profile.masterResume && !!job.description;
  const resume = job.tailoredResume;
  const letter = job.coverLetter;
  const audit = job.resumeAudit;
  const exportName = safeFilename(`${job.company} ${job.role}`) || "resume";

  // Punch-list selection: all fixes selected by default on each new audit
  const [uncheckedFixes, setUncheckedFixes] = useState<Set<number>>(new Set());
  useEffect(() => {
    setUncheckedFixes(new Set());
  }, [audit?.generatedAt]);
  const selectedCount = audit
    ? audit.punchList.length - uncheckedFixes.size
    : 0;

  const toggleFix = (i: number) => {
    setUncheckedFixes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

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
          ? audit.punchList
              .filter((_, i) => !uncheckedFixes.has(i))
              .map((p) => `[${p.priority}] ${p.fix}`)
          : undefined,
    });
    if (data) {
      // Keep the previous audit visible but mark it stale (it audited the
      // old draft), and record which fixes went into this draft.
      const appliedNow =
        applyPunchList && audit
          ? audit.punchList
              .filter((_, i) => !uncheckedFixes.has(i))
              .map((p) => p.fix)
          : undefined;
      updateJob(job.id, {
        tailoredResume: data,
        resumeAudit: audit ? { ...audit, stale: true } : undefined,
        appliedFixes: appliedNow,
      });
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

  // One-click journey: analyse fit → draft resume → audit the draft, saved
  // incrementally so a mid-chain failure keeps earlier results. An existing
  // fit analysis is reused rather than re-billed.
  const runPipeline = async () => {
    let fit = job.fit;
    try {
      if (!fit) {
        setStage("fit");
        const f = await fitAi.run({
          task: "fit",
          job: jobContext(job),
          profile: profileContext(profile),
        });
        if (!f) return;
        fit = { ...f, generatedAt: new Date().toISOString() };
        updateJob(job.id, { fit });
      }

      setStage("draft");
      const draft = await resumeAi.run({
        task: "resume",
        job: jobContext(job),
        profile: profileContext(profile),
        fit: {
          mustHaveKeywords: fit.mustHaveKeywords,
          reorderingPlan: fit.reorderingPlan,
        },
      });
      if (!draft) return;
      updateJob(job.id, { tailoredResume: draft, appliedFixes: undefined });

      setStage("audit");
      const aud = await auditAi.run({
        task: "audit",
        job: jobContext(job),
        profile: profileContext(profile),
        resume: draft,
      });
      if (!aud) return;
      updateJob(job.id, {
        resumeAudit: { ...aud, generatedAt: new Date().toISOString() },
      });
    } finally {
      setStage(null);
    }
  };

  const pipelineBusy = stage !== null;

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
      <Stepper job={job} active={stage} />

      {/* One-click journey: analyse → draft → audit in a single run.
          Stays mounted mid-run: the draft saves at stage 2, which would
          otherwise unmount the progress indicator before the audit. */}
      {(!resume || pipelineBusy) && (
        <div className="card border-indigo-200 bg-indigo-50/40">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">
                One click: analyse, draft &amp; audit
              </h2>
              <p className="text-sm text-gray-600">
                Runs the whole journey in one go — scores your fit and
                proposes changes with reasons, drafts the ATS resume, then
                audits the draft. You review the audit, tick the fixes you
                agree with, and regenerate <strong>once</strong>.
              </p>
              {!canRun && (
                <p className="mt-1 text-xs text-amber-700">
                  Needs the job description (Overview tab) and your master
                  resume (Settings) first.
                </p>
              )}
            </div>
            <button
              className="btn-primary"
              onClick={runPipeline}
              disabled={pipelineBusy || !canRun}
            >
              {stage === "fit"
                ? "1/3 Analysing fit…"
                : stage === "draft"
                  ? "2/3 Drafting resume…"
                  : stage === "audit"
                    ? "3/3 Auditing draft…"
                    : job.fit
                      ? "Draft & audit (fit already done)"
                      : "Analyse, draft & audit"}
            </button>
          </div>
          {fitAi.error && (
            <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {fitAi.error}
            </div>
          )}
        </div>
      )}

      {/* Compact fit summary — the "why" behind the proposed changes */}
      {job.fit && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-semibold">
              Fit {job.fit.score}
              <span className="font-normal text-gray-400">/100</span>
            </span>
            <span className="text-gray-600">{job.fit.verdict}</span>
          </div>
          <Link
            href={`/jobs/${job.id}?tab=fit`}
            className="text-indigo-700 hover:underline"
          >
            Why — gaps, keywords &amp; plan →
          </Link>
        </div>
      )}

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
        <div className="flex flex-wrap gap-2">
          {resume && <CopyButton text={resume} />}
          {resume && <DownloadButtons md={resume} filename={`${exportName}-resume`} />}
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
            disabled={resumeAi.loading || pipelineBusy || !canRun}
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

      {/* Record of fixes folded into the current draft */}
      {resume && (job.appliedFixes?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-sm font-semibold text-emerald-900">
            ✓ This draft incorporated {job.appliedFixes!.length} audit{" "}
            {job.appliedFixes!.length === 1 ? "fix" : "fixes"}
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-900/90">
            {job.appliedFixes!.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-emerald-800/80">
            Exactly what changed for each fix is listed under{" "}
            <strong>Tailoring notes → Fixes applied</strong> at the bottom of
            the resume above. Re-run the audit below to verify they landed.
          </p>
        </div>
      )}

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
              disabled={auditAi.loading || pipelineBusy}
            >
              {auditAi.loading
                ? "Auditing…"
                : audit?.stale
                  ? "Audit the new draft"
                  : audit
                    ? "Re-run audit"
                    : "Run final audit"}
            </button>
          </div>

          {audit?.stale && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <strong>This audit is for the previous draft.</strong> The resume
              has been regenerated since it ran, so the findings below may
              already be fixed. Run <em>Audit the new draft</em> to verify.
            </div>
          )}

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
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Punch list — final fixes
                        {audit.stale && " (previous draft)"}
                      </div>
                      {!audit.stale && (
                        <p className="text-xs text-gray-400">
                          Untick anything you don&apos;t want applied.
                        </p>
                      )}
                    </div>
                    {!audit.stale && (
                      <button
                        className="btn-secondary text-xs"
                        onClick={() => generateResume(true)}
                        disabled={resumeAi.loading || selectedCount === 0}
                      >
                        {resumeAi.loading
                          ? "Applying…"
                          : `Apply ${selectedCount} selected ${
                              selectedCount === 1 ? "fix" : "fixes"
                            } & regenerate`}
                      </button>
                    )}
                  </div>
                  <ul className={`space-y-2 ${audit.stale ? "opacity-50" : ""}`}>
                    {audit.punchList.map((p, i) => {
                      const checked = !uncheckedFixes.has(i);
                      return (
                        <li key={i}>
                          <label
                            className={`flex items-start gap-3 rounded-lg p-3 transition-colors ${
                              audit.stale
                                ? "bg-gray-50"
                                : checked
                                  ? "cursor-pointer bg-gray-50"
                                  : "cursor-pointer bg-white opacity-50 ring-1 ring-gray-100"
                            }`}
                          >
                            {!audit.stale && (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleFix(i)}
                                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-indigo-700 focus:ring-indigo-500"
                              />
                            )}
                            <span
                              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${PRIORITY_STYLE[p.priority]}`}
                            >
                              {p.priority}
                            </span>
                            <span className="text-sm">{p.fix}</span>
                          </label>
                        </li>
                      );
                    })}
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
            <div className="flex flex-wrap gap-2">
              {letter && <CopyButton text={letter} />}
              {letter && (
                <DownloadButtons md={letter} filename={`${exportName}-cover-letter`} />
              )}
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
