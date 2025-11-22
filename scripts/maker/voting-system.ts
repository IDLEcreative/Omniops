/**
 * MAKER Framework - Voting System Implementation
 *
 * Implements the first-to-ahead-by-K voting algorithm from arXiv:2511.09030
 * "Solving a Million-Step LLM Task with Zero Errors"
 *
 * Usage:
 *   npx tsx scripts/maker/voting-system.ts
 */

import { AgentResult, VotingResult } from './types';
import { hashResult, normalizeApproach } from './voting-utils';

/**
 * First-to-ahead-by-K voting algorithm
 *
 * Returns the first result to get K votes ahead of the second-place result.
 * This is optimal for sequential probability ratio tests (SPRT).
 */
export function firstToAheadByK(results: AgentResult[], K: number = 2): VotingResult {
  const votes = new Map<string, AgentResult[]>();

  for (const result of results) {
    const hash = hashResult(result);
    if (!votes.has(hash)) {
      votes.set(hash, []);
    }
    votes.get(hash)!.push(result);
  }

  const voteCounts = new Map<string, number>();
  for (const [hash, results] of votes.entries()) {
    voteCounts.set(hash, results.length);
  }

  const sortedCounts = Array.from(voteCounts.values()).sort((a, b) => b - a);
  const maxVotes = sortedCounts[0] || 0;
  const secondMaxVotes = sortedCounts[1] || 0;
  const isConsensus = maxVotes - secondMaxVotes >= K;

  if (isConsensus) {
    const winningHash = Array.from(voteCounts.entries()).find(([_, count]) => count === maxVotes)![0];
    const winner = votes.get(winningHash)![0];

    return {
      winner,
      consensus_reached: true,
      votes: voteCounts,
      total_attempts: results.length,
      winning_hash: winningHash,
      escalation_needed: false,
    };
  }

  const hasRedFlags = results.some((r) => r.red_flags && r.red_flags.length > 0);
  const allFailed = results.every((r) => !r.success);

  return {
    winner: null,
    consensus_reached: false,
    votes: voteCounts,
    total_attempts: results.length,
    winning_hash: null,
    escalation_needed: hasRedFlags || allFailed,
    escalation_reason: hasRedFlags
      ? 'Red flags detected in agent results'
      : allFailed
        ? 'All attempts failed'
        : 'No consensus after maximum attempts',
  };
}

/**
 * Detect correlated errors and systematic failures
 */
export function detectRedFlags(results: AgentResult[]): { has_red_flags: boolean; flags: string[] } {
  const flags: string[] = [];

  if (results.length >= 7) {
    const voting = firstToAheadByK(results, 2);
    if (!voting.consensus_reached) {
      flags.push('NO_CONSENSUS_AFTER_7_ATTEMPTS: Task may be too complex for Haiku');
    }
  }

  const errorPatterns = results.filter((r) => !r.success).map((r) => r.verification.output);
  if (errorPatterns.length === results.length && errorPatterns.length > 0) {
    const uniqueErrors = new Set(errorPatterns);
    if (uniqueErrors.size === 1) {
      flags.push('CORRELATED_FAILURE: All agents failing with same error (systematic issue)');
    }
  }

  const approaches = results.map((r) => normalizeApproach(r.approach));
  const uniqueApproaches = new Set(approaches);
  if (uniqueApproaches.size === results.length && results.length >= 3) {
    flags.push('NO_APPROACH_CONSENSUS: Each agent using different approach (ambiguous task)');
  }

  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  if (avgConfidence < 0.6) {
    flags.push(`LOW_CONFIDENCE: Average confidence ${avgConfidence.toFixed(2)} < 0.6`);
  }

  const explicitFlags = results.flatMap((r) => r.red_flags || []);
  if (explicitFlags.length > 0) {
    flags.push(`EXPLICIT_RED_FLAGS: ${explicitFlags.join(', ')}`);
  }

  return { has_red_flags: flags.length > 0, flags };
}

/**
 * Adaptive voting that starts with 3 attempts and adds more if needed
 */
export async function adaptiveVoting(
  taskRunner: (attemptId: string) => Promise<AgentResult>,
  options: {
    initialAttempts?: number;
    maxAttempts?: number;
    K?: number;
    escalateOnRedFlags?: boolean;
  } = {}
): Promise<VotingResult> {
  const {
    initialAttempts = 3,
    maxAttempts = 7,
    K = 2,
    escalateOnRedFlags = true,
  } = options;

  const results: AgentResult[] = [];

  console.log(`🔄 Running ${initialAttempts} initial Haiku attempts...`);
  for (let i = 1; i <= initialAttempts; i++) {
    const result = await taskRunner(`attempt-${i}`);
    results.push(result);
    console.log(`  ✓ Attempt ${i}: ${result.success ? '✅ Success' : '❌ Failed'} (confidence: ${result.confidence.toFixed(2)})`);
  }

  let voting = firstToAheadByK(results, K);
  if (voting.consensus_reached) {
    console.log(`✅ Consensus reached after ${results.length} attempts (hash: ${voting.winning_hash})`);
    return voting;
  }

  const redFlags = detectRedFlags(results);
  if (escalateOnRedFlags && redFlags.has_red_flags) {
    console.log(`🚩 Red flags detected after ${results.length} attempts:`);
    redFlags.flags.forEach((flag) => console.log(`  - ${flag}`));
    return { ...voting, escalation_needed: true, escalation_reason: redFlags.flags.join('; ') };
  }

  const additionalAttempts = Math.min(maxAttempts - initialAttempts, maxAttempts - results.length);
  if (additionalAttempts > 0) {
    console.log(`🔄 No consensus yet, running ${additionalAttempts} more attempts...`);
    for (let i = initialAttempts + 1; i <= initialAttempts + additionalAttempts; i++) {
      const result = await taskRunner(`attempt-${i}`);
      results.push(result);
      console.log(`  ✓ Attempt ${i}: ${result.success ? '✅ Success' : '❌ Failed'} (confidence: ${result.confidence.toFixed(2)})`);

      voting = firstToAheadByK(results, K);
      if (voting.consensus_reached) {
        console.log(`✅ Consensus reached after ${results.length} attempts (hash: ${voting.winning_hash})`);
        return voting;
      }
    }
  }

  const finalRedFlags = detectRedFlags(results);
  console.log(`❌ No consensus after ${results.length} attempts. Escalation recommended.`);
  if (finalRedFlags.has_red_flags) {
    console.log(`🚩 Final red flags:`);
    finalRedFlags.flags.forEach((flag) => console.log(`  - ${flag}`));
  }

  return {
    ...voting,
    escalation_needed: true,
    escalation_reason: finalRedFlags.flags.join('; ') || 'No consensus after maximum attempts',
  };
}

if (require.main === module) {
  console.log('Use voting-demo.ts for demonstration');
  console.log('Run: npx tsx scripts/maker/voting-demo.ts');
}
