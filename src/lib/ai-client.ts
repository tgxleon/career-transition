"use client";

import { useState, useSyncExternalStore } from "react";
import { Job, Profile, Reflection } from "./types";

// Global count of in-flight AI generations, so the app can warn before the
// user navigates away mid-generation (a page unload kills the request).
let activeGenerations = 0;
const activityListeners = new Set<() => void>();

function bumpActivity(delta: number) {
  activeGenerations += delta;
  activityListeners.forEach((l) => l());
}

function subscribeActivity(listener: () => void) {
  activityListeners.add(listener);
  return () => activityListeners.delete(listener);
}

export function useAiActivity(): boolean {
  return useSyncExternalStore(
    subscribeActivity,
    () => activeGenerations > 0,
    () => false
  );
}

export function jobContext(job: Job) {
  return {
    company: job.company,
    role: job.role,
    location: job.location,
    salary: job.salary,
    description: job.description,
    notes: job.notes,
  };
}

export function profileContext(profile: Profile) {
  return {
    name: profile.name,
    targetRole: profile.targetRole,
    masterResume: profile.masterResume,
    background: profile.background,
  };
}

export function reflectionContext(reflection?: Reflection) {
  if (!reflection) return undefined;
  const { vibeCheck: _vibe, updatedAt: _u, ...rest } = reflection;
  return rest;
}

export function useAi<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (payload: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    setError(null);
    bumpActivity(1);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data.data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed";
      // fetch() rejects with a bare TypeError when the connection drops —
      // usually the generation outlived the serverless time limit or the
      // network blipped mid-request.
      if (/failed to fetch|load failed|networkerror/i.test(message)) {
        setError(
          "The connection dropped before the result arrived — this usually means the generation took too long. Please try again; if it keeps happening on this job, shorten the pasted job description a little."
        );
      } else {
        setError(message);
      }
      return null;
    } finally {
      bumpActivity(-1);
      setLoading(false);
    }
  };

  return { run, loading, error };
}
