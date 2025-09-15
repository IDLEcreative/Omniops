// Comprehensive test to understand AI response patterns
import fetch from 'node-fetch';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testChat(testName, domain, message) {
  const sessionId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        domain,
        session_id: sessionId,
        conversationId
      }),
    });

    const data = await response.json();
    
    if (data.message) {
      // Analyze response
      const hasProducts = data.message.includes('Cifa Mixer') && 
                         (data.message.includes('http') || data.message.includes('www'));
      const asksQuestion = data.message.includes('Which') || 
                          data.message.includes('Do you know') || 
                          data.message.includes('model') ||
                          data.message.includes('part number');
      
      console.log(`${testName}:`);
      console.log(`  Domain: ${domain}`);
      console.log(`  Message: "${message}"`);
      console.log(`  Response preview: ${data.message.substring(0, 150)}...`);
      console.log(`  ✅ Shows products: ${hasProducts}`);
      console.log(`  ❓ Asks questions: ${asksQuestion}`);
      console.log(`  Session: ${sessionId}`);
      return { hasProducts, asksQuestion, response: data.message };
    } else {
      console.log(`${testName}: ERROR - ${data.error || 'No message'}`);
      return { hasProducts: false, asksQuestion: false, error: true };
    }
  } catch (error) {
    console.log(`${testName}: EXCEPTION - ${error.message}`);
    return { hasProducts: false, asksQuestion: false, error: true };
  }
}

async function runTests() {
  console.log('=== COMPREHENSIVE CHAT API TESTING ===\n');
  console.log('Testing to understand when AI shows products vs asks questions\n');
  
  const results = {
    localhost: { products: 0, questions: 0, errors: 0 },
    thompsonseparts: { products: 0, questions: 0, errors: 0 }
  };
  
  // Test 1: localhost domain (5 times)
  console.log('--- Testing with domain: localhost ---\n');
  for (let i = 1; i <= 5; i++) {
    const result = await testChat(
      `Test ${i} (localhost)`,
      'localhost',
      'Need a pump for my Cifa mixer'
    );
    
    if (result.error) results.localhost.errors++;
    else if (result.hasProducts) results.localhost.products++;
    if (result.asksQuestion) results.localhost.questions++;
    
    console.log('');
    await sleep(1500);
  }
  
  console.log('\n--- Testing with domain: thompsonseparts.co.uk ---\n');
  // Test 2: thompsonseparts.co.uk domain (5 times)  
  for (let i = 1; i <= 5; i++) {
    const result = await testChat(
      `Test ${i} (thompsonseparts)`,
      'thompsonseparts.co.uk',
      'Need a pump for my Cifa mixer'
    );
    
    if (result.error) results.thompsonseparts.errors++;
    else if (result.hasProducts) results.thompsonseparts.products++;
    if (result.asksQuestion) results.thompsonseparts.questions++;
    
    console.log('');
    await sleep(1500);
  }
  
  // Summary
  console.log('\n=== RESULTS SUMMARY ===\n');
  console.log('localhost domain:');
  console.log(`  - Showed products: ${results.localhost.products}/5`);
  console.log(`  - Asked questions: ${results.localhost.questions}/5`);
  console.log(`  - Errors: ${results.localhost.errors}/5`);
  
  console.log('\nthompsonseparts.co.uk domain:');
  console.log(`  - Showed products: ${results.thompsonseparts.products}/5`);
  console.log(`  - Asked questions: ${results.thompsonseparts.questions}/5`);
  console.log(`  - Errors: ${results.thompsonseparts.errors}/5`);
  
  console.log('\n=== ANALYSIS ===');
  if (results.localhost.products === 5 && results.thompsonseparts.products === 5) {
    console.log('✅ CONSISTENT: Always shows products');
  } else if (results.localhost.questions > 0 || results.thompsonseparts.questions > 0) {
    console.log('⚠️  INCONSISTENT: Sometimes asks questions even when products are found');
    console.log('This suggests the AI model is not consistently using the RAG context');
  }
}

runTests().catch(console.error);