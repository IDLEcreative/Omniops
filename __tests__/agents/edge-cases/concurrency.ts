/**
 * Edge Cases: Concurrency Tests
 * Tests: Rapid fire messages, multilingual input
 */

import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { EdgeCaseTester } from './edge-case-tester';

export async function testRapidFireMessages(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Rapid fire messages (10 in parallel)'));
  const sessionId = uuidv4();
  let conversationId: string | undefined;

  const promises = Array(10).fill(0).map((_, i) =>
    tester.sendMessage(`Quick question ${i + 1}: Do you have pumps?`, {
      session_id: sessionId,
      conversation_id: conversationId,
    })
  );

  const results = await Promise.allSettled(promises);
  const successful = results.filter(r => r.status === 'fulfilled').length;

  if (successful >= 8) {
    console.log(chalk.green(`   ✅ Handled rapid messages (${successful}/10 successful)`));
    return true;
  } else {
    console.log(chalk.red(`   ❌ Poor handling of rapid messages (${successful}/10 successful)`));
    return false;
  }
}

export async function testMultilingualInput(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Multilingual input'));
  const messages = [
    'Necesito una bomba para mi mezcladora Cifa',
    'J\'ai besoin d\'une pompe pour mon mélangeur Cifa',
    'Ich brauche eine Pumpe für meinen Cifa-Mischer',
    '我需要一个Cifa混合器的泵',
  ];

  let successCount = 0;
  for (const msg of messages) {
    const result = await tester.sendMessage(msg);
    if (result.ok && result.data.message) {
      successCount++;
    }
  }

  if (successCount >= 3) {
    console.log(chalk.green(`   ✅ Handled multilingual input (${successCount}/4 successful)`));
    return true;
  } else {
    console.log(chalk.red(`   ❌ Poor multilingual support (${successCount}/4 successful)`));
    return false;
  }
}
