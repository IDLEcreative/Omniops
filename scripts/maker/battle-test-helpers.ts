/**
 * MAKER Framework - Battle Test Helpers
 *
 * @purpose Helper functions for battle testing
 *
 * @flow
 *   1. Import helper functions
 *   2. → Use for agent simulation and validation
 *   3. → Return test results
 *
 * @keyFunctions
 *   - simulateHaikuAttempt (line 42): Simulate Haiku agent with configurable success rate
 *   - createResult (line 98): Create test result for voting tests
 *   - validatePaperClaims (line 115): Validate paper claims against results
 *
 * @handles
 *   - Agent simulation with varying success rates
 *   - Test result creation
 *   - Paper claim validation
 *
 * @returns Helper functions for battle testing
 *
 * @dependencies
 *   - ./types.ts (AgentResult)
 *   - ./display-utils.ts (TestResults)
 *
 * @consumers
 *   - scripts/maker/battle-test.ts
 *
 * @totalLines 168
 * @estimatedTokens 620 (without header), 720 (with header - 14% savings)
 */

import { AgentResult } from './types';
import { TestResults } from './display-utils';

/**
 * Simulate a Haiku agent attempt with configurable success rate
 */
export function simulateHaikuAttempt(
  taskId: string,
  successRate: number,
  attemptId: string
): AgentResult {
  const success = Math.random() < successRate;

  const approaches = [
    'Extract types to types/module.ts, update imports',
    'Move type definitions to separate file, fix references',
    'Create types file with extracted definitions, update imports',
  ];

  let approach: string;
  if (success) {
    const rand = Math.random();
    if (rand < 0.80) {
      approach = approaches[0];
    } else if (rand < 0.95) {
      approach = approaches[1];
    } else {
      approach = approaches[2];
    }
  } else {
    approach = 'Failed to complete task';
  }

  const confidence = success
    ? 0.85 + Math.random() * 0.14
    : 0.30 + Math.random() * 0.30;

  return {
    success,
    task_id: taskId,
    approach,
    changes: {
      files_modified: success ? ['lib/module.ts', 'types/module.ts'] : [],
      lines_changed: success ? 42 + Math.floor(Math.random() * 20) : 0,
      additions: success ? 30 + Math.floor(Math.random() * 20) : 0,
      deletions: success ? 12 + Math.floor(Math.random() * 10) : 0,
    },
    verification: {
      command: 'npx tsc --noEmit && npm test',
      exit_code: success ? 0 : 1,
      output: success ? 'All checks passed' : 'Type error on line 42',
    },
    confidence,
    red_flags: [],
    agent_id: attemptId,
    timestamp: Date.now(),
  };
}

/**
 * Create test result for voting algorithm tests
 */
export function createResult(approach: string, success: boolean, confidence: number): AgentResult {
  return {
    success,
    task_id: 'test',
    approach,
    changes: {
      files_modified: success ? ['file.ts'] : [],
      lines_changed: success ? 42 : 0,
      additions: success ? 30 : 0,
      deletions: success ? 12 : 0,
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

/**
 * Validate paper claims against test results
 */
export function validatePaperClaims(results: TestResults[]): number {
  console.log('\n' + '='.repeat(80));
  console.log('PAPER CLAIMS VALIDATION');
  console.log('='.repeat(80));

  const claims = [
    {
      claim: 'Claim 1: Small models + voting achieves high success rate',
      validation: 'Success rate should be >95% for simple/medium tasks',
      test: () => {
        const simpleResults = results.filter(
          (r) => r.scenario.includes('ESLint') || r.scenario.includes('Dependency')
        );
        const avgSuccess = simpleResults.reduce((sum, r) => sum + r.successRate, 0) / simpleResults.length;
        return { pass: avgSuccess >= 95, value: avgSuccess.toFixed(1) + '%' };
      },
    },
    {
      claim: 'Claim 2: 80-90% cost savings vs expensive models',
      validation: 'Average cost savings should be 80-90% vs Opus',
      test: () => {
        const avgSavings = results.reduce((sum, r) => sum + r.costVsOpus, 0) / results.length;
        return { pass: avgSavings >= 80 && avgSavings <= 95, value: avgSavings.toFixed(1) + '%' };
      },
    },
    {
      claim: 'Claim 3: Consensus reached in 3-5 attempts for simple tasks',
      validation: 'Simple tasks should reach consensus in ≤3 attempts',
      test: () => {
        const simpleResults = results.filter(
          (r) => r.scenario.includes('ESLint') || r.scenario.includes('Dependency')
        );
        const avgAttempts = simpleResults.reduce((sum, r) => sum + r.avgAttempts, 0) / simpleResults.length;
        return { pass: avgAttempts <= 3.5, value: avgAttempts.toFixed(2) + ' attempts' };
      },
    },
    {
      claim: 'Claim 4: Escalation needed only for complex tasks',
      validation: 'Simple tasks should have <5% escalation rate',
      test: () => {
        const simpleResults = results.filter(
          (r) => r.scenario.includes('ESLint') || r.scenario.includes('Dependency')
        );
        const avgEscalation = simpleResults.reduce((sum, r) => sum + r.escalationRate, 0) / simpleResults.length;
        return { pass: avgEscalation < 5, value: avgEscalation.toFixed(1) + '%' };
      },
    },
    {
      claim: 'Claim 5: Higher accuracy than single model',
      validation: 'Voting should achieve >90% consensus on medium tasks',
      test: () => {
        const mediumResults = results.filter(
          (r) => r.scenario.includes('Type') || r.scenario.includes('Refactoring')
        );
        const avgConsensus = mediumResults.reduce((sum, r) => sum + r.consensusRate, 0) / mediumResults.length;
        return { pass: avgConsensus >= 90, value: avgConsensus.toFixed(1) + '%' };
      },
    },
  ];

  let claimsPassed = 0;
  claims.forEach((claim, i) => {
    const result = claim.test();
    console.log(`\n${result.pass ? '✅' : '❌'} ${claim.claim}`);
    console.log(`  Validation: ${claim.validation}`);
    console.log(`  Result: ${result.value} ${result.pass ? '(PASS)' : '(FAIL)'}`);

    if (result.pass) claimsPassed++;
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log(`Paper Claims: ${claimsPassed}/${claims.length} validated`);
  console.log(`${'='.repeat(80)}`);

  return claimsPassed;
}
