/**
 * Conversation suite test runner
 * Orchestrates scenario execution and reporting
 * ~130 LOC - Minimal orchestration of test scenarios
 */

import * as chalk from 'chalk';
import { ConversationClient, ExpectationValidator } from '../../utils/agents';
import { testScenarios } from './index';
import type { ScenarioResult } from '../../utils/agents';

const API_URL = process.env.API_URL || 'http://localhost:3000/api/chat';
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

async function runScenario(
  client: ConversationClient,
  scenarioName: string,
  scenarioDescription: string,
  messages: typeof testScenarios[0]['messages']
): Promise<boolean> {
  console.log(chalk.cyan(`\n📋 Running Scenario: ${scenarioName}`));
  console.log(chalk.gray(`   ${scenarioDescription}`));
  console.log(chalk.gray('   ' + '─'.repeat(60)));

  let allTestsPassed = true;

  for (let i = 0; i < messages.length; i++) {
    const { input, expectations } = messages[i];

    console.log(chalk.yellow(`\n   Turn ${i + 1}: "${input}"`));

    try {
      const response = await client.sendMessage(input);
      console.log(chalk.gray(`   Response: ${response.message.substring(0, 150)}...`));

      const results = ExpectationValidator.validate(
        response.message,
        expectations,
        client.getMessageHistory()
      );

      if (results.passed) {
        console.log(chalk.green(`   ✅ All expectations met`));
      } else {
        console.log(chalk.red(`   ❌ Failed expectations:`));
        results.failures.forEach(failure => {
          console.log(chalk.red(`      - ${failure}`));
        });
        allTestsPassed = false;
      }

      await delay(1000);
    } catch (error) {
      console.log(chalk.red(`   ❌ Error: ${error}`));
      allTestsPassed = false;
    }
  }

  return allTestsPassed;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runAllTests(): Promise<number> {
  console.log(chalk.bold.cyan('\n🤖 COMPREHENSIVE AGENT CONVERSATION TEST SUITE'));
  console.log(chalk.bold.cyan('=' .repeat(70)));
  console.log(chalk.gray(`Testing API: ${API_URL}`));
  console.log(chalk.gray(`Test Domain: ${TEST_DOMAIN}`));
  console.log(chalk.gray(`Total Scenarios: ${testScenarios.length}`));

  const results: ScenarioResult[] = [];

  for (const scenario of testScenarios) {
    const client = new ConversationClient(API_URL, TEST_DOMAIN);
    const passed = await runScenario(
      client,
      scenario.name,
      scenario.description,
      scenario.messages
    );
    results.push({ scenario: scenario.name, passed });

    await delay(2000);
  }

  // Print results summary
  console.log(chalk.bold.cyan('\n' + '=' .repeat(70)));
  console.log(chalk.bold.cyan('📊 TEST RESULTS SUMMARY'));
  console.log(chalk.bold.cyan('=' .repeat(70)));

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? chalk.green('✅') : chalk.red('❌');
    const status = result.passed ? chalk.green('PASSED') : chalk.red('FAILED');
    console.log(`${icon} ${result.scenario}: ${status}`);
  });

  console.log(chalk.cyan('\n' + '─'.repeat(70)));
  console.log(chalk.bold(`Total Passed: ${chalk.green(passedCount)}/${testScenarios.length}`));
  console.log(chalk.bold(`Total Failed: ${chalk.red(failedCount)}/${testScenarios.length}`));

  const passRate = (passedCount / testScenarios.length * 100).toFixed(1);
  const color =
    passedCount === testScenarios.length
      ? chalk.green
      : passedCount > testScenarios.length / 2
        ? chalk.yellow
        : chalk.red;

  console.log(chalk.bold(`Pass Rate: ${color(passRate + '%')}`));
  console.log(chalk.cyan('=' .repeat(70)));

  return failedCount > 0 ? 1 : 0;
}
