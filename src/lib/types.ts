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
  mitigation: string;
}

export interface FitAnalysis {
  score: number;
  verdict: string;
  summary: string;
  strengths: FitStrength[];
  gaps: FitGap[];
  atsKeywords: string[];
  generatedAt: string;
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
