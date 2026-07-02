"use client";

import { useState } from "react";
import { Job } from "@/lib/types";
import PrepTab from "./PrepTab";
import ReflectionTab from "./ReflectionTab";

// Interview prep and post-interview reflection live together: you prepare
// before the interview, then reflect (and vibe-check) right after it.
export default function InterviewTab({ job }: { job: Job }) {
  // Default to the reflection side if one already exists but no prep does —
  // otherwise start on prep.
  const [section, setSection] = useState<"prep" | "reflection">(
    job.reflection && !job.interviewPrep ? "reflection" : "prep"
  );

  return (
    <div className="space-y-5">
      <div className="flex w-fit rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setSection("prep")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            section === "prep"
              ? "bg-white text-indigo-800 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Before: Preparation
          {job.interviewPrep && <span className="ml-1 text-emerald-600">•</span>}
        </button>
        <button
          onClick={() => setSection("reflection")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            section === "reflection"
              ? "bg-white text-indigo-800 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          After: Reflection &amp; Vibe Check
          {job.reflection && <span className="ml-1 text-emerald-600">•</span>}
        </button>
      </div>

      {section === "prep" ? <PrepTab job={job} /> : <ReflectionTab job={job} />}
    </div>
  );
}
