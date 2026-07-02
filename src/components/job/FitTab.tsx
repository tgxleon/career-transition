"use client";

import { useStore } from "@/lib/store";
import { FitAnalysis, Job } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-red-50 text-red-700",
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

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Job fit analysis</h2>
          <p className="text-sm text-gray-500">
            Scores your fit out of 100, maps competencies, surfaces gaps with
            mitigations, and extracts ATS keywords.
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
              {fit.atsKeywords.length > 0 && (
                <>
                  <h3 className="mb-2 mt-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
                    ATS keywords to include
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {fit.atsKeywords.map((k) => (
                      <span
                        key={k}
                        className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                      >
                        {k}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

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
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold">{g.competency}</div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${SEVERITY_STYLE[g.severity]}`}
                      >
                        {g.severity}
                      </span>
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
        </>
      )}
    </div>
  );
}
