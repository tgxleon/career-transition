// Lightweight per-IP rate limiter for the AI endpoint. In-memory, so on
// serverless it's per-instance — not airtight, but it stops casual abuse of
// the shared API key. Tune via env: AI_RATE_LIMIT (requests) and
// AI_RATE_WINDOW_MINUTES (window). For hard guarantees later, swap for a
// shared store (Upstash Redis / Vercel KV) behind this same function.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const LIMIT = Number(process.env.AI_RATE_LIMIT ?? 15);
const WINDOW_MS =
  Number(process.env.AI_RATE_WINDOW_MINUTES ?? 60) * 60 * 1000;

export function checkRateLimit(ip: string): {
  ok: boolean;
  retryAfterMinutes?: number;
} {
  const now = Date.now();

  // Opportunistic cleanup so the map doesn't grow unbounded
  if (buckets.size > 5000) {
    for (const [key, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(key);
    }
  }

  const bucket = buckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true };
  }
  if (bucket.count >= LIMIT) {
    return {
      ok: false,
      retryAfterMinutes: Math.ceil((bucket.resetAt - now) / 60_000),
    };
  }
  bucket.count += 1;
  return { ok: true };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
