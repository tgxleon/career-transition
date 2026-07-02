# Career Compass

A companion app for job seekers and career changers that tracks every
application **from "should I even apply?" to the thank-you note** — with AI
doing the heavy lifting at each step.

## The journey it supports

| Stage | Feature |
|---|---|
| Assessing | **Fit analysis** — scores your fit /100, maps required competencies against your evidence, surfaces gaps (with severity + concrete mitigations), and extracts ATS keywords |
| Applying | **ATS resume tailoring** — rewrites your master resume for the specific posting (single-column ATS format, keywords woven in, tailoring notes included) and **cover letter drafts** |
| Tracking | **Pipeline tracker** (Saved → Applied → Interview → Offer) with dashboard, **CSV export**, and **Google Sheets sync** |
| Staying on top | **Reminders** for interview dates, thank-you emails, follow-ups, and deadlines — with one-click presets on each job |
| Interviewing | **Interview prep pack** — opening line + elevator pitch, STAR stories mined from your real resume, likely questions (fit / scenario / case), case-study guidance, difficult questions personalised to *your* risk areas, and questions to ask the panel |
| Afterwards | **Post-interview reflection** + AI **vibe check** (an honest, calibrated read on how it went), **thank-you email** drafts that reference your actual conversation, and **follow-up email** drafts |

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **Claude API** (`claude-opus-4-8`, adaptive thinking, structured outputs) via API routes
- Data lives in **your browser's localStorage** — no account, no database, nothing leaves your machine except the AI calls
- Google Sheets sync via a simple Apps Script webhook you own

## Getting started

```bash
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Then:

1. Open **Profile & Settings** and paste your **master resume** (and,
   optionally, your career-transition story). Every AI feature uses these as
   its only source of truth — nothing is ever invented beyond them.
2. Add a job on the **Jobs** page and paste the full job description.
3. Work through the tabs on the job page: **Fit Analysis → Resume → Cover
   Letter → Interview Prep → Reflection → Emails**.

## Google Sheets sync (optional)

Settings → Google Sheets sync has step-by-step instructions: you create a
Google Sheet, paste a ~10-line Apps Script, deploy it as a web app, and paste
the URL into settings. "Sync to Google Sheets" on the Jobs page then mirrors
your whole tracker to the sheet. (Or just use **Export CSV**.)

## Honesty by design

The system prompt hard-constrains the AI: it may sharpen wording and reorder
emphasis, but it never fabricates employers, dates, scope, or metrics that
aren't in your materials. Where a detail is missing it inserts an explicit
`[add metric]` placeholder for you to fill in.
