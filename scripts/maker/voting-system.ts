/**
 * MAKER Framework - Voting System Implementation
 *
 * Implements the first-to-ahead-by-K voting algorithm from arXiv:2511.09030
 * "Solving a Million-Step LLM Task with Zero Errors"
 *
 * Usage:
 *   npx tsx scripts/maker/voting-system.ts
 */

import crypto from 'crypto';

// ============================================================================
// Type Definitions
// ============================================================================

interface AgentResult {
  success: boolean;
  task_id: string;
  approach: string;
  changes: {
    files_modified: string[];
    lines_changed: number;
    additions: number;
    deletions: number;
  };
  verification: {
    command: string;
    exit_code: number;
    output: string;
  };
  confidence: number;
  red_flags: string[];
  agent_id?: string;
  timestamp?: number;
}

interface VotingResult {
  winner: AgentResult | null;
  consensus_reached: boolean;
  votes: Map<string, number>;
  total_attempts: number;
  winning_hash: string | null;
  escalation_needed: boolean;
  escalation_reason?: string;
}

// ============================================================================
// Core Voting Algorithm
// ============================================================================

/**
 * First-to-ahead-by-K voting algorithm
 *
 * Returns the first result to get K votes ahead of the second-place result.
 * This is optimal for sequential probability ratio tests (SPRT).
 *
 * @param results - Array of agent results to vote on
 * @param K - Lead required to declare winner (typically 2-4)
 * @returns Winning result or null if no consensus
 */
export function firstToAheadByK(
  results: AgentResult[],
  K: number = 2
): VotingResult {
  const votes = new Map<string, AgentResult[]>();

  // Hash each result and group by hash
  for (const result of results) {
    const hash = hashResult(result);

    if (!votes.has(hash)) {
      votes.set(hash, []);
    }
    votes.get(hash)!.push(result);
  }

  // Count votes for each unique result
  const voteCounts = new Map<string, number>();
  for (const [hash, results] of votes.entries()) {
    voteCounts.set(hash, results.length);
  }

  // Sort by vote count (descending)
  const sortedCounts = Array.from(voteCounts.values()).sort((a, b) => b - a);
  const maxVotes = sortedCounts[0] || 0;
  const secondMaxVotes = sortedCounts[1] || 0;

  // Check if leader is ahead by K
  const isConsensus = maxVotes - secondMaxVotes >= K;

  if (isConsensus) {
    // Find the winning hash
    const winningHash = Array.from(voteCounts.entries()).find(
      ([_, count]) => count === maxVotes
    )![0];

    // Return the first result with winning hash (they're all equivalent)
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

  // No consensus - check for red flags
  const hasRedFlags = results.some((r) => r.red_flags.length > 0);
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
 * Hash an agent result for comparison
 *
 * We hash the meaningful parts of the result (files, changes, verification)
 * and ignore metadata like timestamps and agent IDs.
 *
 * NOTE: We use "buckets" for line counts to allow minor variations
 * (±20% is considered equivalent) since different agents may make
 * slightly different but equally correct changes.
 */
function hashResult(result: AgentResult): string {
  // Bucket line counts to allow ±20% variation
  // e.g., 42 lines and 50 lines both map to bucket "40-60"
  const lineBucket = Math.floor(result.changes.lines_changed / 20) * 20;

  const meaningful = {
    files: result.changes.files_modified.sort(),
    lineBucket, // Use bucket instead of exact count
    verification: result.verification.exit_code,
    approach: normalizeApproach(result.approach),
  };

  const json = JSON.stringify(meaningful);
  return crypto.createHash('sha256').update(json).digest('hex').slice(0, 8);
}

/**
 * Normalize approach descriptions to catch semantic equivalence
 */
function normalizeApproach(approach: string): string {
  return approach
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;!?]/g, '')
    .trim();
}

// ============================================================================
// Red Flag Detection
// ============================================================================

/**
 * Detect correlated errors and systematic failures
 */
export function detectRedFlags(results: AgentResult[]): {
  has_red_flags: boolean;
  flags: string[];
} {
  const flags: string[] = [];

  // Check 1: No consensus after many attempts
  if (results.length >= 7) {
    const voting = firstToAheadByK(results, 2);
    if (!voting.consensus_reached) {
      flags.push(
        'NO_CONSENSUS_AFTER_7_ATTEMPTS: Task may be too complex for Haiku'
      );
    }
  }

  // Check 2: All agents fail in same way (correlated error)
  const errorPatterns = results
    .filter((r) => !r.success)
    .map((r) => r.verification.output);

  if (errorPatterns.length === results.length && errorPatterns.length > 0) {
    const uniqueErrors = new Set(errorPatterns);
    if (uniqueErrors.size === 1) {
      flags.push(
        'CORRELATED_FAILURE: All agents failing with same error (systematic issue)'
      );
    }
  }

  // Check 3: All agents use different approaches (no agreement)
  const approaches = results.map((r) => normalizeApproach(r.approach));
  const uniqueApproaches = new Set(approaches);

  if (uniqueApproaches.size === results.length && results.length >= 3) {
    flags.push(
      'NO_APPROACH_CONSENSUS: Each agent using different approach (ambiguous task)'
    );
  }

  // Check 4: Low confidence scores across all agents
  const avgConfidence =
    results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  if (avgConfidence < 0.6) {
    flags.push(
      `LOW_CONFIDENCE: Average confidence ${avgConfidence.toFixed(2)} < 0.6`
    );
  }

  // Check 5: Any agent explicitly raised red flags
  const explicitFlags = results.flatMap((r) => r.red_flags);
  if (explicitFlags.length > 0) {
    flags.push(`EXPLICIT_RED_FLAGS: ${explicitFlags.join(', ')}`);
  }

  return {
    has_red_flags: flags.length > 0,
    flags,
  };
}

// ============================================================================
// Adaptive Voting Strategy
// ============================================================================

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

  // Phase 1: Initial attempts
  console.log(`🔄 Running ${initialAttempts} initial Haiku attempts...`);
  for (let i = 1; i <= initialAttempts; i++) {
    const result = await taskRunner(`attempt-${i}`);
    results.push(result);
    console.log(
      `  ✓ Attempt ${i}: ${result.success ? '✅ Success' : '❌ Failed'} (confidence: ${result.confidence.toFixed(2)})`
    );
  }

  // Check for consensus
  let voting = firstToAheadByK(results, K);

  if (voting.consensus_reached) {
    console.log(
      `✅ Consensus reached after ${results.length} attempts (hash: ${voting.winning_hash})`
    );
    return voting;
  }

  // Check for red flags
  const redFlags = detectRedFlags(results);
  if (escalateOnRedFlags && redFlags.has_red_flags) {
    console.log(`🚩 Red flags detected after ${results.length} attempts:`);
    redFlags.flags.forEach((flag) => console.log(`  - ${flag}`));
    return {
      ...voting,
      escalation_needed: true,
      escalation_reason: redFlags.flags.join('; '),
    };
  }

  // Phase 2: Additional attempts (up to maxAttempts)
  const additionalAttempts = Math.min(
    maxAttempts - initialAttempts,
    maxAttempts - results.length
  );

  if (additionalAttempts > 0) {
    console.log(
      `🔄 No consensus yet, running ${additionalAttempts} more attempts...`
    );

    for (
      let i = initialAttempts + 1;
      i <= initialAttempts + additionalAttempts;
      i++
    ) {
      const result = await taskRunner(`attempt-${i}`);
      results.push(result);
      console.log(
        `  ✓ Attempt ${i}: ${result.success ? '✅ Success' : '❌ Failed'} (confidence: ${result.confidence.toFixed(2)})`
      );

      // Check for consensus after each attempt
      voting = firstToAheadByK(results, K);
      if (voting.consensus_reached) {
        console.log(
          `✅ Consensus reached after ${results.length} attempts (hash: ${voting.winning_hash})`
        );
        return voting;
      }
    }
  }

  // Phase 3: Final red flag check
  const finalRedFlags = detectRedFlags(results);
  console.log(
    `❌ No consensus after ${results.length} attempts. Escalation recommended.`
  );

  if (finalRedFlags.has_red_flags) {
    console.log(`🚩 Final red flags:`);
    finalRedFlags.flags.forEach((flag) => console.log(`  - ${flag}`));
  }

  return {
    ...voting,
    escalation_needed: true,
    escalation_reason:
      finalRedFlags.flags.join('; ') || 'No consensus after maximum attempts',
  };
}

// ============================================================================
// Testing & Examples
// ============================================================================

/**
 * Example task runner (simulates Haiku agent)
 */
async function exampleTaskRunner(attemptId: string): Promise<AgentResult> {
  // Simulate processing time
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 1000 + 500)
  );

  // Simulate 85% success rate with random variation
  const success = Math.random() > 0.15;
  const approach = success
    ? 'Extract types to types/analytics.ts, update imports'
    : 'Failed to extract types';

  return {
    success,
    task_id: 'extract-types-analytics',
    approach,
    changes: {
      files_modified: success
        ? ['lib/analytics.ts', 'types/analytics.ts']
        : [],
      lines_changed: success ? 52 : 0,
      additions: success ? 42 : 0,
      deletions: success ? 10 : 0,
    },
    verification: {
      command: 'npx tsc --noEmit',
      exit_code: success ? 0 : 1,
      output: success ? 'No TypeScript errors' : 'Type error on line 42',
    },
    confidence: success ? 0.9 + Math.random() * 0.09 : 0.3 + Math.random() * 0.3,
    red_flags: [],
    agent_id: attemptId,
    timestamp: Date.now(),
  };
}

/**
 * Run demonstration
 */
async function demonstration() {
  console.log('='.repeat(80));
  console.log('MAKER Framework - Voting System Demonstration');
  console.log('='.repeat(80));
  console.log();

  console.log('📋 Task: Extract type definitions from lib/analytics.ts');
  console.log('🤖 Strategy: Adaptive voting with Haiku agents');
  console.log('💰 Cost: 3-7 Haiku attempts vs 1 Opus (90% cheaper)');
  console.log();

  const result = await adaptiveVoting(exampleTaskRunner, {
    initialAttempts: 3,
    maxAttempts: 7,
    K: 2,
    escalateOnRedFlags: true,
  });

  console.log();
  console.log('='.repeat(80));
  console.log('RESULTS');
  console.log('='.repeat(80));

  if (result.consensus_reached && result.winner) {
    console.log('✅ SUCCESS: Consensus reached!');
    console.log();
    console.log('Winning approach:', result.winner.approach);
    console.log('Files modified:', result.winner.changes.files_modified);
    console.log('Lines changed:', result.winner.changes.lines_changed);
    console.log('Verification:', result.winner.verification.command);
    console.log('Exit code:', result.winner.verification.exit_code);
    console.log('Confidence:', result.winner.confidence.toFixed(2));
    console.log();
    console.log('Vote distribution:');
    for (const [hash, count] of result.votes.entries()) {
      const isWinner = hash === result.winning_hash;
      console.log(
        `  ${isWinner ? '👑' : '  '} ${hash}: ${count} vote${count !== 1 ? 's' : ''}`
      );
    }
  } else {
    console.log('❌ ESCALATION NEEDED');
    console.log();
    console.log('Reason:', result.escalation_reason);
    console.log('Total attempts:', result.total_attempts);
    console.log();
    console.log('Vote distribution:');
    for (const [hash, count] of result.votes.entries()) {
      console.log(`  ${hash}: ${count} vote${count !== 1 ? 's' : ''}`);
    }
    console.log();
    console.log('Recommendation: Escalate to Sonnet agent');
  }

  console.log();
  console.log('='.repeat(80));
  console.log('COST ANALYSIS');
  console.log('='.repeat(80));

  const haikuCostPerK = 0.00025;
  const sonnetCostPerK = 0.003;
  const opusCostPerK = 0.015;

  const estimatedTokensPerAttempt = 2000; // 2K tokens per attempt
  const haikuCost =
    (result.total_attempts * estimatedTokensPerAttempt * haikuCostPerK) / 1000;
  const sonnetCost = (estimatedTokensPerAttempt * sonnetCostPerK) / 1000;
  const opusCost = (estimatedTokensPerAttempt * opusCostPerK) / 1000;

  console.log(`Haiku cost (${result.total_attempts} attempts): $${haikuCost.toFixed(4)}`);
  console.log(`Sonnet cost (1 attempt): $${sonnetCost.toFixed(4)}`);
  console.log(`Opus cost (1 attempt): $${opusCost.toFixed(4)}`);
  console.log();

  if (result.consensus_reached) {
    const vsSonnet = ((1 - haikuCost / sonnetCost) * 100).toFixed(0);
    const vsOpus = ((1 - haikuCost / opusCost) * 100).toFixed(0);
    console.log(`💰 Savings vs Sonnet: ${vsSonnet}%`);
    console.log(`💰 Savings vs Opus: ${vsOpus}%`);
  } else {
    console.log('⚠️  Escalation needed - add Sonnet cost:');
    const totalCost = haikuCost + sonnetCost;
    console.log(`Total cost with escalation: $${totalCost.toFixed(4)}`);
    const vsOpus = ((1 - totalCost / opusCost) * 100).toFixed(0);
    console.log(`💰 Still ${vsOpus}% cheaper than Opus!`);
  }

  console.log();
}

// Run if executed directly
if (require.main === module) {
  demonstration().catch(console.error);
}
