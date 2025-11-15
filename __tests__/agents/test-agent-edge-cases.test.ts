#!/usr/bin/env npx tsx
/**
 * Agent Conversation Edge Case Test Suite Orchestrator
 *
 * Refactored from 393 LOC to:
 * - This file: 84 LOC (orchestrator)
 * - edge-cases/: 4 test files (~50-150 LOC each)
 * - edge-cases/edge-case-tester.ts: Utility class (55 LOC)
 *
 * Tests unusual scenarios, error handling, and boundary conditions
 */

import chalk from 'chalk';
import {
  EdgeCaseTester,
  API_URL,
  TEST_DOMAIN,
  testEmptyMessage,
  testVeryLongMessage,
  testSpecialCharacters,
  testRapidFireMessages,
  testMultilingualInput,
  testConversationRecovery,
  testInvalidConversationId,
  testNumberedListMemory,
  testCircularReference,
  testAmbiguousPronounResolution,
  testMemoryOverflow,
} from './edge-cases';

interface EdgeCaseTest {
  name: string;
  description: string;
  test: (tester: EdgeCaseTester) => Promise<boolean>;
}

async function runEdgeCaseTests() {
  console.log(chalk.bold.cyan('\n🔬 AGENT CONVERSATION EDGE CASE TEST SUITE'));
  console.log(chalk.bold.cyan('='.repeat(70)));
  console.log(chalk.gray(`Testing API: ${API_URL}`));
  console.log(chalk.gray(`Test Domain: ${TEST_DOMAIN}`));

  const tester = new EdgeCaseTester();

  const tests: EdgeCaseTest[] = [
    { name: 'Empty Message Handling', description: 'Test how the agent handles empty messages', test: testEmptyMessage },
    { name: 'Very Long Message', description: 'Test message length limits', test: testVeryLongMessage },
    { name: 'Special Characters', description: 'Test handling of special characters and potential XSS', test: testSpecialCharacters },
    { name: 'Rapid Fire Messages', description: 'Test concurrent message handling', test: testRapidFireMessages },
    { name: 'Multilingual Input', description: 'Test handling of non-English input', test: testMultilingualInput },
    { name: 'Conversation Recovery', description: 'Test recovery after interruption', test: testConversationRecovery },
    { name: 'Invalid Conversation ID', description: 'Test handling of invalid conversation references', test: testInvalidConversationId },
    { name: 'Numbered List Memory', description: 'Test complex list item referencing', test: testNumberedListMemory },
    { name: 'Circular References', description: 'Test handling of self-referential questions', test: testCircularReference },
    { name: 'Ambiguous Pronouns', description: 'Test resolution of ambiguous references', test: testAmbiguousPronounResolution },
    { name: 'Memory Overflow', description: 'Test handling of very long conversations', test: testMemoryOverflow },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    console.log(chalk.cyan(`\n📋 ${test.name}`));
    console.log(chalk.gray(`   ${test.description}`));

    try {
      const passed = await test.test(tester);
      results.push({ name: test.name, passed });
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(chalk.red(`   ❌ Test crashed: ${error}`));
      results.push({ name: test.name, passed: false });
    }
  }

  console.log(chalk.bold.cyan('\n' + '='.repeat(70)));
  console.log(chalk.bold.cyan('📊 EDGE CASE TEST RESULTS'));
  console.log(chalk.bold.cyan('='.repeat(70)));

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? chalk.green('✅') : chalk.red('❌');
    const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
    console.log(`${icon} ${result.name}: ${status}`);
  });

  console.log(chalk.cyan('\n' + '─'.repeat(70)));
  console.log(chalk.bold(`Total Passed: ${chalk.green(passedCount)}/${tests.length}`));
  console.log(chalk.bold(`Total Failed: ${chalk.red(failedCount)}/${tests.length}`));

  const passRate = (passedCount / tests.length * 100).toFixed(1);
  const color = passedCount === tests.length ? chalk.green :
                passedCount > tests.length / 2 ? chalk.yellow : chalk.red;

  console.log(chalk.bold(`Pass Rate: ${color(passRate + '%')}`));
  console.log(chalk.cyan('='.repeat(70)));

  process.exit(failedCount > 0 ? 1 : 0);
}

runEdgeCaseTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
