interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Default config: max 5 tokens, refill 1 token every 10 seconds (10000ms)
const CAPACITY = 5;
const REFILL_RATE = 1;
const REFILL_INTERVAL = 10000;

export function rateLimit(
  key: string,
  capacity = CAPACITY,
  refillRate = REFILL_RATE,
  refillInterval = REFILL_INTERVAL
): boolean {
  const now = Date.now();

  // Periodic cleanup of inactive buckets to prevent memory leaks
  if (buckets.size > 1000) {
    const pruneThreshold = 60 * 60 * 1000; // 1 hour inactive
    for (const [k, b] of buckets.entries()) {
      if (now - b.lastRefill > pruneThreshold) {
        buckets.delete(k);
      }
    }
  }

  let bucket = buckets.get(key);

  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Calculate elapsed time and how many tokens to refill
  const elapsed = now - bucket.lastRefill;
  if (elapsed >= refillInterval) {
    const tokensToAdd = Math.floor(elapsed / refillInterval) * refillRate;
    if (tokensToAdd > 0) {
      bucket.tokens = Math.min(capacity, bucket.tokens + tokensToAdd);
      // Keep fractional elapsed time for next precision refill
      bucket.lastRefill = now - (elapsed % refillInterval);
    }
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true; // request allowed
  }

  return false; // rate limited
}

export function resetRateLimits(): void {
  buckets.clear();
}
