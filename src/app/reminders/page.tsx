"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { newId, useStore } from "@/lib/store";
import {
  REMINDER_TYPE_LABELS,
  Reminder,
  ReminderType,
} from "@/lib/types";

const TYPES = Object.keys(REMINDER_TYPE_LABELS) as ReminderType[];

export default function RemindersPage() {
  const { reminders, jobs, addReminder, updateReminder, deleteReminder, ready } =
    useStore();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReminderType>("follow_up");
  const [due, setDue] = useState("");
  const [jobId, setJobId] = useState("");
  const [showDone, setShowDone] = useState(false);

  const sorted = useMemo(() => {
    const list = [...reminders].sort((a, b) => a.due.localeCompare(b.due));
    return {
      pending: list.filter((r) => !r.done),
      done: list.filter((r) => r.done),
    };
  }, [reminders]);

  if (!ready) return null;

  const submit = () => {
    if (!title.trim() || !due) return;
    addReminder({
      id: newId(),
      jobId: jobId || undefined,
      type,
      title: title.trim(),
      due: new Date(due).toISOString(),
      done: false,
      createdAt: new Date().toISOString(),
    });
    setTitle("");
    setDue("");
    setJobId("");
    setShowForm(false);
  };

  const renderRow = (r: Reminder) => {
    const job = jobs.find((j) => j.id === r.jobId);
    const overdue = !r.done && new Date(r.due) < new Date();
    return (
      <li
        key={r.id}
        className={`flex items-center gap-3 py-3 ${r.done ? "opacity-50" : ""}`}
      >
        <input
          type="checkbox"
          checked={r.done}
          onChange={(e) => updateReminder(r.id, { done: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-indigo-700 focus:ring-indigo-500"
        />
        <div className="min-w-0 flex-1">
          <div className={`text-sm font-medium ${r.done ? "line-through" : ""}`}>
            {r.title}
          </div>
          <div className="text-xs text-gray-500">
            {REMINDER_TYPE_LABELS[r.type]}
            {job && (
              <>
                {" · "}
                <Link href={`/jobs/${job.id}`} className="text-indigo-700 hover:underline">
                  {job.company}
                </Link>
              </>
            )}
            {" · "}
            {new Date(r.due).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        {overdue && (
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
            Overdue
          </span>
        )}
        <button
          className="text-xs text-gray-400 hover:text-red-600"
          onClick={() => deleteReminder(r.id)}
          aria-label="Delete reminder"
        >
          ✕
        </button>
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reminders</h1>
          <p className="text-sm text-gray-500">
            Interview dates, thank-you notes, follow-ups and deadlines.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + Add reminder
        </button>
      </div>

      {showForm && (
        <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">Title *</label>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Send thank-you to Acme"
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value as ReminderType)}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {REMINDER_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Due *</label>
            <input
              type="datetime-local"
              className="input"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Linked job</label>
            <select
              className="input"
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
            >
              <option value="">(none)</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.company} — {j.role}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button className="btn-primary" onClick={submit}>
              Save reminder
            </button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="mb-2 font-semibold">
          Pending ({sorted.pending.length})
        </h2>
        {sorted.pending.length === 0 ? (
          <p className="py-4 text-sm text-gray-500">
            All clear. Add reminders here or use the one-click buttons on any
            job&apos;s Overview tab.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {sorted.pending.map(renderRow)}
          </ul>
        )}
      </div>

      {sorted.done.length > 0 && (
        <div className="card">
          <button
            className="flex w-full items-center justify-between text-left font-semibold"
            onClick={() => setShowDone(!showDone)}
          >
            <span>Completed ({sorted.done.length})</span>
            <span className="text-gray-400">{showDone ? "▾" : "▸"}</span>
          </button>
          {showDone && (
            <ul className="mt-2 divide-y divide-gray-100">
              {sorted.done.map(renderRow)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
