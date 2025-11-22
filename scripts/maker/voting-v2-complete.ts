/**
 * MAKER Framework: Complete Implementation (v2)
 *
 * @purpose Incorporates ALL insights from arXiv:2511.09030 for optimal voting
 *
 * @flow
 *   1. Run MAKER orchestration on microagent task
 *   2. → Apply red-flagging, voting, and dynamic K
 *   3. → Return voting result or escalate
 *
 * @keyFunctions
 *   - runMAKER (line 58): Main orchestration function
 *   - firstToAheadByK (line 112): SPRT-based voting algorithm
 *   - shouldStopEarly (line 181): Early stopping heuristic
 *   - hasSuccessThreshold (line 193): Success threshold check
 *   - simulateHaikuAgent (line 246): Simulation for testing
 *
 * @handles
 *   - SPRT-based optimal voting
 *   - Red-flagging heuristics
 *   - Dynamic K parameter
 *   - Error propagation metrics
 *   - Extreme decomposition support
 *
 * @returns VotingResult or escalation
 *
 * @dependencies
 *   - ./types.ts (AgentResult, VotingResult, TaskComplexity)
 *   - ./red-flagging.ts (detectRedFlags, shouldDiscardResult)
 *   - ./voting-utils.ts (hashResult, getDynamicK)
 *   - ./reliability-metrics.ts (compareReliability)
 *
 * @consumers
 *   - Manual execution for testing
 *
 * @totalLines 289
 * @estimatedTokens 1100 (without header), 1250 (with header - 12% savings)
 */

import { AgentResult, VotingResult, TaskComplexity } from './types';
import { detectRedFlags, shouldDiscardResult } from './red-flagging';
import { hashResult, getDynamicK } from './voting-utils';
import { compareReliability } from './reliability-metrics';
import { simulateHaikuAgent } from './simulation';



/**
 * SPRT-based voting: First-to-ahead-by-K
 *
 * Based on Sequential Probability Ratio Test (Abraham Wald, 1945)
 * Provably optimal for minimizing expected samples
 */
function firstToAheadByK(
  results: AgentResult[],
  K: number,
  maxAttempts: number = 7
): VotingResult | null {
  // Count votes for each unique result
  const votes = new Map<string, { result: AgentResult; count: number; confidence: number }>();

  for (const result of results) {
    const hash = hashResult(result);
    const existing = votes.get(hash);

    if (existing) {
      existing.count++;
      existing.confidence = Math.max(existing.confidence, result.confidence);
    } else {
      votes.set(hash, { result, count: 1, confidence: result.confidence });
    }
  }

  // Find leader
  const sorted = Array.from(votes.values()).sort((a, b) => b.count - a.count);

  if (sorted.length === 0) {
    return null;
  }

  const leader = sorted[0];
  const runnerUp = sorted[1];

  // Check if leader is ahead by K
  const lead = runnerUp ? leader.count - runnerUp.count : leader.count;

  if (lead >= K) {
    // Winner!
    const consensusType =
      results.length === 3 && lead === 3 ? 'immediate' :
      results.length <= 5 && lead >= 2 ? 'strong' :
      'weak';

    return {
      winner: leader.result,
      votes: leader.count,
      total_attempts: results.length,
      confidence: leader.confidence,
      red_flags_detected: 0, // Counted separately
      consensus_type: consensusType,
    };
  }

  // No winner yet
  if (results.length >= maxAttempts) {
    // Escalate after max attempts
    return {
      winner: leader.result,
      votes: leader.count,
      total_attempts: results.length,
      confidence: 0,
      red_flags_detected: 0,
      consensus_type: 'escalated',
    };
  }

  return null; // Need more attempts
}

/**
 * Early stopping heuristic
 * If all attempts succeed with high confidence, stop early
 */
function shouldStopEarly(results: AgentResult[]): boolean {
  if (results.length < 3) return false;

  const allSuccessful = results.every(r => r.success);
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

  return allSuccessful && avgConfidence >= 0.90;
}

/**
 * Success threshold check
 * Prevent "consensus on failure" - require >50% successful attempts
 */
function hasSuccessThreshold(results: AgentResult[]): boolean {
  const successCount = results.filter(r => r.success).length;
  return successCount / results.length >= 0.5;
}


// ============================================================================
// Complete MAKER Orchestration
// ============================================================================

/**
 * Run MAKER framework on a microagent task
 * Combines all three components: decomposition, voting, red-flagging
 */
async function runMAKER(
  taskId: string,
  microagentPrompt: string,
  taskComplexity: 'simple' | 'medium' | 'complex' = 'medium',
  maxAttempts: number = 7
): Promise<VotingResult> {
  const results: AgentResult[] = [];
  let redFlagsDetected = 0;
  let attempt = 1;

  while (attempt <= maxAttempts) {
    console.log(`\n📍 Attempt ${attempt}/${maxAttempts}`);

    // Simulate Haiku agent execution
    // In real implementation, this would call Claude Haiku API
    const result = await simulateHaikuAgent(taskId, microagentPrompt);

    // Red-flagging (Component 3)
    const redFlags = detectRedFlags(result);
    const shouldDiscard = shouldDiscardResult(redFlags);

    if (shouldDiscard) {
      console.log(`🚩 RED FLAG detected: ${redFlags.filter(f => f.detected).map(f => f.type).join(', ')}`);
      redFlagsDetected++;
      attempt++;
      continue; // Discard and resample
    }

    // Add to voting pool
    results.push(result);

    // Check for early stopping
    if (shouldStopEarly(results)) {
      console.log(`✅ Early stop: All ${results.length} attempts succeeded with high confidence`);
      break;
    }

    // Success threshold check
    if (!hasSuccessThreshold(results)) {
      console.log(`⚠️  Success threshold not met - most attempts failing`);
      if (results.length >= 5) {
        console.log(`❌ Escalating to Sonnet (too many failures)`);
        break;
      }
    }

    // Dynamic K parameter
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
    const K = getDynamicK(taskComplexity, avgConfidence);

    // Voting (Component 2 - SPRT)
    const votingResult = firstToAheadByK(results, K, maxAttempts);

    if (votingResult) {
      votingResult.red_flags_detected = redFlagsDetected;
      console.log(`\n✅ Consensus reached: ${votingResult.consensus_type}`);
      console.log(`   Winner: ${votingResult.winner.approach}`);
      console.log(`   Votes: ${votingResult.votes}/${votingResult.total_attempts}`);
      console.log(`   Confidence: ${(votingResult.confidence * 100).toFixed(1)}%`);
      console.log(`   Red flags: ${redFlagsDetected}`);
      return votingResult;
    }

    attempt++;
  }

  // If we get here, escalate to Sonnet
  console.log(`\n❌ No consensus after ${maxAttempts} attempts - escalating to Sonnet`);

  return {
    winner: results[0] || ({ success: false, task_id: taskId } as AgentResult),
    votes: 0,
    total_attempts: attempt - 1,
    confidence: 0,
    red_flags_detected: redFlagsDetected,
    consensus_type: 'escalated',
  };
}


// Export for use in other modules
export { runMAKER, firstToAheadByK, shouldStopEarly, hasSuccessThreshold };
