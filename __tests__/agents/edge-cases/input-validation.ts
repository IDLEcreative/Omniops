/**
 * Edge Cases: Input Validation Tests
 * Tests: Empty messages, very long messages, special characters
 */

import chalk from 'chalk';
import { EdgeCaseTester } from './edge-case-tester';

export async function testEmptyMessage(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Empty message'));
  const result = await tester.sendMessage('');

  if (!result.ok || result.data.error) {
    console.log(chalk.green('   ✅ Correctly rejected empty message'));
    return true;
  } else {
    console.log(chalk.red('   ❌ Should reject empty messages'));
    return false;
  }
}

export async function testVeryLongMessage(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Very long message (10,000 chars)'));
  const longMessage = 'I need help with pumps. ' + 'x'.repeat(9975);
  const result = await tester.sendMessage(longMessage);

  if (result.ok && result.data.message) {
    console.log(chalk.green('   ✅ Handled long message gracefully'));
    return true;
  } else {
    console.log(chalk.red('   ❌ Failed to handle long message'));
    return false;
  }
}

export async function testSpecialCharacters(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Special characters and emojis'));
  const specialMessage = 'Need pump for Cifa™ mixer 😊 €500 budget! <script>alert("test")</script>';
  const result = await tester.sendMessage(specialMessage);

  if (result.ok && result.data.message && !result.data.message.includes('<script>')) {
    console.log(chalk.green('   ✅ Handled special characters safely'));
    return true;
  } else {
    console.log(chalk.red('   ❌ Failed to handle special characters safely'));
    return false;
  }
}
