import { expect, test, beforeEach } from 'vitest';
import { rateLimit, resetRateLimits } from '@/lib/rateLimit';

beforeEach(() => {
  resetRateLimits();
});

test('Token Bucket rate limits requests correctly', () => {
  const key = 'test-user';
  
  // Capacity is 5 by default, so first 5 calls should succeed
  for (let i = 0; i < 5; i++) {
    expect(rateLimit(key)).toBe(true);
  }
  
  // 6th call should be rate limited
  expect(rateLimit(key)).toBe(false);
});

test('Token Bucket refills over time', async () => {
  const key = 'refill-user';
  
  // Set capacity = 2, refill 1 token every 100ms
  expect(rateLimit(key, 2, 1, 100)).toBe(true);
  expect(rateLimit(key, 2, 1, 100)).toBe(true);
  expect(rateLimit(key, 2, 1, 100)).toBe(false); // exhausted
  
  // Wait 120ms to allow 1 token refill
  await new Promise((resolve) => setTimeout(resolve, 120));
  
  expect(rateLimit(key, 2, 1, 100)).toBe(true); // refilled 1 token
  expect(rateLimit(key, 2, 1, 100)).toBe(false); // exhausted again
});
