#!/usr/bin/env npx tsx
/**
 * Simple test to verify conversation history is working naturally
 * No prescriptive instructions - just testing if the model has context
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat-intelligent';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

async function sendMessage(
  message: string, 
  sessionId: string, 
  conversationId?: string
): Promise<{ message: string; conversation_id: string }> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      session_id: sessionId,
      conversation_id: conversationId,
      domain: TEST_DOMAIN,
    }),
  });
  return response.json();
}

async function testConversationContext() {
  console.log(chalk.bold.cyan('\n🔍 CONVERSATION CONTEXT VERIFICATION'));
  console.log(chalk.cyan('Testing if the model naturally has access to conversation history'));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
  
  const sessionId = uuidv4();
  let allPassed = true;
  
  // Test 1: Establish some facts
  console.log(chalk.yellow('1️⃣ Establishing context...'));
  console.log(chalk.gray('User: "I have a 2019 Cifa mixer model MK28 and my budget is £5000"'));
  
  const r1 = await sendMessage(
    'I have a 2019 Cifa mixer model MK28 and my budget is £5000',
    sessionId
  );
  const conversationId = r1.conversation_id;
  
  console.log(chalk.blue('Bot: ' + r1.message.substring(0, 150) + '...\n'));
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 2: Ask about products (establishes search context)
  console.log(chalk.yellow('2️⃣ Searching for products...'));
  console.log(chalk.gray('User: "Show me hydraulic pumps for Cifa mixers"'));
  
  const r2 = await sendMessage(
    'Show me hydraulic pumps for Cifa mixers',
    sessionId,
    conversationId
  );
  
  console.log(chalk.blue('Bot: ' + r2.message.substring(0, 200) + '...\n'));
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 3: Reference the budget (from message 1)
  console.log(chalk.yellow('3️⃣ Testing memory of budget...'));
  console.log(chalk.gray('User: "Which ones fit my budget?"'));
  
  const r3 = await sendMessage(
    'Which ones fit my budget?',
    sessionId,
    conversationId
  );
  
  const mentionsBudget = r3.message.includes('5000') || r3.message.includes('£5') || r3.message.toLowerCase().includes('budget');
  console.log(chalk.blue('Bot: ' + r3.message.substring(0, 200) + '...'));
  
  if (mentionsBudget) {
    console.log(chalk.green('✅ Remembered the £5000 budget from earlier\n'));
  } else {
    console.log(chalk.red('❌ Did not reference the budget\n'));
    allPassed = false;
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 4: Reference the model (from message 1)
  console.log(chalk.yellow('4️⃣ Testing memory of mixer model...'));
  console.log(chalk.gray('User: "Will these work with my mixer?"'));
  
  const r4 = await sendMessage(
    'Will these work with my mixer?',
    sessionId,
    conversationId
  );
  
  const mentionsModel = r4.message.includes('MK28') || r4.message.includes('2019') || r4.message.toLowerCase().includes('cifa');
  console.log(chalk.blue('Bot: ' + r4.message.substring(0, 200) + '...'));
  
  if (mentionsModel) {
    console.log(chalk.green('✅ Remembered the MK28/2019 Cifa mixer\n'));
  } else {
    console.log(chalk.red('❌ Did not reference the specific mixer model\n'));
    allPassed = false;
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 5: Ask about "it" (pronoun resolution)
  console.log(chalk.yellow('5️⃣ Testing pronoun resolution...'));
  console.log(chalk.gray('User: "How much does it cost?" (referring to last mentioned pump)'));
  
  const r5 = await sendMessage(
    'How much does it cost?',
    sessionId,
    conversationId
  );
  
  const mentionsPrice = r5.message.includes('£') || r5.message.toLowerCase().includes('price') || r5.message.toLowerCase().includes('cost');
  const mentionsProduct = r5.message.toLowerCase().includes('pump') || r5.message.toLowerCase().includes('hydraulic');
  
  console.log(chalk.blue('Bot: ' + r5.message.substring(0, 200) + '...'));
  
  if (mentionsPrice && mentionsProduct) {
    console.log(chalk.green('✅ Understood "it" refers to a pump and gave price\n'));
  } else {
    console.log(chalk.red('❌ Did not properly resolve "it"\n'));
    allPassed = false;
  }
  
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 6: Switch topic
  console.log(chalk.yellow('6️⃣ Switching topic...'));
  console.log(chalk.gray('User: "Do you offer installation services?"'));
  
  const r6 = await sendMessage(
    'Do you offer installation services?',
    sessionId,
    conversationId
  );
  
  console.log(chalk.blue('Bot: ' + r6.message.substring(0, 150) + '...\n'));
  await new Promise(r => setTimeout(r, 1000));
  
  // Test 7: Return to previous topic
  console.log(chalk.yellow('7️⃣ Returning to previous topic...'));
  console.log(chalk.gray('User: "Back to the pumps - what was the cheapest one?"'));
  
  const r7 = await sendMessage(
    'Back to the pumps - what was the cheapest one?',
    sessionId,
    conversationId
  );
  
  const mentionsPumps = r7.message.toLowerCase().includes('pump');
  const mentionsCheapOrPrice = r7.message.includes('£') || r7.message.toLowerCase().includes('cheap') || r7.message.toLowerCase().includes('price');
  
  console.log(chalk.blue('Bot: ' + r7.message.substring(0, 200) + '...'));
  
  if (mentionsPumps && mentionsCheapOrPrice) {
    console.log(chalk.green('✅ Successfully returned to pump topic and referenced prices\n'));
  } else {
    console.log(chalk.red('❌ Failed to return to previous topic\n'));
    allPassed = false;
  }
  
  // Summary
  console.log(chalk.cyan('=' .repeat(70)));
  console.log(chalk.bold.cyan('VERIFICATION RESULTS:'));
  console.log(chalk.cyan('=' .repeat(70)));
  
  if (allPassed) {
    console.log(chalk.green.bold('\n✅ EXCELLENT! The model has full conversation context'));
    console.log(chalk.green('The AI naturally:'));
    console.log(chalk.green('  • Remembered facts from earlier messages'));
    console.log(chalk.green('  • Resolved pronouns like "it" correctly'));
    console.log(chalk.green('  • Maintained context across topic switches'));
    console.log(chalk.green('  • Referenced previous search results'));
    console.log(chalk.green('\nNo prescriptive instructions needed - the model just works!\n'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  PARTIAL SUCCESS'));
    console.log(chalk.yellow('Some context awareness is working, but not all tests passed.'));
    console.log(chalk.yellow('The conversation history may need investigation.\n'));
  }
}

testConversationContext().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});
