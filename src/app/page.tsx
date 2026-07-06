import Link from "next/link";

/* ————————————————————————————————————————————————————————————————
   Career Compass landing page — LE CAMP style system.
   Palette is strictly #fe3a3a / #000 / #fff / #767676 with surfaces
   #f5f5f5 (glacier mist), #f5f0e8 (trail cream), #0a1628 (base camp
   dark). Red appears only where a decision is asked for.
   ———————————————————————————————————————————————————————————————— */

const RED = "#fe3a3a";
const DARK = "#0a1628";
const CREAM = "#f5f0e8";
const MIST = "#f5f5f5";
const PATCH_BLUE = "#4a7fc5";

function MonoTag({
  children,
  light = false,
  className = "",
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`font-[family-name:var(--font-mono)] text-[10px] uppercase leading-[1.3] tracking-[0.04em] ${
        light ? "text-white" : "text-black"
      } ${className}`}
    >
      {children}
    </div>
  );
}

/* Shield-shaped program patch — expedition merit badge. */
function Patch({
  label,
  color,
  outline = false,
  icon,
  className = "",
  style,
}: {
  label: string;
  color: string;
  outline?: boolean;
  icon: "mountain" | "flag" | "campfire" | "compass";
  className?: string;
  style?: React.CSSProperties;
}) {
  const stroke = outline ? "#ffffff" : "#ffffff";
  const fill = outline ? "transparent" : color;
  const icons: Record<string, React.ReactNode> = {
    mountain: (
      <path
        d="M20 62 L38 34 L48 48 L58 30 L80 62 Z"
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
    flag: (
      <g fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round">
        <path d="M40 66 V26" />
        <path d="M40 28 H66 L58 37 L66 46 H40" />
      </g>
    ),
    campfire: (
      <g fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round">
        <path d="M50 28 C58 38 60 44 54 52 C62 50 63 42 61 38 C68 46 66 58 50 60 C34 58 32 46 39 38 C37 42 38 50 46 52 C40 44 42 38 50 28 Z" />
        <path d="M34 66 L66 60 M34 60 L66 66" />
      </g>
    ),
    compass: (
      <g fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round">
        <circle cx="50" cy="46" r="18" />
        <path d="M58 38 L52 50 L42 54 L48 42 Z" />
      </g>
    ),
  };
  return (
    <div
      className={`select-none ${className}`}
      style={{ width: 120, ...style }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 130"
        width="120"
        style={{
          filter: "drop-shadow(0 4px 20px rgba(10,22,40,0.4))",
        }}
      >
        <path
          d="M8 14 Q8 6 16 6 H84 Q92 6 92 14 V86 Q92 100 50 124 Q8 100 8 86 Z"
          fill={fill}
          stroke={outline ? "#ffffff" : color}
          strokeWidth="2"
        />
        {icons[icon]}
        <text
          x="50"
          y="88"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="9"
          fontFamily="var(--font-mono)"
          letterSpacing="0.5"
        >
          {label}
        </text>
      </svg>
    </div>
  );
}

/* Topographic contour field for the dark hero — expedition cartography,
   no stock photography. */
function TopoField() {
  return (
    <svg
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 1440 900"
      aria-hidden="true"
    >
      <rect width="1440" height="900" fill={DARK} />
      <g fill="none" stroke="#ffffff" strokeOpacity="0.10" strokeWidth="1">
        <path d="M-50 720 Q240 600 480 680 T980 640 T1490 700" />
        <path d="M-50 660 Q260 530 500 620 T1000 570 T1490 640" />
        <path d="M-50 600 Q290 470 530 560 T1020 510 T1490 580" />
        <path d="M-50 540 Q320 420 560 500 T1040 450 T1490 520" />
        <path d="M-50 480 Q350 380 590 440 T1060 400 T1490 460" />
        <path d="M-50 420 Q380 330 620 380 T1080 350 T1490 400" />
        <path d="M-50 360 Q410 290 650 330 T1100 300 T1490 340" />
        <path d="M-50 300 Q440 240 680 280 T1120 250 T1490 290" />
        <path d="M-50 240 Q470 200 710 230 T1140 210 T1490 240" />
      </g>
      {/* ridge silhouettes */}
      <path
        d="M0 900 L0 760 L260 560 L420 700 L640 460 L840 660 L1040 500 L1240 680 L1440 560 L1440 900 Z"
        fill="#000000"
        fillOpacity="0.35"
      />
      <path
        d="M0 900 L0 820 L200 680 L400 800 L620 620 L880 790 L1120 640 L1440 780 L1440 900 Z"
        fill="#000000"
        fillOpacity="0.5"
      />
      {/* summit marker */}
      <g stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1" fill="none">
        <circle cx="640" cy="460" r="6" />
        <circle cx="640" cy="460" r="14" />
      </g>
    </svg>
  );
}

const WAYPOINTS = [
  {
    n: "01",
    tag: "ASSESS",
    title: "Fit score /100",
    body: "Before you spend an evening applying, know where you stand. Competency mapping, honest gaps with mitigations, and the ATS keywords the posting is really asking for.",
  },
  {
    n: "02",
    tag: "TAILOR",
    title: "ATS resume + cover letter",
    body: "Your master resume rewritten for this posting — single-column ATS format, keywords woven in, nothing invented. Cover letter only if the job calls for one.",
  },
  {
    n: "03",
    tag: "TRACK",
    title: "Pipeline & reminders",
    body: "Saved → Applied → Interview → Offer, with reminders for interview dates, thank-you notes and follow-ups. Sync the whole tracker to your own Google Sheet.",
  },
  {
    n: "04",
    tag: "INTERVIEW",
    title: "Prep pack",
    body: "Opening line, 60-second pitch, STAR stories mined from your real experience, case-study guidance, and the difficult questions you specifically should expect.",
  },
  {
    n: "05",
    tag: "REFLECT",
    title: "Vibe check",
    body: "Write down how it went while it's fresh. Get a calibrated read — what's a real yellow flag, what's normal interview friction, what to stop ruminating on.",
  },
  {
    n: "06",
    tag: "FOLLOW UP",
    title: "Email drafts",
    body: "Thank-you notes that reference what you actually discussed, and follow-ups that add value instead of just nudging. Under 150 words, zero grovelling.",
  },
];

export default function Landing() {
  return (
    <div className="bg-white text-black">
      {/* ————— HERO — full-bleed base camp dark ————— */}
      <section className="relative overflow-hidden" style={{ background: DARK }}>
        <TopoField />

        {/* nav — transparent over hero */}
        <header className="relative z-10">
          <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-[15px]">
            <div className="flex items-center gap-[10px]">
              <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
                <path d="M13 2 L24 22 H2 Z" fill={RED} />
              </svg>
              <span className="font-[family-name:var(--font-display)] text-[18px] font-extrabold text-white">
                CAREER COMPASS
              </span>
            </div>
            <div className="flex items-center gap-[10px]">
              <Link
                href="/dashboard"
                className="rounded-[10px] px-[20px] py-[10px] text-[14px] text-white transition-opacity hover:opacity-70"
              >
                Sign in
              </Link>
              <Link
                href="/settings"
                className="rounded-[35px] px-[20px] py-[10px] text-[14px] text-white transition-transform hover:scale-[1.03]"
                style={{
                  background: RED,
                  boxShadow: "0 2px 12px rgba(254,58,58,0.25)",
                }}
              >
                Start free
              </Link>
            </div>
          </div>
        </header>

        {/* hero content */}
        <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col items-center px-5 pb-[120px] pt-[100px] text-center">
          <MonoTag light className="mb-[15px]">
            BASE CAMP FOR CAREER CHANGERS &amp; JOB SEEKERS
          </MonoTag>
          <h1
            className="font-[family-name:var(--font-display)] font-extrabold text-white"
            style={{
              fontSize: "clamp(48px, 7.5vw, 88px)",
              lineHeight: 1.0,
            }}
          >
            EVERY APPLICATION
            <br />
            IS AN EXPEDITION.
          </h1>
          <p className="mt-[20px] max-w-[560px] text-[16px] leading-[1.4] text-white/85">
            Career Compass guides each one from fit check to thank-you note —
            AI fit scoring, ATS resume tailoring, interview prep and honest
            post-interview reads. Your data stays in your browser.
          </p>
          <div className="mt-[30px] flex items-center gap-[15px]">
            <Link
              href="/settings"
              className="rounded-[35px] px-[28px] py-[13px] text-[14px] font-medium text-white transition-transform hover:scale-[1.03]"
              style={{
                background: RED,
                boxShadow: "0 2px 12px rgba(254,58,58,0.25)",
              }}
            >
              Set up base camp — it&apos;s free
            </Link>
            <a
              href="#route"
              className="rounded-[10px] border border-white/60 px-[20px] py-[12px] text-[14px] text-white transition-colors hover:bg-white/10"
            >
              See the route
            </a>
          </div>

          {/* floating program patches — kept clear of the headline block */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <Patch
              label="FIT SCORE"
              color={RED}
              icon="mountain"
              className="absolute left-[6%] top-[52%] -rotate-6"
            />
            <Patch
              label="PREP PACK"
              color={PATCH_BLUE}
              icon="campfire"
              className="absolute right-[6%] top-[46%] rotate-6"
            />
            <Patch
              label="ATS READY"
              color="transparent"
              outline
              icon="flag"
              className="absolute bottom-[2%] left-[14%] -rotate-3"
            />
          </div>
        </div>
      </section>

      {/* ————— ASYMMETRIC ABOUT — white expanse ————— */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1200px] gap-[40px] px-5 py-[60px] md:grid-cols-[40%_55%] md:justify-between">
          <div className="max-w-[420px]">
            <MonoTag className="mb-[15px]">WHY IT EXISTS</MonoTag>
            <p className="text-[16px] leading-[1.4]">
              Job searching — especially changing careers — is a dozen small
              crafts done under pressure: reading a posting honestly, tailoring
              a resume without lying, preparing stories, writing the note
              afterwards. Career Compass puts a{" "}
              <span style={{ color: RED }}>coach at every step</span>, grounded
              in one rule: nothing is ever invented beyond your real
              experience.
            </p>
            <Link
              href="/settings"
              className="mt-[20px] inline-block rounded-[10px] border border-black px-[20px] py-[10px] text-[14px] transition-colors hover:bg-black hover:text-white"
            >
              Upload your resume to start
            </Link>
          </div>
          <h2
            className="font-[family-name:var(--font-display)] font-extrabold"
            style={{ fontSize: "clamp(44px, 6.5vw, 90px)", lineHeight: 1.0 }}
          >
            FROM FIT CHECK TO THANK-YOU NOTE.
          </h2>
        </div>
      </section>

      {/* ————— THE ROUTE — glacier mist waypoints ————— */}
      <section id="route" style={{ background: MIST }}>
        <div className="mx-auto max-w-[1200px] px-5 py-[60px]">
          <MonoTag className="mb-[15px] text-center">THE ROUTE</MonoTag>
          <h2
            className="mb-[40px] text-center font-[family-name:var(--font-display)] text-[26px] font-extrabold leading-[1.2]"
          >
            Six waypoints. One companion.
          </h2>
          <div className="grid gap-[10px] md:grid-cols-2 lg:grid-cols-3">
            {WAYPOINTS.map((w) => (
              <div
                key={w.n}
                className="rounded-[20px] bg-white p-[30px]"
              >
                <div className="flex items-baseline justify-between">
                  <MonoTag>
                    {w.n} — {w.tag}
                  </MonoTag>
                </div>
                <h3 className="mt-[15px] font-[family-name:var(--font-display)] text-[26px] font-extrabold leading-[1.2]">
                  {w.title}
                </h3>
                <p className="mt-[10px] text-[14px] leading-[1.4]">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— STATS — social proof on white ————— */}
      <section className="bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-[10px] px-5 py-[60px] text-center md:flex-row md:justify-around">
          {[
            ["1", "master resume, infinite honest tailorings"],
            ["/100", "calibrated fit score before you apply"],
            ["0", "data stored on our servers — it lives in your browser"],
          ].map(([n, label]) => (
            <div key={label} className="max-w-[260px]">
              <div className="font-[family-name:var(--font-display)] text-[26px] font-extrabold">
                {n}
              </div>
              <div className="mt-[5px] text-[16px] leading-[1.4]">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ————— CREAM FEATURE CARD — the honesty pledge ————— */}
      <section className="bg-white pb-[60px]">
        <div className="mx-auto max-w-[1200px] px-5">
          <div
            className="rounded-[20px] p-[40px]"
            style={{ background: CREAM }}
          >
            <MonoTag className="mb-[15px]">FIELD RULES</MonoTag>
            <h2
              className="max-w-[720px] font-[family-name:var(--font-display)] font-extrabold leading-[1.1]"
              style={{ fontSize: "clamp(28px, 3.5vw, 44px)", color: RED }}
            >
              Sharpened, never fabricated.
            </h2>
            <div className="mt-[20px] grid gap-[30px] md:grid-cols-3">
              {[
                [
                  "YOUR EVIDENCE ONLY",
                  "The AI reorders and rewords what's genuinely in your resume. Missing metrics become [add metric] placeholders for you — never invented numbers.",
                ],
                [
                  "GAPS, NAMED",
                  "Weak spots are surfaced with severity and a concrete move: a framing, a story to prepare, a skill to brush up. No false reassurance.",
                ],
                [
                  "YOUR MACHINE, YOUR DATA",
                  "The tracker lives in your browser's local storage. Export to CSV or your own Google Sheet whenever you like.",
                ],
              ].map(([tag, body]) => (
                <div key={tag}>
                  <MonoTag className="mb-[10px]">{tag}</MonoTag>
                  <p className="text-[14px] leading-[1.4]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ————— FINAL CTA — return to the dark ————— */}
      <section
        className="relative overflow-hidden text-center"
        style={{ background: DARK }}
      >
        <div className="relative z-10 mx-auto max-w-[1200px] px-5 py-[80px]">
          <MonoTag light className="mb-[15px]">
            NO ACCOUNT. NO CARD. JUST A RESUME.
          </MonoTag>
          <h2
            className="mx-auto max-w-[800px] font-[family-name:var(--font-display)] font-extrabold text-white"
            style={{ fontSize: "clamp(40px, 6vw, 72px)", lineHeight: 1.0 }}
          >
            THE SUMMIT IS AN OFFER LETTER.
          </h2>
          <Link
            href="/settings"
            className="mt-[30px] inline-block rounded-[35px] px-[28px] py-[13px] text-[14px] font-medium text-white transition-transform hover:scale-[1.03]"
            style={{
              background: RED,
              boxShadow: "0 2px 12px rgba(254,58,58,0.25)",
            }}
          >
            Start climbing
          </Link>
        </div>
      </section>

      {/* ————— FOOTER ————— */}
      <footer className="border-t border-black bg-white">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-[10px] px-5 py-[20px] text-[14px] md:flex-row">
          <div className="flex items-center gap-[10px]">
            <svg width="16" height="16" viewBox="0 0 26 26" aria-hidden="true">
              <path d="M13 2 L24 22 H2 Z" fill={RED} />
            </svg>
            <span className="font-[family-name:var(--font-display)] font-extrabold">
              CAREER COMPASS
            </span>
          </div>
          <MonoTag>BUILT FOR THE CLIMB — © {new Date().getFullYear()}</MonoTag>
          <Link href="/dashboard" className="hover:underline">
            Open the app →
          </Link>
        </div>
      </footer>
    </div>
  );
}
