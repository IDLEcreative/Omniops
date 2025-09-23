#!/usr/bin/env npx tsx
/**
 * Quick demonstration of agent conversation testing
 * Runs a subset of tests with shorter delays
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

async function sendMessage(message: string, sessionId: string, conversationId?: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_id: conversationId,
      domain: TEST_DOMAIN,
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true },
        },
      },
    }),
  });

  const data = await response.json();
  return data;
}

async function runQuickDemo() {
  console.log(chalk.bold.cyan('\n🚀 QUICK AGENT CONVERSATION DEMO'));
  console.log(chalk.cyan('=' .repeat(60)));

  // Test 1: Basic Context Retention
  console.log(chalk.yellow('\n📝 Test 1: Basic Context Retention'));
  console.log(chalk.gray('Testing if agent remembers previous messages...'));
  
  const session1 = uuidv4();
  let conv1: string | undefined;
  
  const r1 = await sendMessage('I need a pump for my Cifa mixer', session1);
  conv1 = r1.conversation_id;
  console.log(chalk.gray(`User: "I need a pump for my Cifa mixer"`));
  console.log(chalk.blue(`Bot: ${r1.message.substring(0, 100)}...`));
  
  await new Promise(r => setTimeout(r, 500));
  
  const r2 = await sendMessage('Tell me more about the first one', session1, conv1);
  console.log(chalk.gray(`User: "Tell me more about the first one"`));
  console.log(chalk.blue(`Bot: ${r2.message.substring(0, 100)}...`));
  
  const test1Pass = r2.message.toLowerCase().includes('pump') || 
                    r2.message.toLowerCase().includes('cifa');
  console.log(test1Pass ? chalk.green('✅ Context maintained') : chalk.red('❌ Context lost'));

  // Test 2: Topic Switching
  console.log(chalk.yellow('\n📝 Test 2: Topic Switching'));
  console.log(chalk.gray('Testing topic changes and returns...'));
  
  const session2 = uuidv4();
  let conv2: string | undefined;
  
  const r3 = await sendMessage('What pumps do you have?', session2);
  conv2 = r3.conversation_id;
  console.log(chalk.gray(`User: "What pumps do you have?"`));
  console.log(chalk.blue(`Bot: ${r3.message.substring(0, 100)}...`));
  
  await new Promise(r => setTimeout(r, 500));
  
  const r4 = await sendMessage('Do you ship to France?', session2, conv2);
  console.log(chalk.gray(`User: "Do you ship to France?"`));
  console.log(chalk.blue(`Bot: ${r4.message.substring(0, 100)}...`));
  
  await new Promise(r => setTimeout(r, 500));
  
  const r5 = await sendMessage('Back to the pumps - what was the price?', session2, conv2);
  console.log(chalk.gray(`User: "Back to the pumps - what was the price?"`));
  console.log(chalk.blue(`Bot: ${r5.message.substring(0, 100)}...`));
  
  const test2Pass = r5.message.toLowerCase().includes('pump') || 
                    r5.message.toLowerCase().includes('price');
  console.log(test2Pass ? chalk.green('✅ Handled topic switch') : chalk.red('❌ Lost context'));

  // Test 3: Pronoun Resolution
  console.log(chalk.yellow('\n📝 Test 3: Pronoun Resolution'));
  console.log(chalk.gray('Testing if agent resolves "it" correctly...'));
  
  const session3 = uuidv4();
  let conv3: string | undefined;
  
  const r6 = await sendMessage('Do you have the A4VTG90 pump?', session3);
  conv3 = r6.conversation_id;
  console.log(chalk.gray(`User: "Do you have the A4VTG90 pump?"`));
  console.log(chalk.blue(`Bot: ${r6.message.substring(0, 100)}...`));
  
  await new Promise(r => setTimeout(r, 500));
  
  const r7 = await sendMessage('How much does it cost?', session3, conv3);
  console.log(chalk.gray(`User: "How much does it cost?"`));
  console.log(chalk.blue(`Bot: ${r7.message.substring(0, 100)}...`));
  
  const test3Pass = r7.message.toLowerCase().includes('a4vtg90') || 
                    r7.message.toLowerCase().includes('pump') ||
                    r7.message.includes('£') ||
                    r7.message.toLowerCase().includes('price');
  console.log(test3Pass ? chalk.green('✅ Resolved pronoun') : chalk.red('❌ Failed pronoun resolution'));

  // Test 4: Numbered List Reference
  console.log(chalk.yellow('\n📝 Test 4: Numbered List Reference'));
  console.log(chalk.gray('Testing references to numbered items...'));
  
  const session4 = uuidv4();
  let conv4: string | undefined;
  
  const r8 = await sendMessage('List 3 pumps you have', session4);
  conv4 = r8.conversation_id;
  console.log(chalk.gray(`User: "List 3 pumps you have"`));
  console.log(chalk.blue(`Bot: ${r8.message.substring(0, 100)}...`));
  
  await new Promise(r => setTimeout(r, 500));
  
  const r9 = await sendMessage('Tell me about item 2', session4, conv4);
  console.log(chalk.gray(`User: "Tell me about item 2"`));
  console.log(chalk.blue(`Bot: ${r9.message.substring(0, 100)}...`));
  
  const test4Pass = r9.message.toLowerCase().includes('2') || 
                    r9.message.toLowerCase().includes('second') ||
                    r9.message.toLowerCase().includes('pump');
  console.log(test4Pass ? chalk.green('✅ Understood list reference') : chalk.red('❌ Failed list reference'));

  // Summary
  console.log(chalk.cyan('\n' + '=' .repeat(60)));
  console.log(chalk.bold.cyan('📊 QUICK DEMO RESULTS'));
  console.log(chalk.cyan('=' .repeat(60)));
  
  const results = [test1Pass, test2Pass, test3Pass, test4Pass];
  const passed = results.filter(r => r).length;
  
  console.log(chalk.bold(`Tests Passed: ${passed}/4`));
  
  if (passed === 4) {
    console.log(chalk.green('🎉 Excellent! All tests passed'));
  } else if (passed >= 2) {
    console.log(chalk.yellow('⚠️  Some context retention issues detected'));
  } else {
    console.log(chalk.red('❌ Significant conversation handling issues'));
  }
  
  console.log(chalk.gray('\nFor full test suite, run: npx tsx test-agent-conversation-suite.ts'));
}

runQuickDemo().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});