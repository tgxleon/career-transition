export type Stage =
  | "saved"
  | "applied"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn";

export const STAGES: Stage[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
];

export const STAGE_LABELS: Record<Stage, string> = {
  saved: "Saved",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export interface FitStrength {
  competency: string;
  evidence: string;
}

export interface FitGap {
  competency: string;
  severity: "low" | "medium" | "high";
  /** true = closable by rewording existing experience; false = genuine gap */
  closableByRewording?: boolean;
  mitigation: string;
}

export interface KeywordCheck {
  keyword: string;
  /** whether the candidate's current resume already contains this term */
  inResume: boolean;
}

export interface KnockoutCheck {
  requirement: string;
  status: "met" | "unclear" | "not_met";
  note: string;
}

export interface FitAnalysis {
  score: number;
  verdict: string;
  summary: string;
  strengths: FitStrength[];
  gaps: FitGap[];
  /** Scout: hard keywords the ATS/recruiter search will match on */
  mustHaveKeywords?: KeywordCheck[];
  niceToHaveKeywords?: string[];
  /** Scout: non-negotiable requirements (certs, visas, years, licences) */
  knockouts?: KnockoutCheck[];
  /** Strategist: what to move into the resume's top third */
  reorderingPlan?: string[];
  /** legacy field from analyses generated before the 3-step pipeline */
  atsKeywords?: string[];
  generatedAt: string;
}

export interface ResumeAudit {
  coverageScore: number;
  verdict: string;
  missingKeywords: string[];
  readabilityFlags: string[];
  knockouts: KnockoutCheck[];
  punchList: { priority: "high" | "medium" | "low"; fix: string }[];
  generatedAt: string;
  /** true once the resume has been regenerated after this audit ran */
  stale?: boolean;
}

export interface StarStory {
  title: string;
  competency: string;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface PrepQuestion {
  question: string;
  approach: string;
}

export interface DifficultQuestion {
  question: string;
  whyItsHard: string;
  strategy: string;
  sampleAnswer: string;
}

export interface InterviewPrep {
  openingLine: string;
  elevatorPitch: string;
  stories: StarStory[];
  likelyQuestions: PrepQuestion[];
  caseAndScenarioTips: string;
  difficultQuestions: DifficultQuestion[];
  questionsForInterviewer: string[];
  generatedAt: string;
}

export interface VibeCheck {
  rating: number; // 1-10 read on how it went
  read: string;
  advice: string;
  generatedAt: string;
}

export interface Reflection {
  interviewDate: string;
  interviewers: string;
  format: string;
  wentWell: string;
  couldImprove: string;
  keyTopics: string;
  concerns: string;
  vibeCheck?: VibeCheck;
  updatedAt: string;
}

export interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  url: string;
  salary: string;
  description: string;
  stage: Stage;
  appliedDate: string;
  interviewDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  fit?: FitAnalysis;
  tailoredResume?: string;
  resumeAudit?: ResumeAudit;
  /** audit fixes that were folded into the current tailoredResume draft */
  appliedFixes?: string[];
  coverLetter?: string;
  interviewPrep?: InterviewPrep;
  reflection?: Reflection;
  thankYouEmail?: string;
  followUpEmail?: string;
}

export type ReminderType =
  | "interview"
  | "thank_you"
  | "follow_up"
  | "deadline"
  | "other";

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  interview: "Interview",
  thank_you: "Thank-you email",
  follow_up: "Follow-up email",
  deadline: "Application deadline",
  other: "Other",
};

export interface Reminder {
  id: string;
  jobId?: string;
  type: ReminderType;
  title: string;
  due: string; // ISO datetime
  done: boolean;
  createdAt: string;
}

export interface Profile {
  name: string;
  targetRole: string;
  masterResume: string;
  background: string;
  sheetsWebhookUrl: string;
}

export const EMPTY_PROFILE: Profile = {
  name: "",
  targetRole: "",
  masterResume: "",
  background: "",
  sheetsWebhookUrl: "",
};
