/**
 * Race Condition Testing Utilities
 *
 * **Purpose:** Shared helpers for concurrency testing across all race condition test suites
 * **Last Updated:** 2025-11-09
 * **Status:** Active
 * **Related:** `__tests__/edge-cases/race-conditions/`
 *
 * ## Exports
 *
 * ### `delay(ms?: number): Promise<void>`
 * Simulate a network delay (DB query, API call, etc.)
 *
 * **Usage:**
 * ```typescript
 * await delay(100); // 100ms delay
 * await delay();    // 10ms default
 * ```
 *
 * ### `deterministicDelay(counter: number, baseMs?: number): number`
 * Generate deterministic delays for reproducible tests
 *
 * **Usage:**
 * ```typescript
 * let counter = 0;
 * const delayMs = deterministicDelay(counter++); // Returns 0
 * const delayMs = deterministicDelay(counter++); // Returns 4
 * const delayMs = deterministicDelay(counter++); // Returns 8
 * ```
 *
 * ### `createDeterministicEmbedding(dimension?: number): number[]`
 * Create a deterministic embedding without hitting OpenAI API
 *
 * **Usage:**
 * ```typescript
 * const embedding = createDeterministicEmbedding();     // 1536-dim
 * const embedding = createDeterministicEmbedding(768);  // 768-dim
 * ```
 *
 * ### `countByStatus<T>(results: T[]): Record<string, number>`
 * Count results by status field (utility for analyzing test results)
 *
 * **Usage:**
 * ```typescript
 * const results = [
 *   { status: 'completed', domain: 'a.com' },
 *   { status: 'completed', domain: 'b.com' },
 *   { status: 'skipped', domain: 'c.com' }
 * ];
 * const counts = countByStatus(results);
 * // { completed: 2, skipped: 1 }
 * ```
 */
