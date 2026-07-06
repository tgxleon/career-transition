"use client";

import { useStore } from "@/lib/store";
import { FitAnalysis, Job, KnockoutCheck } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-red-50 text-red-700",
};

const KNOCKOUT_STYLE: Record<KnockoutCheck["status"], string> = {
  met: "bg-emerald-50 text-emerald-800",
  unclear: "bg-amber-50 text-amber-800",
  not_met: "bg-red-50 text-red-700",
};

const KNOCKOUT_LABEL: Record<KnockoutCheck["status"], string> = {
  met: "Met",
  unclear: "Unclear",
  not_met: "Not met",
};

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-amber-700";
  return "text-red-700";
}

export default function FitTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const { run, loading, error } = useAi<Omit<FitAnalysis, "generatedAt">>();

  const generate = async () => {
    const data = await run({
      task: "fit",
      job: jobContext(job),
      profile: profileContext(profile),
    });
    if (data) {
      updateJob(job.id, {
        fit: { ...data, generatedAt: new Date().toISOString() },
      });
    }
  };

  const fit = job.fit;
  const canRun = !!profile.masterResume && !!job.description;
  const missing = fit?.mustHaveKeywords?.filter((k) => !k.inResume) ?? [];
  const present = fit?.mustHaveKeywords?.filter((k) => k.inResume) ?? [];

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Step 1 of 3 — Analyse
          </div>
          <h2 className="font-semibold">Job fit analysis</h2>
          <p className="text-sm text-gray-500">
            Builds the target profile from the posting (must-have keywords,
            knockout requirements), scores your fit /100, splits gaps into
            fixable-by-rewording vs genuine, and plans the resume reorder.
          </p>
          {!canRun && (
            <p className="mt-1 text-xs text-amber-700">
              Needs both the job description (Overview tab) and your master
              resume (Settings).
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={generate} disabled={loading || !canRun}>
          {loading
            ? "Analysing… (can take a minute)"
            : fit
              ? "Re-run analysis"
              : "Analyse fit"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {fit && (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <div className="card flex flex-col items-center justify-center py-8 text-center">
              <div className={`text-6xl font-bold tabular-nums ${scoreColor(fit.score)}`}>
                {fit.score}
              </div>
              <div className="text-sm text-gray-400">/ 100</div>
              <div className="mt-2 text-sm font-medium">{fit.verdict}</div>
              <div className="mt-2 text-xs text-gray-400">
                Generated {new Date(fit.generatedAt).toLocaleString()}
              </div>
            </div>
            <div className="card md:col-span-2">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Assessment
              </h3>
              <p className="text-sm leading-relaxed">{fit.summary}</p>
            </div>
          </div>

          {/* Keyword coverage (Scout) */}
          {(fit.mustHaveKeywords?.length || fit.atsKeywords?.length) && (
            <div className="card">
              <h3 className="mb-1 font-semibold">ATS keyword coverage</h3>
              <p className="mb-3 text-xs text-gray-500">
                The terms a recruiter&apos;s search or ATS ranking will match
                on, checked against your current resume. Missing ones are what
                Step 2 (Tailor) weaves in — where genuinely true.
              </p>
              {fit.mustHaveKeywords?.length ? (
                <div className="space-y-3">
                  {missing.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-700">
                        Missing from your resume ({missing.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {missing.map((k) => (
                          <span
                            key={k.keyword}
                            className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700"
                          >
                            ✗ {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {present.length > 0 && (
                    <div>
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Already covered ({present.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {present.map((k) => (
                          <span
                            key={k.keyword}
                            className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800"
                          >
                            ✓ {k.keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(fit.niceToHaveKeywords?.length ?? 0) > 0 && (
                    <div>
                      <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Nice-to-have
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {fit.niceToHaveKeywords!.map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Legacy analyses (pre-pipeline) only had a flat keyword list
                <div className="flex flex-wrap gap-1.5">
                  {fit.atsKeywords!.map((k) => (
                    <span
                      key={k}
                      className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Knockouts */}
          {(fit.knockouts?.length ?? 0) > 0 && (
            <div className="card">
              <h3 className="mb-1 font-semibold">Knockout requirements</h3>
              <p className="mb-3 text-xs text-gray-500">
                Non-negotiables in the posting — anything not clearly met needs
                addressing before you apply.
              </p>
              <ul className="space-y-2">
                {fit.knockouts!.map((k, i) => (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 p-3"
                  >
                    <div>
                      <div className="text-sm font-semibold">{k.requirement}</div>
                      <p className="mt-0.5 text-sm text-gray-600">{k.note}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${KNOCKOUT_STYLE[k.status]}`}
                    >
                      {KNOCKOUT_LABEL[k.status]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 font-semibold text-emerald-800">
                Strengths ({fit.strengths.length})
              </h3>
              <ul className="space-y-3">
                {fit.strengths.map((s, i) => (
                  <li key={i} className="rounded-lg bg-emerald-50/60 p-3">
                    <div className="text-sm font-semibold">{s.competency}</div>
                    <p className="mt-1 text-sm text-gray-700">{s.evidence}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card">
              <h3 className="mb-3 font-semibold text-amber-800">
                Gaps &amp; how to address them ({fit.gaps.length})
              </h3>
              <ul className="space-y-3">
                {fit.gaps.map((g, i) => (
                  <li key={i} className="rounded-lg bg-amber-50/60 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{g.competency}</div>
                      <div className="flex gap-1.5">
                        {g.closableByRewording !== undefined && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                              g.closableByRewording
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {g.closableByRewording
                              ? "Fixable by rewording"
                              : "Genuine gap"}
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${SEVERITY_STYLE[g.severity]}`}
                        >
                          {g.severity}
                        </span>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-medium">Mitigation: </span>
                      {g.mitigation}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Reordering plan (Strategist) */}
          {(fit.reorderingPlan?.length ?? 0) > 0 && (
            <div className="card">
              <h3 className="mb-1 font-semibold">Reordering plan</h3>
              <p className="mb-3 text-xs text-gray-500">
                What to move into the top third of your resume — recruiters and
                ATS ranking both weight it most. Step 2 (Tailor) applies this
                automatically.
              </p>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm">
                {fit.reorderingPlan!.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}
