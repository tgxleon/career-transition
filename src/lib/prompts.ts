// Server-side prompt builders. Each returns the user prompt for one AI task.

export interface JobContext {
  company: string;
  role: string;
  location?: string;
  salary?: string;
  description: string;
  notes?: string;
}

export interface ProfileContext {
  name?: string;
  targetRole?: string;
  masterResume: string;
  background?: string;
}

export interface ReflectionContext {
  interviewDate?: string;
  interviewers?: string;
  format?: string;
  wentWell?: string;
  couldImprove?: string;
  keyTopics?: string;
  concerns?: string;
}

function jobBlock(job: JobContext): string {
  return `<job>
Company: ${job.company}
Role: ${job.role}
${job.location ? `Location: ${job.location}` : ""}
${job.salary ? `Salary: ${job.salary}` : ""}

Job description:
${job.description || "(no description provided — infer from company and role title)"}
${job.notes ? `\nCandidate's own notes on this job:\n${job.notes}` : ""}
</job>`;
}

function profileBlock(profile: ProfileContext): string {
  return `<candidate>
${profile.name ? `Name: ${profile.name}` : ""}
${profile.targetRole ? `Target role / direction: ${profile.targetRole}` : ""}

Master resume:
${profile.masterResume || "(no resume provided)"}
${profile.background ? `\nCareer background & transition context (in the candidate's own words):\n${profile.background}` : ""}
</candidate>`;
}

export const SYSTEM_PROMPT = `You are an experienced career coach and recruiter who has reviewed thousands of resumes and sat on hiring panels across industries. You help job seekers — especially career changers — present their genuine experience in the strongest honest light. You never fabricate experience, employers, credentials, dates, or metrics that are not in the candidate's materials; where evidence is thin you say so and suggest how the candidate can honestly address it. You write in clear, natural language without clichés ("passionate", "results-driven", "synergy") and you calibrate advice to the specific job description rather than giving generic tips.`;

export function fitPrompt(job: JobContext, profile: ProfileContext): string {
  return `Assess how well this candidate fits this job.

${jobBlock(job)}

${profileBlock(profile)}

Score fit out of 100 (calibrate honestly: 80+ means "strong candidate, apply with confidence", 60–79 "credible with gaps to address", 40–59 "stretch — needs a strong narrative", below 40 "significant mismatch"). Identify the competencies the job actually requires (read between the lines of the description, not just the listed requirements), map the candidate's evidence against each, and surface gaps with severity and a concrete mitigation the candidate can act on (a resume framing, a skill to brush up, a story to prepare). Also extract the ATS keywords from the job description that the candidate's resume should contain.`;
}

export function resumePrompt(job: JobContext, profile: ProfileContext): string {
  return `Rewrite the candidate's master resume tailored to this specific job, in an ATS-friendly format.

${jobBlock(job)}

${profileBlock(profile)}

Requirements:
- Output the complete resume as clean Markdown (single column, standard section headings: Summary, Experience, Education, Skills, plus Certifications/Projects if relevant). No tables, no columns, no images — ATS parsers must read it linearly.
- Open with a 2–3 line professional summary written for THIS role.
- Reorder and reword bullet points to front-load the experience most relevant to this job description; naturally weave in the exact keywords and phrasing from the posting where the candidate genuinely has that experience.
- Keep every bullet truthful to the master resume — sharpen wording and emphasis, never invent scope, numbers, or responsibilities.
- Use strong verbs and, where the master resume provides them, quantified results.
- Standard reverse-chronological order, consistent date formats.
- After the resume, add a short "--- \n## Tailoring notes" section listing what you changed and which JD keywords you worked in, so the candidate can review the choices.`;
}

export function coverLetterPrompt(
  job: JobContext,
  profile: ProfileContext
): string {
  return `Draft a cover letter for this application.

${jobBlock(job)}

${profileBlock(profile)}

Requirements:
- 250–350 words, 3–4 paragraphs, output as Markdown.
- Open with a specific, non-generic hook about why this candidate → this company/role (use the background context if it helps tell the transition story).
- Middle: 2–3 concrete proof points from the resume mapped to the job's top requirements. If the candidate is changing careers, frame transferable skills confidently rather than apologising for the switch.
- Close with a confident, low-pressure call to action.
- Sound like a person, not a template. No "I am writing to express my interest".`;
}

export function interviewPrepPrompt(
  job: JobContext,
  profile: ProfileContext
): string {
  return `Build an interview preparation pack for this candidate and job.

${jobBlock(job)}

${profileBlock(profile)}

Include:
1. An opening line + a ~60-second elevator pitch for "tell me about yourself", tailored to this role and honest about any career transition.
2. 4–6 STAR stories mined from the candidate's actual resume/background, each mapped to a competency this job will probe. Use only real experience from their materials; where a detail is missing, mark it like [add metric] for the candidate to fill in.
3. 6–10 likely interview questions for THIS role (mix behavioural/fit, scenario-based, and role-specific technical or domain questions) with a recommended approach for each.
4. Case-study / scenario interview guidance if this role type typically uses them (frameworks to structure answers, what interviewers look for) — otherwise general scenario-question guidance.
5. 4–6 difficult questions this specific candidate should expect (gaps, career change, "why are you leaving", salary, weaknesses grounded in their actual profile), each with why it's hard for them, a strategy, and a sample answer.
6. 5–7 sharp questions the candidate should ask the interviewers (specific to this company/role, not generic).`;
}

export function vibeCheckPrompt(
  job: JobContext,
  profile: ProfileContext,
  reflection: ReflectionContext
): string {
  return `The candidate just finished an interview and wrote a reflection. Give them an honest "vibe check": a calibrated read on how it likely went, and what to do next.

${jobBlock(job)}

<reflection>
${reflection.interviewDate ? `Interview date: ${reflection.interviewDate}` : ""}
${reflection.interviewers ? `Interviewers: ${reflection.interviewers}` : ""}
${reflection.format ? `Format: ${reflection.format}` : ""}
What went well: ${reflection.wentWell || "(not filled in)"}
What could have gone better: ${reflection.couldImprove || "(not filled in)"}
Key topics discussed: ${reflection.keyTopics || "(not filled in)"}
Concerns / gut feeling: ${reflection.concerns || "(not filled in)"}
</reflection>

Rate how the interview likely went on a 1–10 scale (5 = genuinely uncertain; be honest, not falsely reassuring — but also counteract the common bias where candidates catastrophise normal interview friction). Give your read on the signals in the reflection (what's a real yellow flag vs. normal), and concrete advice: what to address in the thank-you note, what to prepare if there's a next round, and anything to stop ruminating about.`;
}

export function thankYouPrompt(
  job: JobContext,
  profile: ProfileContext,
  reflection?: ReflectionContext
): string {
  return `Draft a post-interview thank-you email.

${jobBlock(job)}

${profileBlock(profile)}
${
    reflection
      ? `<reflection>
Interviewers: ${reflection.interviewers || "(unknown)"}
Key topics discussed: ${reflection.keyTopics || "(not recorded)"}
What went well: ${reflection.wentWell || "(not recorded)"}
What could have gone better: ${reflection.couldImprove || "(not recorded)"}
</reflection>`
      : "(No reflection recorded — keep the email adaptable with [placeholders] for specifics.)"
  }

Requirements:
- Subject line + body, under 150 words, output as Markdown.
- Reference 1–2 specific topics from the conversation (from the reflection if available, otherwise leave a [specific topic discussed] placeholder).
- If something went less well in the interview, optionally include ONE graceful line that reinforces or clarifies the candidate's strength on that point — without sounding defensive.
- Reaffirm interest with one concrete reason tied to the conversation. Warm, brief, zero grovelling.`;
}

export function followUpPrompt(
  job: JobContext,
  profile: ProfileContext,
  context?: string
): string {
  return `Draft a follow-up email for this application (candidate has not heard back).

${jobBlock(job)}

${profileBlock(profile)}
${context ? `\nSituation: ${context}` : ""}

Requirements:
- Subject line + body, under 120 words, output as Markdown.
- Politely check in on status/timeline, restate interest in one sentence, and add ONE new piece of value (a relevant thought, a recent accomplishment, or a link placeholder) so the email isn't a pure nudge.
- Easy for the recipient to answer. Confident and light — never desperate or passive-aggressive.`;
}
