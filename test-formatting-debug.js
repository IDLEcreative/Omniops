#!/usr/bin/env node

/**
 * Debug test to check exact formatting of chat responses
 */

const API_URL = 'http://localhost:3000/api/chat';

async function testQuery(message) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        session_id: 'test-format-' + Date.now(),
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true },
            woocommerce: { enabled: true }
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
}

async function runTest() {
  console.log('Testing exact formatting of chat responses...\n');
  console.log('=' .repeat(80));
  
  const response = await testQuery('Need a pump for my Cifa mixer');
  
  if (response) {
    console.log('\n📝 Raw JSON response:');
    console.log(JSON.stringify(response.message));
    
    console.log('\n📝 Actual output (as it appears):');
    console.log(response.message);
    
    console.log('\n📝 Character analysis:');
    // Check for newlines
    const newlineCount = (response.message.match(/\n/g) || []).length;
    console.log(`- Newline characters (\\n): ${newlineCount}`);
    
    // Check for bullet points
    const bulletCount = (response.message.match(/•/g) || []).length;
    console.log(`- Bullet points (•): ${bulletCount}`);
    
    // Check spacing around bullets
    console.log('\n📝 Bullet point context (20 chars before and after each):');
    const bulletPositions = [];
    let pos = response.message.indexOf('•');
    while (pos !== -1) {
      bulletPositions.push(pos);
      pos = response.message.indexOf('•', pos + 1);
    }
    
    bulletPositions.forEach((pos, i) => {
      const start = Math.max(0, pos - 20);
      const end = Math.min(response.message.length, pos + 21);
      const context = response.message.substring(start, end);
      const escaped = JSON.stringify(context);
      console.log(`  Bullet ${i + 1}: ${escaped}`);
    });
    
    // Check if bullets are separated by newlines
    console.log('\n📝 Bullet separation check:');
    for (let i = 0; i < bulletPositions.length - 1; i++) {
      const between = response.message.substring(bulletPositions[i], bulletPositions[i + 1]);
      const hasNewlines = between.includes('\n');
      console.log(`  Between bullet ${i + 1} and ${i + 2}: ${hasNewlines ? '✅ Has newlines' : '❌ No newlines'}`);
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

runTest().catch(console.error);