import "server-only";

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_FAILURES = 5;

type Bucket = { failures: number; resetAt: number };

const store = new Map<string, Bucket>();

function getBucket(key: string): Bucket {
  const now = Date.now();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { failures: 0, resetAt: now + WINDOW_MS };
    store.set(key, bucket);
    return bucket;
  }
  return existing;
}

export function checkRateLimit(ip: string): { allowed: boolean; minutesUntilReset: number } {
  const bucket = getBucket(ip);
  if (bucket.failures >= MAX_FAILURES) {
    const minutesUntilReset = Math.ceil((bucket.resetAt - Date.now()) / 60_000);
    return { allowed: false, minutesUntilReset };
  }
  return { allowed: true, minutesUntilReset: 0 };
}

export function recordFailure(ip: string): void {
  const bucket = getBucket(ip);
  bucket.failures += 1;
}

export function clearFailures(ip: string): void {
  store.delete(ip);
}
