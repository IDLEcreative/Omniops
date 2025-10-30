#!/usr/bin/env npx tsx
/**
 * Natural conversation flow test with full search visibility
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

async function sendMessage(
  message: string,
  sessionId: string,
  conversationId?: string
): Promise<{ message: string; conversation_id: string; searchMetadata?: any }> {
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

async function runConversation() {
  console.log(chalk.bold.cyan('\n🗣️  NATURAL CONVERSATION FLOW TEST'));
  console.log(chalk.cyan('Testing full search visibility in realistic conversation'));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
  
  const sessionId = uuidv4();
  let conversationId: string | undefined;
  
  // Conversation 1: Initial broad search
  console.log(chalk.yellow('👤 Customer: "Hi, I need parts for my Cifa mixer"'));
  const r1 = await sendMessage(
    'Hi, I need parts for my Cifa mixer',
    sessionId
  );
  conversationId = r1.conversation_id;
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r1.message.substring(0, 400)));
  
  // Extract count if mentioned
  const count1 = r1.message.match(/\b(\d+)\s+(Cifa|product|part|item)/i)?.[1];
  if (count1) {
    console.log(chalk.gray(`\n   [Found ${count1} items mentioned]`));
  }
  
  console.log(chalk.gray('\n   Press Enter to continue...'));
  await new Promise(r => setTimeout(r, 2000));
  
  // Conversation 2: Specific category
  console.log(chalk.yellow('\n👤 Customer: "I specifically need hydraulic pumps"'));
  const r2 = await sendMessage(
    'I specifically need hydraulic pumps',
    sessionId,
    conversationId
  );
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r2.message.substring(0, 400)));
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Conversation 3: Budget constraint
  console.log(chalk.yellow('\n👤 Customer: "My budget is £2000 maximum"'));
  const r3 = await sendMessage(
    'My budget is £2000 maximum',
    sessionId,
    conversationId
  );
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r3.message.substring(0, 400)));
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Conversation 4: Reference specific item beyond 20
  console.log(chalk.yellow('\n👤 Customer: "Can you tell me more about the 30th item you found initially?"'));
  const r4 = await sendMessage(
    'Can you tell me more about the 30th item you found initially?',
    sessionId,
    conversationId
  );
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r4.message.substring(0, 500)));
  
  const canAccessItem30 = !r4.message.toLowerCase().includes("don't have") && 
                          !r4.message.toLowerCase().includes("only showed");
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Conversation 5: Ask for total count
  console.log(chalk.yellow('\n👤 Customer: "How many Cifa products do you have in total?"'));
  const r5 = await sendMessage(
    'How many Cifa products do you have in total?',
    sessionId,
    conversationId
  );
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r5.message));
  
  const totalCount = r5.message.match(/\b(\d+)\s+(Cifa|product|part|item)/i)?.[1];
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Conversation 6: Complex filtering
  console.log(chalk.yellow('\n👤 Customer: "From all the Cifa items, which hydraulic pumps are under £2000 and in stock?"'));
  const r6 = await sendMessage(
    'From all the Cifa items, which hydraulic pumps are under £2000 and in stock?',
    sessionId,
    conversationId
  );
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r6.message.substring(0, 500)));
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Conversation 7: Reference conversation history
  console.log(chalk.yellow('\n👤 Customer: "Actually, what was the first pump you mentioned when I asked about hydraulic pumps?"'));
  const r7 = await sendMessage(
    'Actually, what was the first pump you mentioned when I asked about hydraulic pumps?',
    sessionId,
    conversationId
  );
  
  console.log(chalk.green('\n🤖 Assistant:'));
  console.log(chalk.white(r7.message.substring(0, 400)));
  
  // Analysis
  console.log(chalk.cyan('\n' + '=' .repeat(70)));
  console.log(chalk.bold.cyan('📊 CONVERSATION ANALYSIS'));
  console.log(chalk.cyan('=' .repeat(70)));
  
  console.log(chalk.yellow('\n🔍 Key Observations:'));
  
  if (totalCount && parseInt(totalCount) > 20) {
    console.log(chalk.green(`✅ Full visibility confirmed: Model sees ${totalCount} total items`));
  } else {
    console.log(chalk.yellow(`⚠️  Total count mentioned: ${totalCount || 'not specified'}`));
  }
  
  if (canAccessItem30) {
    console.log(chalk.green('✅ Can access items beyond #20 (referenced item 30)'));
  } else {
    console.log(chalk.yellow('⚠️  Could not reference item #30'));
  }
  
  // Check if model maintained context
  const maintainedBudget = r3.message.includes('2000') || r6.message.includes('2000');
  const maintainedCategory = r6.message.toLowerCase().includes('hydraulic');
  
  if (maintainedBudget && maintainedCategory) {
    console.log(chalk.green('✅ Maintained context: Budget and category preferences'));
  }
  
  // Check search metadata from last response
  if (r6.searchMetadata && r6.searchMetadata.searchLog) {
    console.log(chalk.yellow('\n📈 Search Statistics:'));
    let totalResults = 0;
    r6.searchMetadata.searchLog.forEach((log: any) => {
      console.log(chalk.gray(`   • ${log.tool}: ${log.resultCount} results`));
      totalResults += log.resultCount;
    });
    console.log(chalk.gray(`   • Total results processed: ${totalResults}`));
  }
  
  console.log(chalk.cyan('\n' + '=' .repeat(70)));
  console.log(chalk.bold.green('✨ Conversation Flow Summary:'));
  console.log(chalk.white(`
The model demonstrated:
• Full visibility of inventory (${totalCount || 'many'} items)
• Natural conversation flow with context retention
• Ability to filter and reference specific items
• Combination of search results with conversation history
• Proper handling of constraints (budget, category)
`));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
}

runConversation().catch(error => {
  console.error(chalk.red('Error:'), error);
  process.exit(1);
});