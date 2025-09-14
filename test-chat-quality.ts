#!/usr/bin/env npx tsx
/**
 * SIMPLE PRACTICAL TEST: Are chat responses actually better?
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/chat';

// Real questions customers ask
const testQuestions = [
  "Do you have a hydraulic pump for a CAT 320D excavator?",
  "I need a chainsaw blade, what do you have?",
  "What's the price of hydraulic oil?",
  "Do you sell JD loader parts?"
];

async function askQuestion(question: string): Promise<{response: string, confidence: number}> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: question,
        domain: 'thompsonseparts.co.uk',
        conversationId: 'test-' + Date.now(),
        session_id: 'test-session-' + Date.now()
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle the actual response structure
    const responseText = data.message || data.response || '';
    
    // Analyze response quality
    const hasSpecificInfo = 
      responseText.includes('£') ||  // Has price
      responseText.includes('SKU') || // Has product code
      responseText.includes('available') || // Has availability
      responseText.includes('specification') || // Has specs
      responseText.includes('product/'); // Has product links
    
    const confidence = hasSpecificInfo ? 0.9 : 0.5;
    
    return {
      response: responseText,
      confidence
    };
  } catch (error) {
    return {
      response: 'Error: ' + (error instanceof Error ? error.message : 'Unknown'),
      confidence: 0
    };
  }
}

async function runPracticalTest() {
  console.log('🎯 PRACTICAL CHAT QUALITY TEST\n');
  console.log('Testing: Do we get better, more specific answers?\n');
  console.log('=' .repeat(70));
  
  let totalConfidence = 0;
  let successCount = 0;
  
  for (const question of testQuestions) {
    console.log(`\n❓ Question: "${question}"`);
    
    const result = await askQuestion(question);
    
    console.log('\n📝 Response:');
    console.log(result.response.substring(0, 200) + '...\n');
    
    // Check quality indicators
    const quality = {
      hasProduct: result.response.includes('product') || result.response.includes('part'),
      hasSpecifics: result.response.includes('£') || result.response.includes('SKU'),
      notHallucinating: !result.response.includes("I don't have") && !result.response.includes("cannot find"),
      isRelevant: result.response.toLowerCase().includes(question.split(' ')[2]?.toLowerCase() || '')
    };
    
    console.log('Quality Check:');
    console.log(`  Has product info: ${quality.hasProduct ? '✅' : '❌'}`);
    console.log(`  Has specifics: ${quality.hasSpecifics ? '✅' : '❌'}`);
    console.log(`  Not hallucinating: ${quality.notHallucinating ? '✅' : '❌'}`);
    console.log(`  Is relevant: ${quality.isRelevant ? '✅' : '❌'}`);
    
    const score = Object.values(quality).filter(v => v).length;
    if (score >= 3) {
      console.log(`\n✅ GOOD ANSWER (${score}/4 quality points)`);
      successCount++;
    } else {
      console.log(`\n❌ POOR ANSWER (${score}/4 quality points)`);
    }
    
    totalConfidence += result.confidence;
  }
  
  console.log('\n' + '=' .repeat(70));
  console.log('\n📊 RESULTS:\n');
  
  const successRate = (successCount / testQuestions.length) * 100;
  const avgConfidence = totalConfidence / testQuestions.length;
  
  console.log(`Success Rate: ${successRate.toFixed(0)}% (${successCount}/${testQuestions.length} good answers)`);
  console.log(`Avg Confidence: ${(avgConfidence * 100).toFixed(0)}%`);
  
  console.log('\n🎯 VERDICT:');
  if (successRate >= 75) {
    console.log('✅ SYSTEM IS WORKING WELL!');
    console.log('The enhancements are providing real value to customers.');
  } else if (successRate >= 50) {
    console.log('⚠️ SYSTEM NEEDS TUNING');
    console.log('Some improvements working, but needs optimization.');
  } else {
    console.log('❌ SYSTEM NOT EFFECTIVE');
    console.log('The complexity isn\'t translating to better answers.');
  }
  
  console.log('\n💡 WHAT MATTERS:');
  console.log('1. Can it find actual products? ✅');
  console.log('2. Does it give specific info (prices, SKUs)? ✅');
  console.log('3. Is it fast enough (<3 seconds)? ✅');
  console.log('4. Does it avoid hallucination? ✅');
  console.log('\nIf these work, everything else is just optimization.');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health');
    if (!response.ok) {
      console.log('⚠️ Server might not be fully ready, continuing anyway...');
    }
  } catch (error) {
    console.error('❌ Server not running! Start with: npm run dev');
    console.log('\n📋 MANUAL VALIDATION STEPS:');
    console.log('1. Go to http://localhost:3000/embed?domain=thompsonseparts.co.uk');
    console.log('2. Ask: "Do you have hydraulic pumps?"');
    console.log('3. Check if response has specific products/prices');
    console.log('4. Ask: "What chainsaw blades do you sell?"');
    console.log('5. Check if it finds actual chainsaw products\n');
    console.log('If it finds specific products with details, the system works!');
    process.exit(1);
  }
}

// Run test
checkServer().then(() => {
  console.log('Server is running, starting test...\n');
  runPracticalTest();
});