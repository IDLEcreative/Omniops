/**
 * MAKER Framework - Voting System Demonstration
 *
 * @purpose Demonstration of voting algorithm with example tasks
 *
 * @flow
 *   1. Run voting demonstration
 *   2. → Show adaptive voting in action
 *   3. → Display cost analysis
 *
 * @keyFunctions
 *   - exampleTaskRunner (line 38): Simulates Haiku agent attempts
 *   - demonstration (line 67): Main demonstration function
 *
 * @handles
 *   - Example task simulation
 *   - Voting demonstration
 *   - Cost comparison display
 *
 * @returns Demonstration output
 *
 * @dependencies
 *   - ./voting-system.ts (adaptiveVoting)
 *   - ./types.ts (AgentResult)
 *
 * @consumers
 *   - Direct execution: npx tsx scripts/maker/voting-demo.ts
 *
 * @totalLines 105
 * @estimatedTokens 390 (without header), 490 (with header - 20% savings)
 */

import { adaptiveVoting } from './voting-system';
import { AgentResult } from './types';

/**
 * Example task runner (simulates Haiku agent)
 */
async function exampleTaskRunner(attemptId: string): Promise<AgentResult> {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000 + 500));

  const success = Math.random() > 0.15;
  const approach = success
    ? 'Extract types to types/analytics.ts, update imports'
    : 'Failed to extract types';

  return {
    success,
    task_id: 'extract-types-analytics',
    approach,
    changes: {
      files_modified: success ? ['lib/analytics.ts', 'types/analytics.ts'] : [],
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
      console.log(`  ${isWinner ? '👑' : '  '} ${hash}: ${count} vote${count !== 1 ? 's' : ''}`);
    }
  } else {
    console.log('❌ ESCALATION NEEDED');
    console.log();
    console.log('Reason:', result.escalation_reason);
    console.log('Total attempts:', result.total_attempts);
    console.log();
    console.log('Vote distribution:');
    for (const [hash, count] of (result.votes as Map<string, number>).entries()) {
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
  const estimatedTokensPerAttempt = 2000;
  const haikuCost = (result.total_attempts * estimatedTokensPerAttempt * haikuCostPerK) / 1000;
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

if (require.main === module) {
  demonstration().catch(console.error);
}

export { demonstration, exampleTaskRunner };
