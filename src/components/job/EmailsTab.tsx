"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Job } from "@/lib/types";
import {
  jobContext,
  profileContext,
  reflectionContext,
  useAi,
} from "@/lib/ai-client";
import Markdown from "@/components/Markdown";
import CopyButton from "@/components/CopyButton";

function EmailSection({
  title,
  description,
  value,
  onGenerate,
  onEdit,
  loading,
  buttonLabel,
  hint,
  children,
}: {
  title: string;
  description: string;
  value?: string;
  onGenerate: () => void;
  onEdit: (v: string) => void;
  loading: boolean;
  buttonLabel: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-gray-500">{description}</p>
          {hint && <p className="mt-1 text-xs text-amber-700">{hint}</p>}
        </div>
        <div className="flex gap-2">
          {value && <CopyButton text={value} />}
          {value && (
            <button
              className="btn-secondary text-xs"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Preview" : "Edit"}
            </button>
          )}
          <button className="btn-primary" onClick={onGenerate} disabled={loading}>
            {loading ? "Drafting…" : value ? "Regenerate" : buttonLabel}
          </button>
        </div>
      </div>
      {children}
      {value &&
        (editing ? (
          <textarea
            className="input min-h-64 font-mono text-xs"
            value={value}
            onChange={(e) => onEdit(e.target.value)}
          />
        ) : (
          <div className="rounded-xl bg-gray-50 p-4">
            <Markdown>{value}</Markdown>
          </div>
        ))}
    </section>
  );
}

export default function EmailsTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const thankYou = useAi<string>();
  const followUp = useAi<string>();
  const [followUpContext, setFollowUpContext] = useState("");

  const generateThankYou = async () => {
    const data = await thankYou.run({
      task: "thank_you",
      job: jobContext(job),
      profile: profileContext(profile),
      reflection: reflectionContext(job.reflection),
    });
    if (data) updateJob(job.id, { thankYouEmail: data });
  };

  const generateFollowUp = async () => {
    const data = await followUp.run({
      task: "follow_up",
      job: jobContext(job),
      profile: profileContext(profile),
      context: followUpContext,
    });
    if (data) updateJob(job.id, { followUpEmail: data });
  };

  return (
    <div className="space-y-5">
      {(thankYou.error || followUp.error) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {thankYou.error || followUp.error}
        </div>
      )}

      <EmailSection
        title="Thank-you email"
        description="Short, specific, and warm — references what you actually discussed (pulled from your reflection) and gracefully reinforces anything that wobbled."
        value={job.thankYouEmail}
        onGenerate={generateThankYou}
        onEdit={(v) => updateJob(job.id, { thankYouEmail: v })}
        loading={thankYou.loading}
        buttonLabel="Draft thank-you"
        hint={
          !job.reflection
            ? "Tip: fill in the Reflection tab first — the draft will reference your actual conversation instead of placeholders."
            : undefined
        }
      />

      <EmailSection
        title="Follow-up email"
        description="A polite status check that adds one piece of value so it isn't a pure nudge. Use when you haven't heard back after applying or interviewing."
        value={job.followUpEmail}
        onGenerate={generateFollowUp}
        onEdit={(v) => updateJob(job.id, { followUpEmail: v })}
        loading={followUp.loading}
        buttonLabel="Draft follow-up"
      >
        <div>
          <label className="label">Situation (optional)</label>
          <input
            className="input"
            value={followUpContext}
            onChange={(e) => setFollowUpContext(e.target.value)}
            placeholder='e.g. "Applied 2 weeks ago, no response" or "Final round was 10 days ago, they said one week"'
          />
        </div>
      </EmailSection>
    </div>
  );
}
