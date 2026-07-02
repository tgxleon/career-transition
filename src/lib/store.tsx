"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  EMPTY_PROFILE,
  Job,
  Profile,
  Reminder,
} from "./types";

const KEY = "career-compass-v1";

interface AppData {
  jobs: Job[];
  reminders: Reminder[];
  profile: Profile;
}

interface StoreValue extends AppData {
  ready: boolean;
  addJob: (job: Job) => void;
  updateJob: (id: string, patch: Partial<Job>) => void;
  deleteJob: (id: string) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  setProfile: (profile: Profile) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>({
    jobs: [],
    reminders: [],
    profile: EMPTY_PROFILE,
  });
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          jobs: parsed.jobs ?? [],
          reminders: parsed.reminders ?? [],
          profile: { ...EMPTY_PROFILE, ...(parsed.profile ?? {}) },
        });
      }
    } catch {
      // corrupted storage — start fresh
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    localStorage.setItem(KEY, JSON.stringify(data));
  }, [data]);

  const addJob = useCallback((job: Job) => {
    setData((d) => ({ ...d, jobs: [job, ...d.jobs] }));
  }, []);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setData((d) => ({
      ...d,
      jobs: d.jobs.map((j) =>
        j.id === id
          ? { ...j, ...patch, updatedAt: new Date().toISOString() }
          : j
      ),
    }));
  }, []);

  const deleteJob = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      jobs: d.jobs.filter((j) => j.id !== id),
      reminders: d.reminders.filter((r) => r.jobId !== id),
    }));
  }, []);

  const addReminder = useCallback((reminder: Reminder) => {
    setData((d) => ({ ...d, reminders: [reminder, ...d.reminders] }));
  }, []);

  const updateReminder = useCallback(
    (id: string, patch: Partial<Reminder>) => {
      setData((d) => ({
        ...d,
        reminders: d.reminders.map((r) =>
          r.id === id ? { ...r, ...patch } : r
        ),
      }));
    },
    []
  );

  const deleteReminder = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      reminders: d.reminders.filter((r) => r.id !== id),
    }));
  }, []);

  const setProfile = useCallback((profile: Profile) => {
    setData((d) => ({ ...d, profile }));
  }, []);

  return (
    <StoreContext.Provider
      value={{
        ...data,
        ready,
        addJob,
        updateJob,
        deleteJob,
        addReminder,
        updateReminder,
        deleteReminder,
        setProfile,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
