import { Job, STAGE_LABELS } from "./types";

function esc(v: string): string {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}

export const TRACKER_HEADERS = [
  "Company",
  "Role",
  "Stage",
  "Fit Score",
  "Applied Date",
  "Interview Date",
  "Location",
  "Salary",
  "URL",
  "Notes",
  "Last Updated",
];

export function jobToRow(job: Job): string[] {
  return [
    job.company,
    job.role,
    STAGE_LABELS[job.stage],
    job.fit ? String(job.fit.score) : "",
    job.appliedDate || "",
    job.interviewDate ? job.interviewDate.replace("T", " ") : "",
    job.location || "",
    job.salary || "",
    job.url || "",
    job.notes || "",
    job.updatedAt.slice(0, 10),
  ];
}

export function jobsToCsv(jobs: Job[]): string {
  const lines = [TRACKER_HEADERS.map(esc).join(",")];
  for (const job of jobs) {
    lines.push(jobToRow(job).map(esc).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(jobs: Job[]) {
  const blob = new Blob([jobsToCsv(jobs)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `job-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
