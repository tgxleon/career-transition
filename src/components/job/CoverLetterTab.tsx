"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Job } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";

export default function CoverLetterTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const { run, loading, error } = useAi<string>();
  const [editing, setEditing] = useState(false);

  const generate = async () => {
    const data = await run({
      task: "cover_letter",
      job: jobContext(job),
      profile: profileContext(profile),
    });
    if (data) updateJob(job.id, { coverLetter: data });
  };

  const canRun = !!profile.masterResume && !!job.description;
  const letter = job.coverLetter;

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Cover letter</h2>
          <p className="text-sm text-gray-500">
            A specific, human-sounding draft (250–350 words) that maps your
            proof points to this job&apos;s top requirements — career-transition
            framing included.
          </p>
          {!canRun && (
            <p className="mt-1 text-xs text-amber-700">
              Needs the job description (Overview tab) and your master resume
              (Settings).
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {letter && <CopyButton text={letter} />}
          {letter && (
            <button className="btn-secondary text-xs" onClick={() => setEditing(!editing)}>
              {editing ? "Preview" : "Edit"}
            </button>
          )}
          <button className="btn-primary" onClick={generate} disabled={loading || !canRun}>
            {loading ? "Drafting…" : letter ? "Regenerate" : "Draft cover letter"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {letter &&
        (editing ? (
          <textarea
            className="input min-h-96 font-mono text-xs"
            value={letter}
            onChange={(e) => updateJob(job.id, { coverLetter: e.target.value })}
          />
        ) : (
          <div className="card">
            <Markdown>{letter}</Markdown>
          </div>
        ))}
    </div>
  );
}
