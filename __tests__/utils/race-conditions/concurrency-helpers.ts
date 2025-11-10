/**
 * Concurrency Testing Helpers
 *
 * **Purpose:** Shared utilities for race condition testing across all test modules
 * **Last Updated:** 2025-11-09
 * **Status:** Active
 */

/**
 * Simulate a network delay (DB query, API call, etc.)
 */
export const delay = (ms: number = 10): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Deterministic delay generator for tests
 * Avoids Math.random() to make tests reproducible
 */
export const deterministicDelay = (counter: number, baseMs: number = 4): number => {
  return (counter % 5) * baseMs;
};

/**
 * Create a deterministic embedding (1536-dimensional vector)
 * Used for testing embedding generation without hitting OpenAI API
 */
export const createDeterministicEmbedding = (dimension: number = 1536): number[] => {
  return Array(dimension)
    .fill(0)
    .map((_, i) => (i % 256) / 256);
};

/**
 * Count results by status
 */
export const countByStatus = <T extends { status: string }>(results: T[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  results.forEach((r) => {
    counts[r.status] = (counts[r.status] || 0) + 1;
  });
  return counts;
};
