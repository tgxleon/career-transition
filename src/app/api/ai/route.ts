import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import {
  SYSTEM_PROMPT,
  auditPrompt,
  coverLetterPrompt,
  fitPrompt,
  followUpPrompt,
  interviewPrepPrompt,
  resumePrompt,
  thankYouPrompt,
  vibeCheckPrompt,
  JobContext,
  ProfileContext,
  ReflectionContext,
} from "@/lib/prompts";

import { checkRateLimit, clientIp } from "@/lib/ratelimit";

export const maxDuration = 300;

// Model is configurable: set ANTHROPIC_MODEL=claude-sonnet-5 for ~60% lower
// cost per generation with near-Opus quality on drafting work.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";

const KnockoutSchema = z.object({
  requirement: z.string(),
  status: z.enum(["met", "unclear", "not_met"]),
  note: z.string(),
});

const FitSchema = z.object({
  score: z
    .number()
    .describe("Overall fit score from 0 to 100"),
  verdict: z
    .string()
    .describe("One-line verdict, e.g. 'Strong fit — apply with confidence'"),
  summary: z
    .string()
    .describe("2-4 sentence honest assessment of the overall fit"),
  strengths: z.array(
    z.object({
      competency: z.string(),
      evidence: z
        .string()
        .describe("The candidate's concrete evidence for this competency"),
    })
  ),
  gaps: z.array(
    z.object({
      competency: z.string(),
      severity: z.enum(["low", "medium", "high"]),
      closableByRewording: z
        .boolean()
        .describe(
          "true if closable by rewording existing experience, false if a genuine gap"
        ),
      mitigation: z
        .string()
        .describe("Concrete, actionable way to address or reframe this gap"),
    })
  ),
  mustHaveKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        inResume: z
          .boolean()
          .describe(
            "whether the current resume already contains this term or an obvious variant"
          ),
      })
    )
    .describe("Hard keywords an ATS/recruiter search will match on"),
  niceToHaveKeywords: z.array(z.string()),
  knockouts: z
    .array(KnockoutSchema)
    .describe("Non-negotiable requirements and whether the candidate meets them"),
  reorderingPlan: z
    .array(z.string())
    .describe(
      "3-6 specific moves to put the strongest material in the resume's top third"
    ),
});

const AuditSchema = z.object({
  coverageScore: z
    .number()
    .describe("0-100 keyword/skills coverage of the tailored resume"),
  verdict: z
    .string()
    .describe("One line: ready to send, or needs the punch list first"),
  missingKeywords: z
    .array(z.string())
    .describe("Must-have terms still missing or buried"),
  readabilityFlags: z
    .array(z.string())
    .describe("Anything that could scramble in ATS parsing; empty if clean"),
  knockouts: z.array(KnockoutSchema),
  punchList: z.array(
    z.object({
      priority: z.enum(["high", "medium", "low"]),
      fix: z.string(),
    })
  ),
});

const PrepSchema = z.object({
  openingLine: z.string(),
  elevatorPitch: z.string().describe("~60 second tell-me-about-yourself pitch"),
  stories: z.array(
    z.object({
      title: z.string(),
      competency: z.string(),
      situation: z.string(),
      task: z.string(),
      action: z.string(),
      result: z.string(),
    })
  ),
  likelyQuestions: z.array(
    z.object({
      question: z.string(),
      approach: z.string(),
    })
  ),
  caseAndScenarioTips: z
    .string()
    .describe("Markdown guidance for case-study / scenario interviews"),
  difficultQuestions: z.array(
    z.object({
      question: z.string(),
      whyItsHard: z.string(),
      strategy: z.string(),
      sampleAnswer: z.string(),
    })
  ),
  questionsForInterviewer: z.array(z.string()),
});

const VibeSchema = z.object({
  rating: z
    .number()
    .describe("1-10 honest read on how the interview likely went"),
  read: z
    .string()
    .describe("Markdown: calibrated interpretation of the signals"),
  advice: z
    .string()
    .describe(
      "Markdown: what to do next — thank-you note angles, next-round prep, what not to ruminate on"
    ),
});

interface AiRequest {
  task:
    | "fit"
    | "resume"
    | "audit"
    | "cover_letter"
    | "interview_prep"
    | "vibe_check"
    | "thank_you"
    | "follow_up";
  job: JobContext;
  profile: ProfileContext;
  reflection?: ReflectionContext;
  context?: string;
  /** Strategist output (from a prior fit analysis) to steer the resume rewrite */
  fit?: {
    mustHaveKeywords?: { keyword: string; inResume: boolean }[];
    reorderingPlan?: string[];
  };
  /** Punch-list fixes from a prior audit to apply on regeneration */
  punchList?: string[];
  /** The tailored resume text to audit */
  resume?: string;
  /** Existing prep pack, for refinement requests */
  currentPrep?: unknown;
  /** User's instruction describing what to change in the prep pack */
  refinement?: string;
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured on the server. Copy .env.example to .env.local and add your key.",
      },
      { status: 500 }
    );
  }

  const rate = checkRateLimit(clientIp(req.headers));
  if (!rate.ok) {
    return NextResponse.json(
      {
        error: `You've hit the AI usage limit for now — try again in about ${rate.retryAfterMinutes} minute(s).`,
      },
      { status: 429 }
    );
  }

  let body: AiRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // The timeout must be set at CLIENT level: the SDK's "streaming required"
  // guard for large max_tokens only checks the client-level timeout, not
  // per-request options. 280s stays inside Vercel's 300s function cap.
  const client = new Anthropic({ timeout: 280_000 });

  try {
    switch (body.task) {
      case "fit": {
        const response = await client.messages.parse({
          model: MODEL,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: fitPrompt(body.job, body.profile) }],
          // medium effort: keeps requests inside serverless time limits —
          // a completed analysis beats a deeper one that times out
          output_config: {
            effort: "medium",
            format: zodOutputFormat(FitSchema),
          },
        });
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        return NextResponse.json({ data: response.parsed_output });
      }
      case "interview_prep": {
        // The prep pack is the largest artifact: give it a big output budget.
        // The explicit timeout suppresses the SDK's streaming guard and stays
        // inside Vercel's 300s function cap.
        const response = await client.messages.parse(
          {
            model: MODEL,
            max_tokens: 32000,
            thinking: { type: "adaptive" },
            system: SYSTEM_PROMPT,
            messages: [
              {
                role: "user",
                content: interviewPrepPrompt(
                  body.job,
                  body.profile,
                  body.currentPrep ? JSON.stringify(body.currentPrep) : undefined,
                  body.refinement
                ),
              },
            ],
            // medium effort: drafting doesn't need deep deliberation, and it
            // stops the model's thinking from starving the output budget —
            // the cause of packs arriving with empty tail sections.
            output_config: {
              effort: "medium",
              format: zodOutputFormat(PrepSchema),
            },
          }
        );
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        if (response.stop_reason === "max_tokens") {
          return NextResponse.json(
            {
              error:
                "The generation ran out of space before finishing — please try again.",
            },
            { status: 502 }
          );
        }
        const prep = response.parsed_output;
        // Guard against budget-starved output: never hand back a pack with
        // hollowed-out tail sections.
        if (
          !prep ||
          prep.stories.length === 0 ||
          prep.likelyQuestions.length === 0 ||
          prep.difficultQuestions.length === 0 ||
          prep.questionsForInterviewer.length === 0
        ) {
          return NextResponse.json(
            {
              error:
                "The prep pack came back incomplete — please try generating again.",
            },
            { status: 502 }
          );
        }
        return NextResponse.json({ data: prep });
      }
      case "vibe_check": {
        const response = await client.messages.parse({
          model: MODEL,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: vibeCheckPrompt(
                body.job,
                body.profile,
                body.reflection ?? {}
              ),
            },
          ],
          output_config: {
            effort: "medium",
            format: zodOutputFormat(VibeSchema),
          },
        });
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        return NextResponse.json({ data: response.parsed_output });
      }
      case "audit": {
        if (!body.resume) {
          return NextResponse.json(
            { error: "No tailored resume to audit — generate one first." },
            { status: 400 }
          );
        }
        const response = await client.messages.parse({
          model: MODEL,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: auditPrompt(body.job, body.profile, body.resume),
            },
          ],
          output_config: {
            effort: "medium",
            format: zodOutputFormat(AuditSchema),
          },
        });
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        return NextResponse.json({ data: response.parsed_output });
      }
      case "resume":
      case "cover_letter":
      case "thank_you":
      case "follow_up": {
        const prompt =
          body.task === "resume"
            ? resumePrompt(
                body.job,
                body.profile,
                body.fit
                  ? {
                      missingMustHaves: body.fit.mustHaveKeywords
                        ?.filter((k) => !k.inResume)
                        .map((k) => k.keyword),
                      reorderingPlan: body.fit.reorderingPlan,
                    }
                  : undefined,
                body.punchList
              )
            : body.task === "cover_letter"
              ? coverLetterPrompt(body.job, body.profile)
              : body.task === "thank_you"
                ? thankYouPrompt(body.job, body.profile, body.reflection)
                : followUpPrompt(body.job, body.profile, body.context);

        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          // drafting tasks: medium effort keeps quality but cuts thinking
          // time sharply, so requests stay inside serverless time limits
          output_config: { effort: "medium" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        });
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        const text = response.content
          .filter((b) => b.type === "text")
          .map((b) => b.text)
          .join("\n");
        return NextResponse.json({ data: text });
      }
      default:
        return NextResponse.json({ error: "Unknown task" }, { status: 400 });
    }
  } catch (err: unknown) {
    if (err instanceof Anthropic.AuthenticationError) {
      return NextResponse.json(
        { error: "Invalid Anthropic API key — check ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }
    if (err instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { error: "Rate limited by the Claude API — wait a minute and retry." },
        { status: 429 }
      );
    }
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API error (${err.status}): ${err.message}` },
        { status: 502 }
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function refusal() {
  return NextResponse.json(
    {
      error:
        "The model declined this request. Review the pasted content and try again.",
    },
    { status: 422 }
  );
}
