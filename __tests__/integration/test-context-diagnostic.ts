#!/usr/bin/env npx tsx
/**
 * Diagnostic test to check if conversation history is being passed to the AI
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

async function runDiagnostic() {
  console.log(chalk.bold.cyan('\n🔍 CONVERSATION CONTEXT DIAGNOSTIC'));
  console.log(chalk.cyan('=' .repeat(60)));
  
  const sessionId = uuidv4();
  
  // Message 1: Establish context
  console.log(chalk.yellow('\n1️⃣ Establishing context...'));
  const response1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'My favorite color is blue and I have a dog named Max',
      session_id: sessionId,
      domain: TEST_DOMAIN,
    }),
  });
  
  const data1 = await response1.json();
  const conversationId = data1.conversation_id;
  console.log(chalk.gray('User: "My favorite color is blue and I have a dog named Max"'));
  console.log(chalk.blue(`Bot: ${data1.message.substring(0, 100)}...`));
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Message 2: Test if it remembers
  console.log(chalk.yellow('\n2️⃣ Testing memory...'));
  const response2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What did I just tell you about my pet and favorite color?',
      session_id: sessionId,
      conversation_id: conversationId,
      domain: TEST_DOMAIN,
    }),
  });
  
  const data2 = await response2.json();
  console.log(chalk.gray('User: "What did I just tell you about my pet and favorite color?"'));
  console.log(chalk.blue(`Bot: ${data2.message}`));
  
  // Check if response contains the context
  const response = data2.message.toLowerCase();
  const hasColor = response.includes('blue');
  const hasPet = response.includes('max') || response.includes('dog');
  
  console.log(chalk.cyan('\n' + '=' .repeat(60)));
  console.log(chalk.bold('DIAGNOSTIC RESULTS:'));
  
  if (hasColor && hasPet) {
    console.log(chalk.green('✅ CONTEXT IS WORKING: The AI remembered both facts'));
    console.log(chalk.gray('   → Conversation history is being passed correctly'));
  } else if (hasColor || hasPet) {
    console.log(chalk.yellow('⚠️  PARTIAL CONTEXT: The AI remembered some facts'));
    console.log(chalk.gray('   → History might be truncated or partially working'));
  } else {
    console.log(chalk.red('❌ NO CONTEXT: The AI did not remember the facts'));
    console.log(chalk.gray('   → Conversation history is NOT being passed to the model'));
  }
  
  console.log(chalk.cyan('=' .repeat(60) + '\n'));
}

runDiagnostic().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
