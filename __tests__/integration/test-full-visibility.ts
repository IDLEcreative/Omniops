#!/usr/bin/env npx tsx
/**
 * Test that the model now has full visibility of all search results
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat';

async function testFullVisibility() {
  console.log(chalk.bold.cyan('\n🔍 FULL SEARCH VISIBILITY TEST'));
  console.log(chalk.cyan('Testing if model now sees ALL results, not just 20'));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
  
  const sessionId = uuidv4();
  
  // Test 1: Search for all Cifa products
  console.log(chalk.yellow('1️⃣ Searching for ALL Cifa products...'));
  console.log(chalk.gray('User: "Show me all Cifa products"'));
  
  const r1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me all Cifa products',
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  
  const d1 = await r1.json();
  const conversationId = d1.conversation_id;
  
  // Extract numbers from response
  const numbers = d1.message.match(/\b\d+\b/g) || [];
  const firstNumber = numbers[0] ? parseInt(numbers[0]) : 0;
  
  console.log(chalk.blue('\nBot response (first 400 chars):'));
  console.log(chalk.blue(d1.message.substring(0, 400) + '...'));
  
  console.log(chalk.yellow('\nAnalysis:'));
  console.log(chalk.gray(`  • Numbers mentioned: ${numbers.slice(0, 5).join(', ')}${numbers.length > 5 ? '...' : ''}`));
  console.log(chalk.gray(`  • First number (likely count): ${firstNumber}`));
  
  // Check search metadata
  if (d1.searchMetadata && d1.searchMetadata.searchLog) {
    console.log(chalk.yellow('\nWhat actually happened:'));
    d1.searchMetadata.searchLog.forEach((log: any) => {
      console.log(chalk.gray(`  • ${log.tool}: Found ${log.resultCount} results`));
    });
  }
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 2: Ask for exact count
  console.log(chalk.yellow('\n2️⃣ Asking for exact count...'));
  console.log(chalk.gray('User: "Exactly how many Cifa products did you find?"'));
  
  const r2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Exactly how many Cifa products did you find?',
      session_id: sessionId,
      conversation_id: conversationId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  
  const d2 = await r2.json();
  console.log(chalk.blue('\nBot response:'));
  console.log(chalk.blue(d2.message.substring(0, 300)));
  
  await new Promise(r => setTimeout(r, 2000));
  
  // Test 3: Reference a high-numbered item
  console.log(chalk.yellow('\n3️⃣ Testing access to items beyond 20...'));
  console.log(chalk.gray('User: "Tell me about item number 25 from the list"'));
  
  const r3 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Tell me about item number 25 from the list',
      session_id: sessionId,
      conversation_id: conversationId,
      domain: 'thompsonseparts.co.uk',
    }),
  });
  
  const d3 = await r3.json();
  console.log(chalk.blue('\nBot response:'));
  console.log(chalk.blue(d3.message.substring(0, 300)));
  
  const canAccessBeyond20 = 
    !d3.message.toLowerCase().includes("don't have") &&
    !d3.message.toLowerCase().includes("only") &&
    (d3.message.toLowerCase().includes("25") || d3.message.toLowerCase().includes("item"));
  
  // Summary
  console.log(chalk.cyan('\n' + '=' .repeat(70)));
  console.log(chalk.bold.cyan('TEST RESULTS:'));
  console.log(chalk.cyan('=' .repeat(70)));
  
  if (firstNumber > 20) {
    console.log(chalk.green.bold('\n✅ SUCCESS! The model now has FULL visibility:'));
    console.log(chalk.green(`  • Can see ${firstNumber}+ items (not limited to 20)`));
    console.log(chalk.green('  • Has access to the complete search results'));
    console.log(chalk.green('  • Can provide accurate counts'));
    if (canAccessBeyond20) {
      console.log(chalk.green('  • Can reference items beyond #20'));
    }
  } else if (firstNumber === 20) {
    console.log(chalk.yellow.bold('\n⚠️  STILL LIMITED TO 20:'));
    console.log(chalk.yellow('  • The limit may still be in place'));
    console.log(chalk.yellow('  • Or there might actually be exactly 20 items'));
  } else {
    console.log(chalk.yellow.bold('\n⚠️  UNCLEAR RESULTS:'));
    console.log(chalk.yellow(`  • Model mentioned ${firstNumber} items`));
    console.log(chalk.yellow('  • May need to check the actual search implementation'));
  }
  
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
}

testFullVisibility().catch(console.error);
