/**
 * MAKER Framework - Voting Utilities
 *
 * @purpose Shared voting algorithm helpers and utilities
 *
 * @flow
 *   1. Import helper functions
 *   2. → Use for result hashing and comparison
 *   3. → Return normalized data for voting
 *
 * @keyFunctions
 *   - hashResult (line 47): Hash result for consensus detection
 *   - normalizeApproach (line 66): Normalize approach descriptions
 *   - getDynamicK (line 79): Calculate dynamic K parameter
 *
 * @handles
 *   - Result hashing with bucketing
 *   - Approach normalization
 *   - Dynamic K parameter calculation
 *
 * @returns Utility functions for voting
 *
 * @dependencies
 *   - crypto (Node.js built-in)
 *   - ./types.ts (AgentResult, TaskComplexity)
 *
 * @consumers
 *   - scripts/maker/voting-v2-complete.ts
 *   - scripts/maker/voting-system.ts
 *
 * @totalLines 88
 * @estimatedTokens 320 (without header), 420 (with header - 24% savings)
 */

import crypto from 'crypto';
import { AgentResult, TaskComplexity } from './types';

/**
 * Hash result for consensus detection
 * Uses "buckets" to allow minor variation (±20% line count)
 */
export function hashResult(result: AgentResult): string {
  // Bucket line counts to allow ±20% variation
  const lineBucket = Math.floor(result.changes.lines_changed / 20) * 20;

  const meaningful = {
    files: result.changes.files_modified.sort(),
    lineBucket,
    verification: result.verification.exit_code,
    approach: normalizeApproach(result.approach),
  };

  const json = JSON.stringify(meaningful);
  return crypto.createHash('sha256').update(json).digest('hex').slice(0, 8);
}

/**
 * Normalize approach description to allow minor wording differences
 */
export function normalizeApproach(approach: string): string {
  return approach
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dynamic K parameter based on task complexity
 * Simple tasks: K=1 (fast)
 * Medium tasks: K=2 (balanced - paper's recommendation)
 * Complex tasks: K=3 (conservative)
 */
export function getDynamicK(taskComplexity: TaskComplexity, avgConfidence: number): number {
  if (taskComplexity === 'simple') {
    return avgConfidence >= 0.90 ? 1 : 2;
  }
  if (taskComplexity === 'medium') {
    return avgConfidence >= 0.85 ? 2 : 3;
  }
  // Complex tasks
  return 3;
}
