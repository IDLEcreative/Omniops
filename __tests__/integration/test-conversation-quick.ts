/**
 * Quick abbreviated version of conversation suite test
 * Tests just a few key scenarios to avoid timeout
 */

const API_URL = 'http://localhost:3000/api/chat';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
}

const results: TestResult[] = [];

async function testMultiTurnContext() {
  console.log('\n📝 Test 1: Multi-turn Context Retention');
  console.log('-'.repeat(60));

  const sessionId = `test-${Date.now()}`;
  let conversationId: string | undefined;

  try {
    // Turn 1
    const r1 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What pumps do you have for concrete mixers?",
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk'
      })
    });
    const d1 = await r1.json();
    conversationId = d1.conversation_id;
    console.log('Turn 1:', d1.message.substring(0, 100) + '...');

    // Turn 2 - reference to previous
    await new Promise(r => setTimeout(r, 1000));
    const r2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "What about the hydraulic ones?",
        conversation_id: conversationId,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk'
      })
    });
    const d2 = await r2.json();
    console.log('Turn 2:', d2.message.substring(0, 100) + '...');

    const maintainedContext = d2.message.toLowerCase().includes('pump') ||
                              d2.message.toLowerCase().includes('hydraulic');

    if (maintainedContext) {
      console.log('✅ PASS - Context maintained across turns');
      results.push({ name: 'Multi-turn Context', passed: true, message: 'Maintained context' });
    } else {
      console.log('❌ FAIL - Lost context');
      results.push({ name: 'Multi-turn Context', passed: false, message: 'Context lost' });
    }

  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : 'Unknown');
    results.push({ name: 'Multi-turn Context', passed: false, message: 'Test error' });
  }
}

async function testComplexOrdering() {
  console.log('\n📝 Test 2: Order Inquiry');
  console.log('-'.repeat(60));

  const sessionId = `test-${Date.now()}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "I need to check my order 120876",
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk'
      })
    });

    const data = await response.json();
    console.log('Response:', data.message.substring(0, 150) + '...');

    const foundOrder = data.message.includes('120876') &&
                      (data.message.includes('Status') || data.message.includes('Order'));

    if (foundOrder) {
      console.log('✅ PASS - Order lookup working');
      results.push({ name: 'Order Inquiry', passed: true, message: 'Found order details' });
    } else {
      console.log('❌ FAIL - Order not found');
      results.push({ name: 'Order Inquiry', passed: false, message: 'Order lookup failed' });
    }

  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : 'Unknown');
    results.push({ name: 'Order Inquiry', passed: false, message: 'Test error' });
  }
}

async function testSearchFirst() {
  console.log('\n📝 Test 3: Search-First Behavior');
  console.log('-'.repeat(60));

  const sessionId = `test-${Date.now()}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "sheet motor",
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk'
      })
    });

    const data = await response.json();
    console.log('Response:', data.message.substring(0, 100) + '...');

    const searchMetadata = data.searchMetadata;
    const didSearch = searchMetadata && searchMetadata.totalSearches > 0;

    if (didSearch) {
      console.log('✅ PASS - AI searched first (found', searchMetadata.totalSearches, 'searches)');
      results.push({ name: 'Search-First', passed: true, message: `${searchMetadata.totalSearches} searches performed` });
    } else {
      console.log('❌ FAIL - AI did not search');
      results.push({ name: 'Search-First', passed: false, message: 'No search performed' });
    }

  } catch (error) {
    console.log('❌ ERROR:', error instanceof Error ? error.message : 'Unknown');
    results.push({ name: 'Search-First', passed: false, message: 'Test error' });
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 QUICK CONVERSATION TEST SUITE');
  console.log('='.repeat(60));

  await testMultiTurnContext();
  await testComplexOrdering();
  await testSearchFirst();

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESULTS SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach((r, i) => {
    const status = r.passed ? '✅' : '❌';
    console.log(`${i + 1}. ${status} ${r.name}: ${r.message}`);
  });

  console.log(`\nTotal: ${passed}/${total} (${((passed/total)*100).toFixed(0)}%)`);
  console.log('='.repeat(60) + '\n');
}

runTests().catch(console.error);
