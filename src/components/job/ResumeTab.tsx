"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Job } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";

export default function ResumeTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const { run, loading, error } = useAi<string>();
  const [editing, setEditing] = useState(false);

  const generate = async () => {
    const data = await run({
      task: "resume",
      job: jobContext(job),
      profile: profileContext(profile),
    });
    if (data) updateJob(job.id, { tailoredResume: data });
  };

  const canRun = !!profile.masterResume && !!job.description;
  const resume = job.tailoredResume;

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">ATS-tailored resume</h2>
          <p className="text-sm text-gray-500">
            Rewrites your master resume for this posting: single-column ATS
            format, reordered bullets, job-description keywords woven in — with
            tailoring notes explaining every change.
          </p>
          {!canRun && (
            <p className="mt-1 text-xs text-amber-700">
              Needs the job description (Overview tab) and your master resume
              (Settings).
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {resume && <CopyButton text={resume} />}
          {resume && (
            <button className="btn-secondary text-xs" onClick={() => setEditing(!editing)}>
              {editing ? "Preview" : "Edit"}
            </button>
          )}
          <button className="btn-primary" onClick={generate} disabled={loading || !canRun}>
            {loading
              ? "Tailoring… (can take a minute)"
              : resume
                ? "Regenerate"
                : "Tailor resume"}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {resume &&
        (editing ? (
          <textarea
            className="input min-h-[32rem] font-mono text-xs"
            value={resume}
            onChange={(e) => updateJob(job.id, { tailoredResume: e.target.value })}
          />
        ) : (
          <div className="card">
            <Markdown>{resume}</Markdown>
          </div>
        ))}
    </div>
  );
}
