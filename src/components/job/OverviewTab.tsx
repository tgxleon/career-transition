"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { newId, useStore } from "@/lib/store";
import { Job, ReminderType, STAGES, STAGE_LABELS, Stage } from "@/lib/types";

function DayInput({
  value,
  onChange,
  suffix,
}: {
  value: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <label className="flex shrink-0 items-center gap-1 text-xs text-gray-500">
      <input
        type="number"
        min={0}
        max={90}
        className="input w-14 !px-2 !py-1 text-center text-xs"
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(Number.isNaN(n) ? 0 : Math.min(90, Math.max(0, n)));
        }}
      />
      {suffix}
    </label>
  );
}

export default function OverviewTab({ job }: { job: Job }) {
  const { updateJob, deleteJob, addReminder } = useStore();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderNote, setReminderNote] = useState("");
  const [prepDaysBefore, setPrepDaysBefore] = useState(1);
  const [thankYouDaysAfter, setThankYouDaysAfter] = useState(1);
  const [followUpDays, setFollowUpDays] = useState(7);

  const set = (patch: Partial<Job>) => updateJob(job.id, patch);

  const quickReminder = (
    type: ReminderType,
    title: string,
    due: Date
  ) => {
    addReminder({
      id: newId(),
      jobId: job.id,
      type,
      title,
      due: due.toISOString(),
      done: false,
      createdAt: new Date().toISOString(),
    });
    setReminderNote(`Reminder added: ${title}`);
    setTimeout(() => setReminderNote(""), 2500);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="card space-y-4">
          <h2 className="font-semibold">Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Company</label>
              <input
                className="input"
                value={job.company}
                onChange={(e) => set({ company: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={job.role}
                onChange={(e) => set({ role: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Location</label>
              <input
                className="input"
                value={job.location}
                onChange={(e) => set({ location: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Salary</label>
              <input
                className="input"
                value={job.salary}
                onChange={(e) => set({ salary: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Posting URL</label>
              <input
                className="input"
                value={job.url}
                onChange={(e) => set({ url: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="label">Job description</label>
            <textarea
              className="input min-h-48 font-mono text-xs"
              value={job.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Paste the full job description — it powers fit analysis, resume tailoring, cover letters and interview prep."
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input min-h-24"
              value={job.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="Referrals, contacts, salary conversations, gut feel…"
            />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="card space-y-4">
          <h2 className="font-semibold">Status</h2>
          <div>
            <label className="label">Stage</label>
            <select
              className="input"
              value={job.stage}
              onChange={(e) => {
                const stage = e.target.value as Stage;
                const patch: Partial<Job> = { stage };
                if (stage === "applied" && !job.appliedDate) {
                  patch.appliedDate = new Date().toISOString().slice(0, 10);
                }
                set(patch);
              }}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Applied date</label>
            <input
              type="date"
              className="input"
              value={job.appliedDate}
              onChange={(e) => set({ appliedDate: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Interview date &amp; time</label>
            <input
              type="datetime-local"
              className="input"
              value={job.interviewDate}
              onChange={(e) => set({ interviewDate: e.target.value })}
            />
          </div>
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold">Quick reminders</h2>
          <p className="text-xs text-gray-500">
            Adjust the days, then one click adds it to your reminders list.
          </p>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary flex-1 justify-start text-left"
                disabled={!job.interviewDate}
                onClick={() =>
                  quickReminder(
                    "interview",
                    `Interview prep: ${job.role} @ ${job.company}`,
                    new Date(
                      new Date(job.interviewDate).getTime() -
                        prepDaysBefore * 86_400_000
                    )
                  )
                }
              >
                📅 Interview prep
              </button>
              <DayInput
                value={prepDaysBefore}
                onChange={setPrepDaysBefore}
                suffix="d before"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary flex-1 justify-start text-left"
                disabled={!job.interviewDate}
                onClick={() =>
                  quickReminder(
                    "thank_you",
                    `Send thank-you note: ${job.company}`,
                    new Date(
                      new Date(job.interviewDate).getTime() +
                        thankYouDaysAfter * 86_400_000
                    )
                  )
                }
              >
                ✉️ Thank-you email
              </button>
              <DayInput
                value={thankYouDaysAfter}
                onChange={setThankYouDaysAfter}
                suffix="d after"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                className="btn-secondary flex-1 justify-start text-left"
                onClick={() =>
                  quickReminder(
                    "follow_up",
                    `Follow up with ${job.company}`,
                    new Date(Date.now() + followUpDays * 86_400_000)
                  )
                }
              >
                🔔 Follow-up
              </button>
              <DayInput
                value={followUpDays}
                onChange={setFollowUpDays}
                suffix="d from now"
              />
            </div>
          </div>
          {reminderNote && (
            <p className="text-xs font-medium text-emerald-700">
              {reminderNote} ✓
            </p>
          )}
          {!job.interviewDate && (
            <p className="text-xs text-gray-400">
              Set an interview date to enable interview &amp; thank-you
              reminders.
            </p>
          )}
        </div>

        <div className="card space-y-3">
          <h2 className="font-semibold text-red-700">Danger zone</h2>
          {confirmDelete ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Delete this job and its reminders? This can&apos;t be undone.
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-danger"
                  onClick={() => {
                    deleteJob(job.id);
                    router.push("/jobs");
                  }}
                >
                  Yes, delete
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="btn-danger" onClick={() => setConfirmDelete(true)}>
              Delete job
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
