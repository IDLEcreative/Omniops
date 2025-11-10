/**
 * Race Condition Edge Case Test Modules
 *
 * **Purpose:** Focused test suites for concurrent access patterns, database transactions, and shared state issues
 * **Last Updated:** 2025-11-09
 * **Status:** Active
 * **Related:** `__tests__/utils/race-conditions/concurrency-helpers.ts`
 *
 * ## Overview
 *
 * This directory contains modular test suites for detecting and validating race condition handling:
 *
 * | Module | Tests | Focus |
 * |--------|-------|-------|
 * | `concurrent-data-updates.test.ts` | 3 | Lost updates, optimistic locking, read-modify-write |
 * | `database-transaction-conflicts.test.ts` | 2 | Deadlock detection, lock ordering |
 * | `cache-invalidation-races.test.ts` | 2 | Cache stampede, single-flight pattern |
 * | `concurrent-scraping.test.ts` | 2 | Duplicate prevention, parallel scraping |
 * | `message-creation-races.test.ts` | 1 | Concurrent message creation |
 * | `embedding-generation-races.test.ts` | 1 | Duplicate embedding prevention |
 * | `real-world-application.test.ts` | 2 | Production-like scenarios |
 *
 * **Total Tests:** 13
 *
 * ## Key Patterns Tested
 *
 * ### 1. Optimistic Locking
 * Prevents lost updates using version numbers instead of database locks.
 *
 * ### 2. Lock Ordering
 * Acquires locks in consistent order to prevent deadlocks.
 *
 * ### 3. Single-Flight Pattern
 * Coordinates concurrent requests for same resource (cache stampede prevention).
 *
 * ### 4. Duplicate Prevention
 * Uses sets/maps to track in-flight operations and prevent duplicates.
 *
 * ## Usage
 *
 * Run all race condition tests:
 * ```bash
 * npm test -- __tests__/edge-cases/race-conditions/
 * ```
 *
 * Run specific test suite:
 * ```bash
 * npm test -- concurrent-data-updates.test.ts
 * ```
 *
 * Run with verbose output:
 * ```bash
 * npm test -- __tests__/edge-cases/race-conditions/ --verbose
 * ```
 *
 * ## Helper Utilities
 *
 * Located in `__tests__/utils/race-conditions/concurrency-helpers.ts`:
 *
 * - `delay(ms)` - Simulate network delays
 * - `deterministicDelay(counter)` - Deterministic delays for test reproducibility
 * - `createDeterministicEmbedding()` - Generate test embeddings
 * - `countByStatus()` - Count results by status field
 *
 * ## Important Notes
 *
 * - All delays use deterministic values to ensure test reproducibility
 * - Tests simulate race conditions but don't guarantee they'll occur
 * - Some tests expect race conditions to happen (e.g., cache stampede)
 * - Real-world scenarios may require actual database-level locking
 */
