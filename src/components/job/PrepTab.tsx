"use client";

import { useStore } from "@/lib/store";
import { InterviewPrep, Job } from "@/lib/types";
import { jobContext, profileContext, useAi } from "@/lib/ai-client";
import Markdown from "@/components/Markdown";

export default function PrepTab({ job }: { job: Job }) {
  const { profile, updateJob } = useStore();
  const { run, loading, error } = useAi<Omit<InterviewPrep, "generatedAt">>();

  const generate = async () => {
    const data = await run({
      task: "interview_prep",
      job: jobContext(job),
      profile: profileContext(profile),
    });
    if (data) {
      updateJob(job.id, {
        interviewPrep: { ...data, generatedAt: new Date().toISOString() },
      });
    }
  };

  const prep = job.interviewPrep;
  const canRun = !!profile.masterResume && !!job.description;

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Interview preparation pack</h2>
          <p className="text-sm text-gray-500">
            Opening line &amp; pitch, STAR stories from your real experience,
            likely questions, case/scenario guidance, difficult questions with
            strategies, and questions to ask the panel.
          </p>
          {!canRun && (
            <p className="mt-1 text-xs text-amber-700">
              Needs the job description (Overview tab) and your master resume
              (Settings).
            </p>
          )}
        </div>
        <button className="btn-primary" onClick={generate} disabled={loading || !canRun}>
          {loading
            ? "Building pack… (can take a couple of minutes)"
            : prep
              ? "Regenerate pack"
              : "Generate prep pack"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {prep && (
        <div className="space-y-5">
          <div className="text-xs text-gray-400">
            Generated {new Date(prep.generatedAt).toLocaleString()}
          </div>

          <section className="card">
            <h3 className="mb-2 font-semibold">Opening</h3>
            <p className="rounded-lg bg-indigo-50/60 p-3 text-sm font-medium italic">
              “{prep.openingLine}”
            </p>
            <h4 className="mb-1 mt-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Elevator pitch (~60s)
            </h4>
            <p className="whitespace-pre-line text-sm leading-relaxed">
              {prep.elevatorPitch}
            </p>
          </section>

          <section className="card">
            <h3 className="mb-3 font-semibold">
              Your STAR stories ({prep.stories.length})
            </h3>
            <div className="space-y-4">
              {prep.stories.map((s, i) => (
                <details key={i} className="rounded-lg border border-gray-200 p-3" open={i === 0}>
                  <summary className="cursor-pointer text-sm font-semibold">
                    {s.title}
                    <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {s.competency}
                    </span>
                  </summary>
                  <dl className="mt-3 space-y-2 text-sm">
                    {(
                      [
                        ["Situation", s.situation],
                        ["Task", s.task],
                        ["Action", s.action],
                        ["Result", s.result],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold text-gray-500">{k}</dt>
                        <dd className="text-gray-800">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </details>
              ))}
            </div>
          </section>

          <section className="card">
            <h3 className="mb-3 font-semibold">
              Likely questions ({prep.likelyQuestions.length})
            </h3>
            <ul className="space-y-3">
              {prep.likelyQuestions.map((q, i) => (
                <li key={i} className="rounded-lg bg-gray-50 p-3">
                  <div className="text-sm font-semibold">{q.question}</div>
                  <p className="mt-1 text-sm text-gray-700">{q.approach}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <h3 className="mb-2 font-semibold">Case study &amp; scenario interviews</h3>
            <Markdown>{prep.caseAndScenarioTips}</Markdown>
          </section>

          <section className="card">
            <h3 className="mb-3 font-semibold">
              Difficult questions — your personal risk areas (
              {prep.difficultQuestions.length})
            </h3>
            <div className="space-y-4">
              {prep.difficultQuestions.map((q, i) => (
                <details key={i} className="rounded-lg border border-amber-200 bg-amber-50/40 p-3">
                  <summary className="cursor-pointer text-sm font-semibold">
                    {q.question}
                  </summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p>
                      <span className="font-semibold text-gray-500">
                        Why it&apos;s hard for you:{" "}
                      </span>
                      {q.whyItsHard}
                    </p>
                    <p>
                      <span className="font-semibold text-gray-500">
                        Strategy:{" "}
                      </span>
                      {q.strategy}
                    </p>
                    <p className="rounded-lg bg-white p-2 italic">
                      “{q.sampleAnswer}”
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          <section className="card">
            <h3 className="mb-3 font-semibold">Questions to ask the interviewers</h3>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">
              {prep.questionsForInterviewer.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  );
}
