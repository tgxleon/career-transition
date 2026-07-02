"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Job } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";

export default function ResumeCoverTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const resumeAi = useAi<string>();
  const coverAi = useAi<string>();
  const [editingResume, setEditingResume] = useState(false);
  const [editingCover, setEditingCover] = useState(false);
  // Cover letter is optional — only show the section once the user opts in
  // (or a draft already exists).
  const [showCover, setShowCover] = useState(!!job.coverLetter);

  const canRun = !!profile.masterResume && !!job.description;
  const resume = job.tailoredResume;
  const letter = job.coverLetter;

  const generateResume = async () => {
    const data = await resumeAi.run({
      task: "resume",
      job: jobContext(job),
      profile: profileContext(profile),
    });
    if (data) updateJob(job.id, { tailoredResume: data });
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
      {/* ATS resume */}
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
            <button
              className="btn-secondary text-xs"
              onClick={() => setEditingResume(!editingResume)}
            >
              {editingResume ? "Preview" : "Edit"}
            </button>
          )}
          <button
            className="btn-primary"
            onClick={generateResume}
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
