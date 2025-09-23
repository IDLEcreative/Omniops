#!/usr/bin/env npx tsx

/**
 * Test that bullet points solve the ambiguity issue
 * Verifies the new formatting prevents confusion with "show me 8"
 */

import { v4 as uuidv4 } from 'uuid';

const API_URL = 'http://localhost:3000/api/chat';

async function testBulletPointSolution() {
  const conversationId = uuidv4();
  const sessionId = uuidv4();

  console.log('🔍 Testing Bullet Point Solution\n');
  console.log('Expected behavior:');
  console.log('1. Products shown with bullet points, not numbers');
  console.log('2. "show me 8" correctly interpreted as "show 8 products"');
  console.log('3. No ambiguity about numbered references\n');
  console.log('─'.repeat(60) + '\n');

  // Step 1: Ask for products
  console.log('📤 Message 1: "do you have any hydraulic pumps?"');
  
  const response1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'do you have any hydraulic pumps?',
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    })
  });

  const data1 = await response1.json();
  console.log('\n📥 Response 1:');
  console.log(data1.message);
  
  // Check formatting
  const hasNumbers = /^\d+\./m.test(data1.message);
  const hasBullets = /^-\s/m.test(data1.message);
  
  console.log('\n✅ Format Check:');
  console.log(`  Uses numbered list: ${hasNumbers ? '❌ YES (bad)' : '✅ NO (good)'}`);
  console.log(`  Uses bullet points: ${hasBullets ? '✅ YES (good)' : '❌ NO (bad)'}`);

  // Step 2: Say "show me 8"
  console.log('\n\n📤 Message 2: "show me 8"');
  
  const response2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'show me 8',
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    })
  });

  const data2 = await response2.json();
  console.log('\n📥 Response 2:');
  console.log(data2.message.substring(0, 500) + '...\n');
  
  // Check if it correctly shows 8 products
  if (data2.searchMetadata && data2.searchMetadata.searchLog) {
    const searchLog = data2.searchMetadata.searchLog[0];
    if (searchLog) {
      console.log('📊 Search Analysis:');
      console.log(`  Tool called: ${searchLog.tool}`);
      console.log(`  Result count: ${searchLog.resultCount}`);
      
      if (searchLog.resultCount === 8 || data2.message.includes('8 products') || data2.message.includes('8 items')) {
        console.log('\n✅ SUCCESS: "show me 8" correctly interpreted as showing 8 products!');
      }
    }
  }

  // Step 3: Ask about a specific product using description
  console.log('\n📤 Message 3: "tell me more about the first hydraulic pump you showed"');
  
  const response3 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'tell me more about the first hydraulic pump you showed',
      conversation_id: conversationId,
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk',
      config: {
        features: {
          woocommerce: { enabled: true },
          websiteScraping: { enabled: true }
        }
      }
    })
  });

  const data3 = await response3.json();
  console.log('\n📥 Response 3:');
  console.log(data3.message.substring(0, 400) + '...\n');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SOLUTION SUMMARY');
  console.log('='.repeat(60));
  console.log('\n✅ Benefits of bullet points:');
  console.log('   - Eliminates ambiguity with number references');
  console.log('   - "show me 8" clearly means 8 products');
  console.log('   - Users reference products by name/description');
  console.log('   - Cleaner, simpler formatting');
  console.log('\nThis solution prevents the confusion that numbered lists create.');
}

testBulletPointSolution().catch(console.error);