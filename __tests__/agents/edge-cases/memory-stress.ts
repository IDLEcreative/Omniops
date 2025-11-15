/**
 * Edge Cases: Memory Stress Tests
 * Tests: Long conversations with many messages
 */

import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { EdgeCaseTester } from './edge-case-tester';

export async function testMemoryOverflow(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Long conversation memory (50 messages)'));
  const sessionId = uuidv4();
  let conversationId: string | undefined;

  for (let i = 0; i < 50; i++) {
    const result = await tester.sendMessage(
      `Question ${i + 1}: Tell me about pump model P${i + 1}`,
      {
        session_id: sessionId,
        conversation_id: conversationId,
      }
    );

    if (!result.ok) {
      console.log(chalk.red(`   ❌ Failed at message ${i + 1}`));
      return false;
    }

    conversationId = result.data.conversation_id;

    if (i % 10 === 0) {
      console.log(chalk.gray(`     Progress: ${i + 1}/50 messages`));
    }
  }

  const finalResult = await tester.sendMessage(
    'What was the first pump I asked about?',
    {
      session_id: sessionId,
      conversation_id: conversationId,
    }
  );

  if (finalResult.ok && finalResult.data.message) {
    console.log(chalk.green('   ✅ Handled 50+ message conversation'));
    return true;
  }

  console.log(chalk.red('   ❌ Failed with long conversation'));
  return false;
}
