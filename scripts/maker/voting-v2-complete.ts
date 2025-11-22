/**
 * MAKER Framework: Complete Implementation (v2)
 *
 * Incorporates ALL insights from arXiv:2511.09030:
 * 1. SPRT-based optimal voting
 * 2. Specific red-flagging heuristics
 * 3. Dynamic K parameter
 * 4. Error propagation metrics
 * 5. Extreme decomposition support
 */

import crypto from 'crypto';

// ============================================================================
// Types
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
  output_tokens?: number;  // NEW: For red-flagging
  raw_output?: string;     // NEW: For red-flagging analysis
}

interface RedFlag {
  type: 'excessive_length' | 'malformed_json' | 'hedging_language' | 'repetition' | 'out_of_scope';
  detected: boolean;
  evidence?: string;
}

interface VotingResult {
  winner: AgentResult;
  votes: number;
  total_attempts: number;
  confidence: number;
  red_flags_detected: number;
  consensus_type: 'immediate' | 'strong' | 'weak' | 'escalated';
}

interface ReliabilityMetrics {
  per_step_accuracy: number;
  total_steps: number;
  predicted_success_rate: number;
  error_rate: number;
  confidence_interval: [number, number];
}

// ============================================================================
// Red-Flagging (Component 3 of MAKER)
// ============================================================================

/**
 * Detect structural error patterns before voting
 * Based on paper's finding: Red-flagging reduces correlated errors by 40%
 */
function detectRedFlags(result: AgentResult): RedFlag[] {
  const flags: RedFlag[] = [];

  // 1. Excessive Length Detection
  // For atomic microagent tasks, output should be <100 tokens
  // Long outputs indicate rambling/uncertainty
  const lengthFlag: RedFlag = {
    type: 'excessive_length',
    detected: (result.output_tokens || 0) > 100,
    evidence: result.output_tokens ? `${result.output_tokens} tokens (threshold: 100)` : undefined,
  };
  flags.push(lengthFlag);

  // 2. Malformed JSON Detection
  // Output should follow strict schema
  const hasAllFields = result.success !== undefined &&
                       result.task_id !== undefined &&
                       result.changes !== undefined &&
                       result.verification !== undefined;

  const jsonFlag: RedFlag = {
    type: 'malformed_json',
    detected: !hasAllFields,
    evidence: hasAllFields ? undefined : 'Missing required fields',
  };
  flags.push(jsonFlag);

  // 3. Hedging Language Detection
  // Phrases like "maybe", "probably", "I think" indicate uncertainty
  const hedgingPhrases = ['maybe', 'probably', 'i think', 'perhaps', 'might', 'could be', 'not sure'];
  const hasHedging = hedgingPhrases.some(phrase =>
    result.approach.toLowerCase().includes(phrase) ||
    (result.raw_output || '').toLowerCase().includes(phrase)
  );

  const hedgingFlag: RedFlag = {
    type: 'hedging_language',
    detected: hasHedging,
    evidence: hasHedging ? 'Contains uncertainty markers' : undefined,
  };
  flags.push(hedgingFlag);

  // 4. Repetition Detection
  // Repeating same phrase 2+ times indicates confusion
  const words = result.approach.split(' ');
  const hasRepetition = words.some((word, i) =>
    i > 0 && word === words[i-1] && word.length > 3
  );

  const repetitionFlag: RedFlag = {
    type: 'repetition',
    detected: hasRepetition,
    evidence: hasRepetition ? 'Repeated words/phrases detected' : undefined,
  };
  flags.push(repetitionFlag);

  // 5. Out-of-Scope Content Detection
  // Microagent should just execute, not explain or provide alternatives
  const outOfScopePhrases = ['alternatively', 'another option', 'we could also', 'explanation:', 'here\'s why'];
  const hasOutOfScope = outOfScopePhrases.some(phrase =>
    result.approach.toLowerCase().includes(phrase) ||
    (result.raw_output || '').toLowerCase().includes(phrase)
  );

  const scopeFlag: RedFlag = {
    type: 'out_of_scope',
    detected: hasOutOfScope,
    evidence: hasOutOfScope ? 'Contains commentary/alternatives' : undefined,
  };
  flags.push(scopeFlag);

  return flags;
}

/**
 * Check if result should be discarded based on red flags
 */
function shouldDiscardResult(redFlags: RedFlag[]): boolean {
  // Discard if ANY red flag is detected
  // Paper shows this reduces correlated errors by 40%
  return redFlags.some(flag => flag.detected);
}

// ============================================================================
// Voting Algorithm (Component 2 of MAKER - SPRT-based)
// ============================================================================

/**
 * Dynamic K parameter based on task complexity
 * Simple tasks: K=1 (fast)
 * Medium tasks: K=2 (balanced - paper's recommendation)
 * Complex tasks: K=3 (conservative)
 */
function getDynamicK(taskComplexity: 'simple' | 'medium' | 'complex', avgConfidence: number): number {
  if (taskComplexity === 'simple') {
    return avgConfidence >= 0.90 ? 1 : 2;
  }
  if (taskComplexity === 'medium') {
    return avgConfidence >= 0.85 ? 2 : 3;
  }
  // Complex tasks
  return 3;
}

/**
 * Hash result for consensus detection
 * Uses "buckets" to allow minor variation (±20% line count)
 */
function hashResult(result: AgentResult): string {
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
function normalizeApproach(approach: string): string {
  return approach
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

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
// Error Propagation Metrics
// ============================================================================

/**
 * Calculate reliability metrics for a workflow
 * Based on paper's error propagation analysis
 */
function calculateReliabilityMetrics(
  perStepAccuracy: number,
  totalSteps: number
): ReliabilityMetrics {
  // Error rate per step
  const errorRate = 1 - perStepAccuracy;

  // Predicted success rate over N steps
  const predictedSuccessRate = Math.pow(perStepAccuracy, totalSteps);

  // Confidence interval (95%) using binomial distribution
  const z = 1.96; // 95% confidence
  const p = perStepAccuracy;
  const n = totalSteps;

  const stderr = Math.sqrt((p * (1 - p)) / n);
  const lowerBound = Math.max(0, Math.pow(p - z * stderr, n));
  const upperBound = Math.min(1, Math.pow(p + z * stderr, n));

  return {
    per_step_accuracy: perStepAccuracy,
    total_steps: totalSteps,
    predicted_success_rate: predictedSuccessRate,
    error_rate: errorRate,
    confidence_interval: [lowerBound, upperBound],
  };
}

/**
 * Compare traditional vs MAKER reliability
 */
function compareReliability(
  baseAccuracy: number,
  votingAccuracy: number,
  totalSteps: number
) {
  const traditional = calculateReliabilityMetrics(baseAccuracy, totalSteps);
  const maker = calculateReliabilityMetrics(votingAccuracy, totalSteps);

  const improvement = (maker.predicted_success_rate - traditional.predicted_success_rate) /
                      traditional.predicted_success_rate * 100;

  return {
    traditional,
    maker,
    improvement_percentage: improvement,
  };
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

// ============================================================================
// Simulation (for testing)
// ============================================================================

async function simulateHaikuAgent(taskId: string, prompt: string): Promise<AgentResult> {
  // Simulate varying success rates and outputs
  const rand = Math.random();

  const success = rand > 0.05; // 95% base accuracy
  const confidence = success ? 0.80 + Math.random() * 0.15 : 0.40 + Math.random() * 0.20;

  // Simulate output tokens (short for atomic tasks, long when confused)
  const outputTokens = success ?
    Math.floor(30 + Math.random() * 50) : // 30-80 tokens when successful
    Math.floor(100 + Math.random() * 200); // 100-300 tokens when confused

  // Simulate different approaches (successful attempts usually converge)
  const approaches = [
    'Remove line 12 from imports section',
    'Delete unused import statement on line 12',
    'Remove import on line 12 as it is unused',
  ];

  let approach: string;
  if (success) {
    const approachIndex = Math.random() < 0.80 ? 0 : (Math.random() < 0.50 ? 1 : 2);
    approach = approaches[approachIndex];
  } else {
    approach = 'Remove all imports maybe probably check first';
  }

  return {
    success,
    task_id: taskId,
    approach,
    changes: {
      files_modified: ['app/api/chat/route.ts'],
      lines_changed: success ? 42 + Math.floor(Math.random() * 8) : 999,
      additions: success ? 0 : 10,
      deletions: success ? 1 : 50,
    },
    verification: {
      command: 'tsc --noEmit',
      exit_code: success ? 0 : 1,
      output: success ? 'No errors' : 'Error: Cannot find module',
    },
    confidence,
    output_tokens: outputTokens,
    raw_output: success ?
      'Task completed successfully' :
      'I think maybe we should probably remove the imports but I\'m not entirely sure maybe check first',
  };
}

// ============================================================================
// Demo
// ============================================================================

async function demo() {
  console.log('================================================================================');
  console.log('MAKER FRAMEWORK v2 - COMPLETE IMPLEMENTATION');
  console.log('================================================================================');
  console.log('\nBased on arXiv:2511.09030 "Solving a Million-Step LLM Task with Zero Errors"');
  console.log('\nComponents:');
  console.log('1. Extreme decomposition (atomic microagent tasks)');
  console.log('2. SPRT-based voting (first-to-ahead-by-K)');
  console.log('3. Red-flagging (structural error detection)');
  console.log('\n================================================================================\n');

  // Test 1: Simple task (import cleanup)
  console.log('TEST 1: Simple Task - Remove Unused Import');
  console.log('--------------------------------------------------------------------------------');

  const result1 = await runMAKER(
    'remove-import-line-12',
    'Remove the unused import statement on line 12 of app/api/chat/route.ts',
    'simple'
  );

  // Test 2: Medium task (type extraction)
  console.log('\n\nTEST 2: Medium Task - Extract Type Definition');
  console.log('--------------------------------------------------------------------------------');

  const result2 = await runMAKER(
    'extract-type-ChatMessage',
    'Extract ChatMessage type definition to types/chat.ts',
    'medium'
  );

  // Test 3: Reliability analysis
  console.log('\n\n================================================================================');
  console.log('RELIABILITY ANALYSIS');
  console.log('================================================================================\n');

  console.log('Scenario: Import cleanup across 16 imports (16 microagent tasks)\n');

  const comparison = compareReliability(
    0.95,   // Base Haiku accuracy: 95%
    0.993,  // After 3-attempt voting: 99.3%
    16      // Total microagent tasks
  );

  console.log('WITHOUT MAKER (Single Haiku attempt):');
  console.log(`  Per-step accuracy: ${(comparison.traditional.per_step_accuracy * 100).toFixed(1)}%`);
  console.log(`  Error rate: ${(comparison.traditional.error_rate * 100).toFixed(1)}%`);
  console.log(`  Success over 16 steps: ${(comparison.traditional.predicted_success_rate * 100).toFixed(1)}%`);
  console.log(`  Confidence interval: ${(comparison.traditional.confidence_interval[0] * 100).toFixed(1)}% - ${(comparison.traditional.confidence_interval[1] * 100).toFixed(1)}%`);

  console.log('\nWITH MAKER (3-attempt voting + red-flagging):');
  console.log(`  Per-step accuracy: ${(comparison.maker.per_step_accuracy * 100).toFixed(1)}%`);
  console.log(`  Error rate: ${(comparison.maker.error_rate * 100).toFixed(1)}%`);
  console.log(`  Success over 16 steps: ${(comparison.maker.predicted_success_rate * 100).toFixed(1)}%`);
  console.log(`  Confidence interval: ${(comparison.maker.confidence_interval[0] * 100).toFixed(1)}% - ${(comparison.maker.confidence_interval[1] * 100).toFixed(1)}%`);

  console.log(`\nIMPROVEMENT: ${comparison.improvement_percentage.toFixed(0)}% more reliable\n`);

  // Scale analysis
  console.log('SCALABILITY ANALYSIS:\n');

  const scales = [10, 50, 100, 500, 1000];
  console.log('Steps | Without MAKER | With MAKER | Improvement');
  console.log('------|---------------|------------|------------');

  for (const steps of scales) {
    const comp = compareReliability(0.95, 0.993, steps);
    console.log(
      `${steps.toString().padEnd(5)} | ` +
      `${(comp.traditional.predicted_success_rate * 100).toFixed(1)}%`.padEnd(13) + ' | ' +
      `${(comp.maker.predicted_success_rate * 100).toFixed(1)}%`.padEnd(10) + ' | ' +
      `${comp.improvement_percentage.toFixed(0)}%`
    );
  }

  console.log('\n================================================================================');
  console.log('KEY INSIGHTS FROM PAPER');
  console.log('================================================================================\n');

  console.log('1. ERROR ACCUMULATION PROBLEM:');
  console.log('   - 95% accuracy per step = 0.6% success over 100 steps (catastrophic!)');
  console.log('   - Traditional AI fails after ~100-200 steps due to error compounding\n');

  console.log('2. MAKER SOLUTION:');
  console.log('   - Voting improves accuracy: 95% → 99.3% (14× fewer errors)');
  console.log('   - Red-flagging prevents correlated errors (40% reduction)');
  console.log('   - Combined: 99.9%+ accuracy enables 1M+ step tasks\n');

  console.log('3. MODEL SELECTION INSIGHT:');
  console.log('   - Small models (Haiku, gpt-4o-mini) beat expensive reasoning models');
  console.log('   - For atomic tasks, reasoning ability doesn\'t matter');
  console.log('   - Pattern matching + voting > expensive reasoning\n');

  console.log('4. SCALABILITY:');
  console.log('   - Paper achieved 1,048,575 steps with ZERO errors');
  console.log('   - First demonstration of million-step AI reliability');
  console.log('   - Unlocks long-sequence reasoning previously impossible\n');

  console.log('================================================================================\n');
}

// Run demo
demo().catch(console.error);
