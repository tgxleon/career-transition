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
  return `You are acting as two specialists in sequence: first a Scout who builds the target profile from the job description, then a Strategist who scores the candidate against it and plans the attack.

${jobBlock(job)}

${profileBlock(profile)}

SCOUT — build the target profile from the job description:
1. Extract the must-have keywords: the concrete terms a recruiter's ranked search or an ATS keyword match would filter on (skills, tools, methodologies, domain terms, credentials — the exact phrasing the posting uses). For EACH one, check whether the candidate's current resume already contains it (or an obvious variant) and mark it present or missing.
2. Extract nice-to-have keywords: terms that boost ranking but won't knock the candidate out.
3. Identify knockout requirements: non-negotiables like years of experience, certifications, licences, work authorisation, education minimums. For each, judge from the resume whether it is met, unclear, or not met, with a short note.

STRATEGIST — score and plan:
4. Score overall fit out of 100. Calibrate honestly: 80+ "strong candidate, apply with confidence", 60–79 "credible with gaps to address", 40–59 "stretch — needs a strong narrative", below 40 "significant mismatch". Weigh keyword/skills coverage, knockouts, and the strength of underlying evidence — not keyword count alone.
5. Map the competencies the job actually requires (read between the lines, not just the listed requirements) against the candidate's concrete evidence — these are the strengths.
6. Find the real gaps, and for each be honest about whether it is closable by rewording experience the candidate already has (closableByRewording: true) or a genuine gap (false). Give severity and a concrete mitigation: a reframing, a skill to brush up, a story to prepare.
7. Give a reordering plan: which sections, roles, and bullets to move up so the strongest, most relevant experience sits in the top third of the resume, where recruiters and ATS ranking both weight most. 3–6 specific, actionable moves.

Do not invent experience the candidate does not have.`;
}

export interface StrategistBrief {
  missingMustHaves?: string[];
  reorderingPlan?: string[];
}

export function resumePrompt(
  job: JobContext,
  profile: ProfileContext,
  strategist?: StrategistBrief,
  punchList?: string[]
): string {
  return `You are the Surgeon: rewrite the candidate's master resume tailored to this specific job, in an ATS-safe format.

${jobBlock(job)}

${profileBlock(profile)}
${
    strategist &&
    ((strategist.missingMustHaves?.length ?? 0) > 0 ||
      (strategist.reorderingPlan?.length ?? 0) > 0)
      ? `<strategist_plan>
${
          strategist.missingMustHaves?.length
            ? `Must-have keywords currently MISSING from the resume — weave these in, but ONLY where the candidate genuinely has the experience (skip any that would be a lie):
${strategist.missingMustHaves.map((k) => `- ${k}`).join("\n")}`
            : ""
        }
${
          strategist.reorderingPlan?.length
            ? `Reordering plan (put the strongest material in the top third):
${strategist.reorderingPlan.map((r) => `- ${r}`).join("\n")}`
            : ""
        }
</strategist_plan>`
      : ""
  }
${
    punchList?.length
      ? `<audit_punch_list>
A previous audit of the last draft flagged these fixes — apply them:
${punchList.map((p) => `- ${p}`).join("\n")}
</audit_punch_list>`
      : ""
  }

Rules:
- Rewrite every bullet in the XYZ format — "Accomplished [X] as measured by [Y] by doing [Z]" — or as close to it as the material honestly allows. Where a metric plausibly exists but isn't in the master resume, insert an explicit [add metric] placeholder rather than inventing a number.
- Weave in the must-have keywords from the job description in natural language, never stuffed, and only where genuinely true for this candidate.
- Strip everything that breaks ATS parsing: output clean Markdown, single column, standard headings (Summary, Experience, Skills, Education, plus Certifications/Projects if relevant). No tables, no columns, no images or graphics.
- Open with a 2–3 line professional summary written for THIS role.
- Front-load relevance: the top third of the resume carries the strongest, most job-relevant material.
- Keep every line truthful to the master resume — sharpen wording and emphasis, never invent scope, numbers, employers, dates, or responsibilities.
- Standard reverse-chronological order, consistent date formats, tight length (equivalent of 1–2 pages).
- After the resume, add a short "--- \n## Tailoring notes" section listing what you changed and which JD keywords you worked in, so the candidate can review the choices.`;
}

export function auditPrompt(
  job: JobContext,
  profile: ProfileContext,
  resume: string
): string {
  return `You are the Auditor — the strict final check before the candidate applies. Your job is to catch what the earlier steps missed. Be strict; do not rubber-stamp.

${jobBlock(job)}

<tailored_resume>
${resume}
</tailored_resume>

<candidate_background>
${profile.background || "(none provided)"}
</candidate_background>

Audit the tailored resume against the job description:
1. Keyword coverage: score 0–100 how well the resume covers the keywords and skills a recruiter's ranked search / ATS match would use for THIS posting, and list any must-have term still missing or buried (mentioned once in passing where it should be prominent).
2. Machine-readability: flag anything that could scramble in ATS parsing — remaining tables or columns, unusual characters, non-standard section headings, contact info that looks like a header/footer, date format inconsistencies. If it's clean, say so with an empty list.
3. Knockout requirements: for each non-negotiable in the posting (years, certifications, licences, education, work authorisation), state whether this resume clearly demonstrates it (met), leaves it ambiguous (unclear), or doesn't (not_met) — with a short note on how to address it honestly.
4. Punch list: a prioritized list of the final fixes (high/medium/low) that would push this resume highest in a recruiter's ranked search. Concrete edits, not platitudes.
5. One-line overall verdict: ready to send, or needs the punch list first.

Never suggest inventing experience — every fix must be achievable with the candidate's real background.`;
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
  profile: ProfileContext,
  currentPrep?: string,
  refinement?: string
): string {
  if (currentPrep && refinement) {
    return `The candidate has an interview preparation pack and wants specific parts amended. Apply ONLY the requested changes; reproduce every other field of the pack unchanged (same stories, same questions, same wording).

${jobBlock(job)}

${profileBlock(profile)}

<current_prep_pack>
${currentPrep}
</current_prep_pack>

<requested_changes>
${refinement}
</requested_changes>

Output the complete updated pack. Every list must remain fully populated — never return an empty list.`;
  }
  return `Build an interview preparation pack for this candidate and job.

${jobBlock(job)}

${profileBlock(profile)}

Include:
1. An opening line + a ~60-second elevator pitch for "tell me about yourself", tailored to this role and honest about any career transition.
2. 4–6 STAR stories mined from the candidate's actual resume/background, each mapped to a competency this job will probe. Use only real experience from their materials; where a detail is missing, mark it like [add metric] for the candidate to fill in.
3. 6–10 likely interview questions for THIS role (mix behavioural/fit, scenario-based, and role-specific technical or domain questions) with a recommended approach for each.
4. Case-study / scenario interview guidance if this role type typically uses them (frameworks to structure answers, what interviewers look for) — otherwise general scenario-question guidance.
5. 4–6 difficult questions this specific candidate should expect (gaps, career change, "why are you leaving", salary, weaknesses grounded in their actual profile), each with why it's hard for them, a strategy, and a sample answer.
6. 5–7 sharp questions the candidate should ask the interviewers (specific to this company/role, not generic).

Every section is mandatory and every list must be populated — in particular, sections 5 and 6 must never be empty. Keep individual entries tight rather than dropping later sections; the last two sections matter as much as the first.`;
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
