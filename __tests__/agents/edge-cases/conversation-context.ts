/**
 * Edge Cases: Conversation Context Tests
 * Tests: Conversation recovery, invalid IDs, numbered lists, circular references, ambiguous pronouns
 */

import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';
import { EdgeCaseTester } from './edge-case-tester';

export async function testConversationRecovery(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Conversation recovery after interruption'));
  const sessionId = uuidv4();

  const result1 = await tester.sendMessage('I need a pump for my Cifa mixer', {
    session_id: sessionId,
  });

  if (!result1.ok || !result1.data.conversation_id) {
    console.log(chalk.red('   ❌ Failed to start conversation'));
    return false;
  }

  const conversationId = result1.data.conversation_id;
  await new Promise(resolve => setTimeout(resolve, 2000));

  const result2 = await tester.sendMessage('What was I asking about?', {
    session_id: sessionId,
    conversation_id: conversationId,
  });

  if (result2.ok && result2.data.message) {
    const response = result2.data.message.toLowerCase();
    if (response.includes('pump') || response.includes('cifa') || response.includes('mixer')) {
      console.log(chalk.green('   ✅ Successfully recovered conversation context'));
      return true;
    }
  }

  console.log(chalk.red('   ❌ Failed to recover conversation context'));
  return false;
}

export async function testInvalidConversationId(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Invalid conversation ID'));
  const result = await tester.sendMessage('Tell me about pumps', {
    conversation_id: 'invalid-id-12345',
  });

  if (result.ok && result.data.message) {
    console.log(chalk.green('   ✅ Gracefully handled invalid conversation ID'));
    return true;
  } else {
    console.log(chalk.red('   ❌ Failed with invalid conversation ID'));
    return false;
  }
}

export async function testNumberedListMemory(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Complex numbered list memory'));
  const sessionId = uuidv4();

  const result1 = await tester.sendMessage(
    'List exactly 5 different types of pumps you have',
    { session_id: sessionId }
  );

  if (!result1.ok || !result1.data.conversation_id) {
    console.log(chalk.red('   ❌ Failed to get initial list'));
    return false;
  }

  const conversationId = result1.data.conversation_id;
  await new Promise(resolve => setTimeout(resolve, 1000));

  const result2 = await tester.sendMessage('Tell me about items 2, 3, and 5', {
    session_id: sessionId,
    conversation_id: conversationId,
  });

  if (result2.ok && result2.data.message) {
    const response = result2.data.message.toLowerCase();
    if (response.includes('2') || response.includes('3') || response.includes('5') ||
        response.includes('second') || response.includes('third') || response.includes('fifth')) {
      console.log(chalk.green('   ✅ Correctly referenced numbered list items'));
      return true;
    }
  }

  console.log(chalk.red('   ❌ Failed to reference numbered list items'));
  return false;
}

export async function testCircularReference(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Circular reference handling'));
  const sessionId = uuidv4();

  const result1 = await tester.sendMessage('What pumps do you have?', {
    session_id: sessionId,
  });

  if (!result1.ok || !result1.data.conversation_id) {
    console.log(chalk.red('   ❌ Failed to start conversation'));
    return false;
  }

  const conversationId = result1.data.conversation_id;
  await new Promise(resolve => setTimeout(resolve, 1000));

  const circularMessages = [
    'What did I just ask?',
    'And what did I ask before that?',
    'What was my question before the previous one?',
  ];

  let lastResult = result1;
  for (const msg of circularMessages) {
    lastResult = await tester.sendMessage(msg, {
      session_id: sessionId,
      conversation_id: conversationId,
    });

    if (!lastResult.ok) {
      console.log(chalk.red('   ❌ Failed during circular reference'));
      return false;
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(chalk.green('   ✅ Handled circular references without crashing'));
  return true;
}

export async function testAmbiguousPronounResolution(tester: EdgeCaseTester): Promise<boolean> {
  console.log(chalk.yellow('   Testing: Ambiguous pronoun resolution'));
  const sessionId = uuidv4();

  const conversation = [
    'I need a pump and a seal kit',
    'How much does it cost?',
    'Is it available?',
    'Can you ship it tomorrow?',
  ];

  let conversationId: string | undefined;
  let lastResponse = '';

  for (const msg of conversation) {
    const result = await tester.sendMessage(msg, {
      session_id: sessionId,
      conversation_id: conversationId,
    });

    if (!result.ok) {
      console.log(chalk.red('   ❌ Conversation failed'));
      return false;
    }

    conversationId = result.data.conversation_id;
    lastResponse = result.data.message;
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const response = lastResponse.toLowerCase();
  if (response.includes('which') || response.includes('pump') ||
      response.includes('seal') || response.includes('both')) {
    console.log(chalk.green('   ✅ Handled ambiguous pronouns appropriately'));
    return true;
  }

  console.log(chalk.red('   ❌ Failed to handle ambiguous pronouns'));
  return false;
}
