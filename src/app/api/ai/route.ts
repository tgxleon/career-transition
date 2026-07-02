import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod/v4";
import {
  SYSTEM_PROMPT,
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

export const maxDuration = 300;

const MODEL = "claude-opus-4-8";

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
      mitigation: z
        .string()
        .describe("Concrete, actionable way to address or reframe this gap"),
    })
  ),
  atsKeywords: z
    .array(z.string())
    .describe("Keywords from the job description the resume should contain"),
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
    | "cover_letter"
    | "interview_prep"
    | "vibe_check"
    | "thank_you"
    | "follow_up";
  job: JobContext;
  profile: ProfileContext;
  reflection?: ReflectionContext;
  context?: string;
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

  let body: AiRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    switch (body.task) {
      case "fit": {
        const response = await client.messages.parse({
          model: MODEL,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: fitPrompt(body.job, body.profile) }],
          output_config: { format: zodOutputFormat(FitSchema) },
        });
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        return NextResponse.json({ data: response.parsed_output });
      }
      case "interview_prep": {
        const response = await client.messages.parse({
          model: MODEL,
          max_tokens: 32000,
          thinking: { type: "adaptive" },
          system: SYSTEM_PROMPT,
          messages: [
            { role: "user", content: interviewPrepPrompt(body.job, body.profile) },
          ],
          output_config: { format: zodOutputFormat(PrepSchema) },
        });
        if (response.stop_reason === "refusal") {
          return refusal();
        }
        return NextResponse.json({ data: response.parsed_output });
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
          output_config: { format: zodOutputFormat(VibeSchema) },
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
            ? resumePrompt(body.job, body.profile)
            : body.task === "cover_letter"
              ? coverLetterPrompt(body.job, body.profile)
              : body.task === "thank_you"
                ? thankYouPrompt(body.job, body.profile, body.reflection)
                : followUpPrompt(body.job, body.profile, body.context);

        const response = await client.messages.create({
          model: MODEL,
          max_tokens: 16000,
          thinking: { type: "adaptive" },
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
