/**
 * MAKER Framework - Improved Voting Algorithm
 *
 * Addresses battle test findings:
 * 1. Success threshold (prevent "consensus on failure")
 * 2. Dynamic K parameter (adjust based on attempts)
 * 3. Early stopping (if all 3 succeed with high confidence)
 * 4. Confidence weighting (better than pure vote counting)
 *
 * Expected improvements:
 * - Consensus rate: 75% → 85-90%
 * - Escalation rate: 30% → 10-15%
 * - Cost savings: 86.5% → 90-92%
 */

import crypto from 'crypto';

// ============================================================================
// Core Interfaces
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
}

interface VotingResult {
  winner: AgentResult | null;
  consensus_reached: boolean;
  votes: Map<string, number>;
  total_attempts: number;
  winning_hash: string | null;
  escalation_needed: boolean;
  escalation_reason?: string;
  early_stop?: boolean;
  confidence_weighted?: boolean;
}

// ============================================================================
// Improvement 1: Success Threshold
// ============================================================================

/**
 * Prevent "consensus on failure" - require majority of attempts to succeed
 */
function hasSuccessThreshold(results: AgentResult[]): boolean {
  const successCount = results.filter((r) => r.success).length;
  const successRate = successCount / results.length;
  return successRate >= 0.5; // At least 50% must succeed
}

// ============================================================================
// Improvement 2: Dynamic K Parameter
// ============================================================================

/**
 * Adjust K based on number of attempts and task complexity
 */
function getDynamicK(attempts: number, avgConfidence: number): number {
  if (attempts === 3) {
    // For 3 attempts: use majority rule (2/3) if high confidence
    return avgConfidence >= 0.85 ? 1 : 2;
  }

  if (attempts === 5) {
    // For 5 attempts: require 2 ahead to avoid ties
    return 2;
  }

  // Default: K=2
  return 2;
}

// ============================================================================
// Improvement 3: Early Stopping
// ============================================================================

/**
 * Stop early if all attempts succeed with high confidence
 */
function shouldStopEarly(results: AgentResult[]): boolean {
  if (results.length !== 3) return false; // Only after initial 3 attempts

  const allSuccessful = results.every((r) => r.success);
  if (!allSuccessful) return false;

  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / 3;
  if (avgConfidence < 0.90) return false; // Require high confidence

  return true;
}

/**
 * Select best result for early stopping
 */
function selectBestResult(results: AgentResult[]): AgentResult {
  // Sort by confidence, return highest
  return results.sort((a, b) => b.confidence - a.confidence)[0];
}

// ============================================================================
// Improvement 4: Confidence-Weighted Voting
// ============================================================================

/**
 * Weight votes by confidence instead of pure count
 */
function confidenceWeightedVoting(
  results: AgentResult[],
  K: number
): VotingResult | null {
  const votes = new Map<string, AgentResult[]>();
  const weightedVotes = new Map<string, number>();

  // Group by hash and sum confidence scores
  for (const result of results) {
    const hash = hashResult(result);

    if (!votes.has(hash)) {
      votes.set(hash, []);
      weightedVotes.set(hash, 0);
    }

    votes.get(hash)!.push(result);
    weightedVotes.set(hash, weightedVotes.get(hash)! + result.confidence);
  }

  // Sort by weighted votes
  const sorted = Array.from(weightedVotes.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  if (sorted.length === 0) return null;

  const topScore = sorted[0][1];
  const secondScore = sorted[1]?.[1] || 0;

  // Use lower threshold for confidence-weighted (1.0 instead of 2.0)
  const K_weighted = K === 2 ? 1.0 : 0.5;

  if (topScore - secondScore >= K_weighted) {
    const winningHash = sorted[0][0];
    const winner = votes.get(winningHash)![0];

    // Get vote counts for reporting
    const voteCounts = new Map<string, number>();
    for (const [hash, results] of votes.entries()) {
      voteCounts.set(hash, results.length);
    }

    return {
      winner,
      consensus_reached: true,
      votes: voteCounts,
      total_attempts: results.length,
      winning_hash: winningHash,
      escalation_needed: false,
      confidence_weighted: true,
    };
  }

  return null; // No consensus
}

// ============================================================================
// Main Improved Voting Function
// ============================================================================

/**
 * Improved first-to-ahead-by-K with all enhancements
 */
export function improvedVoting(
  results: AgentResult[],
  baseK: number = 2
): VotingResult {
  // Check 1: Success threshold (prevent consensus on failure)
  if (!hasSuccessThreshold(results)) {
    return {
      winner: null,
      consensus_reached: false,
      votes: new Map(),
      total_attempts: results.length,
      winning_hash: null,
      escalation_needed: true,
      escalation_reason: 'Majority of attempts failed - likely systematic error',
    };
  }

  // Check 2: Early stopping (all 3 succeed with high confidence)
  if (shouldStopEarly(results)) {
    const best = selectBestResult(results);

    return {
      winner: best,
      consensus_reached: true,
      votes: new Map([['early-stop', results.length]]),
      total_attempts: results.length,
      winning_hash: 'early-stop',
      escalation_needed: false,
      early_stop: true,
    };
  }

  // Check 3: Dynamic K parameter
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const dynamicK = getDynamicK(results.length, avgConfidence);

  // Check 4: Try confidence-weighted voting first
  const confidenceResult = confidenceWeightedVoting(results, dynamicK);
  if (confidenceResult) {
    return confidenceResult;
  }

  // Fallback: Standard voting with dynamic K
  return standardVoting(results, dynamicK);
}

/**
 * Standard voting (from original implementation)
 */
function standardVoting(results: AgentResult[], K: number): VotingResult {
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
    const winningHash = Array.from(voteCounts.entries()).find(
      ([_, count]) => count === maxVotes
    )![0];

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

  // No consensus
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
      ? 'Red flags detected'
      : allFailed
        ? 'All attempts failed'
        : 'No consensus after maximum attempts',
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function hashResult(result: AgentResult): string {
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

function normalizeApproach(approach: string): string {
  return approach
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;!?]/g, '')
    .trim();
}

// ============================================================================
// Comparison Test
// ============================================================================

/**
 * Run comparison test: original vs improved voting
 */
async function comparisonTest() {
  console.log('='.repeat(80));
  console.log('VOTING ALGORITHM COMPARISON TEST');
  console.log('='.repeat(80));
  console.log('\nComparing original vs improved voting on battle test scenarios\n');

  // Import original voting from voting-system.ts
  const { firstToAheadByK } = await import('./voting-system');

  // Test scenarios
  const scenarios = [
    {
      name: 'All 3 succeed, high confidence (should early stop)',
      results: [
        createMockResult(true, 0.95, 'approach-A', 42),
        createMockResult(true, 0.93, 'approach-A', 44),
        createMockResult(true, 0.92, 'approach-A', 40),
      ],
    },
    {
      name: 'All 3 succeed, low confidence (should vote)',
      results: [
        createMockResult(true, 0.75, 'approach-A', 42),
        createMockResult(true, 0.72, 'approach-A', 44),
        createMockResult(true, 0.70, 'approach-B', 50),
      ],
    },
    {
      name: 'All 3 fail (should escalate, not consensus)',
      results: [
        createMockResult(false, 0.40, 'failed', 0),
        createMockResult(false, 0.38, 'failed', 0),
        createMockResult(false, 0.42, 'failed', 0),
      ],
    },
    {
      name: '2/3 succeed, similar approaches (should win)',
      results: [
        createMockResult(true, 0.88, 'approach-A', 42),
        createMockResult(true, 0.85, 'approach-A', 45),
        createMockResult(false, 0.50, 'failed', 0),
      ],
    },
  ];

  for (const scenario of scenarios) {
    console.log(`\nScenario: ${scenario.name}`);
    console.log('-'.repeat(80));

    // Original voting
    const original = firstToAheadByK(scenario.results, 2);
    console.log(`Original: ${original.consensus_reached ? '✅ Consensus' : '❌ No consensus'}`);
    if (original.consensus_reached) {
      console.log(`  Winner confidence: ${original.winner?.confidence.toFixed(2)}`);
    }

    // Improved voting
    const improved = improvedVoting(scenario.results, 2);
    console.log(`Improved: ${improved.consensus_reached ? '✅ Consensus' : '❌ No consensus'}`);
    if (improved.consensus_reached) {
      console.log(`  Winner confidence: ${improved.winner?.confidence.toFixed(2)}`);
      if (improved.early_stop) console.log('  (Early stop triggered)');
      if (improved.confidence_weighted) console.log('  (Confidence weighted)');
    }
  }

  console.log('\n' + '='.repeat(80));
}

function createMockResult(
  success: boolean,
  confidence: number,
  approach: string,
  lines: number
): AgentResult {
  return {
    success,
    task_id: 'test',
    approach,
    changes: {
      files_modified: success ? ['file.ts'] : [],
      lines_changed: lines,
      additions: Math.floor(lines * 0.7),
      deletions: Math.floor(lines * 0.3),
    },
    verification: {
      command: 'test',
      exit_code: success ? 0 : 1,
      output: success ? 'passed' : 'failed',
    },
    confidence,
    red_flags: [],
  };
}

// Run comparison test if executed directly
if (require.main === module) {
  comparisonTest().catch(console.error);
}
