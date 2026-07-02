"use client";

import { useStore } from "@/lib/store";
import { Job, Reflection, VibeCheck } from "@/lib/types";
import {
  jobContext,
  profileContext,
  reflectionContext,
  useAi,
} from "@/lib/ai-client";
import Markdown from "@/components/Markdown";

function emptyReflection(job: Job): Reflection {
  return {
    interviewDate: job.interviewDate ? job.interviewDate.slice(0, 10) : "",
    interviewers: "",
    format: "",
    wentWell: "",
    couldImprove: "",
    keyTopics: "",
    concerns: "",
    updatedAt: new Date().toISOString(),
  };
}

function vibeColor(rating: number): string {
  if (rating >= 7) return "text-emerald-700";
  if (rating >= 5) return "text-amber-700";
  return "text-red-700";
}

export default function ReflectionTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const { run, loading, error } = useAi<Omit<VibeCheck, "generatedAt">>();

  const reflection = job.reflection ?? emptyReflection(job);

  const set = (patch: Partial<Reflection>) => {
    updateJob(job.id, {
      reflection: {
        ...reflection,
        ...patch,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const runVibeCheck = async () => {
    const data = await run({
      task: "vibe_check",
      job: jobContext(job),
      profile: profileContext(profile),
      reflection: reflectionContext(reflection),
    });
    if (data) {
      set({
        vibeCheck: { ...data, generatedAt: new Date().toISOString() },
      });
    }
  };

  const hasContent =
    reflection.wentWell || reflection.couldImprove || reflection.keyTopics;

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div>
          <h2 className="font-semibold">Post-interview reflection</h2>
          <p className="text-sm text-gray-500">
            Capture it while it&apos;s fresh — this feeds your thank-you email
            and the vibe check.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label">Interview date</label>
            <input
              type="date"
              className="input"
              value={reflection.interviewDate}
              onChange={(e) => set({ interviewDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Interviewer(s)</label>
            <input
              className="input"
              value={reflection.interviewers}
              onChange={(e) => set({ interviewers: e.target.value })}
              placeholder="Jane Tan (Hiring Manager), …"
            />
          </div>
          <div>
            <label className="label">Format</label>
            <input
              className="input"
              value={reflection.format}
              onChange={(e) => set({ format: e.target.value })}
              placeholder="Panel / case study / 1:1 video…"
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">What went well</label>
            <textarea
              className="input min-h-28"
              value={reflection.wentWell}
              onChange={(e) => set({ wentWell: e.target.value })}
              placeholder="Questions you nailed, moments of connection…"
            />
          </div>
          <div>
            <label className="label">What could have gone better</label>
            <textarea
              className="input min-h-28"
              value={reflection.couldImprove}
              onChange={(e) => set({ couldImprove: e.target.value })}
              placeholder="Answers you fumbled, things you forgot to mention…"
            />
          </div>
          <div>
            <label className="label">Key topics discussed</label>
            <textarea
              className="input min-h-28"
              value={reflection.keyTopics}
              onChange={(e) => set({ keyTopics: e.target.value })}
              placeholder="Projects they cared about, team challenges, next steps mentioned…"
            />
          </div>
          <div>
            <label className="label">Concerns / gut feeling</label>
            <textarea
              className="input min-h-28"
              value={reflection.concerns}
              onChange={(e) => set({ concerns: e.target.value })}
              placeholder="Anything nagging at you — be honest, this stays local."
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Vibe check</h2>
            <p className="text-sm text-gray-500">
              An honest, calibrated read on how it went — and what to do about
              it (including what to stop ruminating on).
            </p>
          </div>
          <button
            className="btn-primary"
            onClick={runVibeCheck}
            disabled={loading || !hasContent}
          >
            {loading
              ? "Reading the room…"
              : reflection.vibeCheck
                ? "Re-run vibe check"
                : "Run vibe check"}
          </button>
        </div>
        {!hasContent && (
          <p className="text-xs text-amber-700">
            Fill in at least one reflection field first.
          </p>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}
        {reflection.vibeCheck && (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center rounded-xl bg-gray-50 py-6">
              <div
                className={`text-5xl font-bold tabular-nums ${vibeColor(reflection.vibeCheck.rating)}`}
              >
                {reflection.vibeCheck.rating}
              </div>
              <div className="text-sm text-gray-400">/ 10</div>
            </div>
            <div className="space-y-4 md:col-span-3">
              <div>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  The read
                </h3>
                <Markdown>{reflection.vibeCheck.read}</Markdown>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">
                  What to do next
                </h3>
                <Markdown>{reflection.vibeCheck.advice}</Markdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
