#!/usr/bin/env npx tsx
/**
 * Test search context handling with Cifa products
 * Verify the model can handle large result sets and maintain context
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat';

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
      domain: 'thompsonseparts.co.uk',
    }),
  });
  return response.json();
}

async function testCifaSearchContext() {
  console.log(chalk.bold.cyan('\n🔍 CIFA SEARCH CONTEXT TEST'));
  console.log(chalk.cyan('Testing how the model handles search results and maintains context'));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
  
  const sessionId = uuidv4();
  let conversationId: string | undefined;
  
  try {
    // Test 1: Search for Cifa products
    console.log(chalk.yellow('1️⃣ Searching for Cifa products...'));
    console.log(chalk.gray('User: "Show me all Cifa products you have"'));
    
    const r1 = await sendMessage(
      'Show me all Cifa products you have',
      sessionId
    );
    conversationId = r1.conversation_id;
    
    console.log(chalk.blue('Bot response:'));
    console.log(chalk.blue(r1.message.substring(0, 300) + '...'));
    
    // Check if it mentions a count or range
    const mentionsCount = 
      r1.message.includes('have') && 
      (r1.message.match(/\d+/) || 
       r1.message.toLowerCase().includes('extensive') ||
       r1.message.toLowerCase().includes('wide range') ||
       r1.message.toLowerCase().includes('many'));
    
    console.log(chalk.gray(`\n   Mentions product count/range: ${mentionsCount ? '✅' : '❌'}`));
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 2: Ask about a specific item from the list
    console.log(chalk.yellow('\n2️⃣ Asking about specific item...'));
    console.log(chalk.gray('User: "Tell me more about the hydraulic pump"'));
    
    const r2 = await sendMessage(
      'Tell me more about the hydraulic pump',
      sessionId,
      conversationId
    );
    
    console.log(chalk.blue('Bot response:'));
    console.log(chalk.blue(r2.message.substring(0, 250) + '...'));
    
    const referencesPump = r2.message.toLowerCase().includes('pump') || 
                          r2.message.toLowerCase().includes('hydraulic');
    console.log(chalk.gray(`   References pump from search: ${referencesPump ? '✅' : '❌'}`));
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 3: Switch context - personal info
    console.log(chalk.yellow('\n3️⃣ Switching context...'));
    console.log(chalk.gray('User: "My budget is £3000 and I need it delivered to Manchester"'));
    
    const r3 = await sendMessage(
      'My budget is £3000 and I need it delivered to Manchester',
      sessionId,
      conversationId
    );
    
    console.log(chalk.blue('Bot response:'));
    console.log(chalk.blue(r3.message.substring(0, 200) + '...'));
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 4: Reference both search results AND personal context
    console.log(chalk.yellow('\n4️⃣ Combining search and personal context...'));
    console.log(chalk.gray('User: "Which Cifa products fit my budget?"'));
    
    const r4 = await sendMessage(
      'Which Cifa products fit my budget?',
      sessionId,
      conversationId
    );
    
    console.log(chalk.blue('Bot response:'));
    console.log(chalk.blue(r4.message.substring(0, 250) + '...'));
    
    // Check if it references both contexts
    const referencesBudget = r4.message.includes('3000') || 
                           r4.message.includes('£3') || 
                           r4.message.toLowerCase().includes('budget');
    const referencesCifa = r4.message.toLowerCase().includes('cifa');
    
    console.log(chalk.gray(`   References budget (£3000): ${referencesBudget ? '✅' : '❌'}`));
    console.log(chalk.gray(`   References Cifa products: ${referencesCifa ? '✅' : '❌'}`));
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Test 5: Ask about the count/range again
    console.log(chalk.yellow('\n5️⃣ Testing memory of search scope...'));
    console.log(chalk.gray('User: "How many Cifa items did you find in total?"'));
    
    const r5 = await sendMessage(
      'How many Cifa items did you find in total?',
      sessionId,
      conversationId
    );
    
    console.log(chalk.blue('Bot response:'));
    console.log(chalk.blue(r5.message));
    
    const hasNumber = r5.message.match(/\d+/) !== null;
    const acknowledgesLimit = r5.message.toLowerCase().includes('limit') ||
                            r5.message.toLowerCase().includes('extensive') ||
                            r5.message.toLowerCase().includes('many') ||
                            r5.message.toLowerCase().includes('range');
    
    console.log(chalk.gray(`   Provides count or acknowledges range: ${(hasNumber || acknowledgesLimit) ? '✅' : '❌'}`));
    
    // Summary
    console.log(chalk.cyan('\n' + '=' .repeat(70)));
    console.log(chalk.bold.cyan('TEST SUMMARY:'));
    console.log(chalk.cyan('=' .repeat(70)));
    
    const allGood = mentionsCount && referencesPump && referencesBudget && referencesCifa && (hasNumber || acknowledgesLimit);
    
    if (allGood) {
      console.log(chalk.green.bold('\n✅ EXCELLENT! The model:'));
      console.log(chalk.green('  • Handled search results appropriately'));
      console.log(chalk.green('  • Maintained conversation context across topics'));
      console.log(chalk.green('  • Combined search context with personal info'));
      console.log(chalk.green('  • Remembered the scope of search results\n'));
    } else {
      console.log(chalk.yellow.bold('\n⚠️  MIXED RESULTS:'));
      if (!mentionsCount) console.log(chalk.yellow('  • Did not mention product count/range initially'));
      if (!referencesPump) console.log(chalk.yellow('  • Lost context of pump from search'));
      if (!referencesBudget) console.log(chalk.yellow('  • Forgot the £3000 budget'));
      if (!referencesCifa) console.log(chalk.yellow('  • Did not reference Cifa products'));
      if (!hasNumber && !acknowledgesLimit) console.log(chalk.yellow('  • Could not recall search scope'));
      console.log('');
    }
    
  } catch (error) {
    console.error(chalk.red('Error:'), error);
  }
}

testCifaSearchContext().catch(console.error);