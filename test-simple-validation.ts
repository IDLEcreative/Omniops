#!/usr/bin/env npx tsx
/**
 * SIMPLE VALIDATION: Is the system finding products?
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';

// Real customer questions
const questions = [
  "Do you have hydraulic pumps?",
  "What chainsaw parts do you sell?",
  "I need parts for a CAT excavator"
];

async function testQuestion(question: string) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: question,
      domain: 'thompsonseparts.co.uk',
      session_id: 'test-' + Date.now(),
      conversationId: 'conv-' + Date.now()
    })
  });
  
  const data = await response.json();
  return data.message || '';
}

async function main() {
  console.log('🎯 VALIDATION TEST: Are we finding real products?\n');
  console.log('=' .repeat(70) + '\n');
  
  let successCount = 0;
  
  for (const question of questions) {
    console.log(`❓ ${question}`);
    
    const answer = await testQuestion(question);
    
    // Check if we found actual products
    const hasProducts = answer.includes('/product/');
    const hasMultiple = (answer.match(/product\//g) || []).length > 2;
    const isSpecific = answer.includes('Hyva') || answer.includes('STIHL') || answer.includes('EDBRO');
    
    if (hasProducts) {
      console.log(`✅ Found ${(answer.match(/product\//g) || []).length} products!`);
      if (hasMultiple) console.log('   → Multiple options provided');
      if (isSpecific) console.log('   → Specific brands/models mentioned');
      successCount++;
    } else {
      console.log('❌ No products found');
    }
    
    console.log();
  }
  
  console.log('=' .repeat(70));
  console.log(`\n📊 RESULT: ${successCount}/${questions.length} questions found products`);
  
  if (successCount === questions.length) {
    console.log('✅ SYSTEM IS WORKING! Finding specific products for customers.');
  } else if (successCount > 0) {
    console.log('⚠️ PARTIAL SUCCESS: Some queries finding products.');
  } else {
    console.log('❌ NOT WORKING: Unable to find products.');
  }
}

main().catch(console.error);
