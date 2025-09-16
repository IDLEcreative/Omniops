/**
 * Quick Customer Service Test
 * Simplified test to verify the AI agent meets basic customer service standards
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

interface QuickTest {
  name: string;
  query: string;
  expectedKeywords: string[];
  shouldNotContain: string[];
}

async function testChatAPI(query: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/chat-optimized', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: 'test-session-' + Date.now(),
        domain: 'test.example.com',
        stream: false  // Disable streaming for this test
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      const error = await response.text();
      return `Error ${response.status}: ${error.substring(0, 100)}`;
    }

    const data = await response.json();
    return data.content || data.message || 'No response';
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Unknown'}`;
  }
}

async function runQuickTests() {
  console.log('🧪 Quick Customer Service Test\n');
  console.log('=' .repeat(50));
  
  const tests: QuickTest[] = [
    {
      name: '1. General Inquiry - Business Hours',
      query: 'What are your business hours?',
      expectedKeywords: ['hours', 'open', 'Monday', 'Friday', 'Saturday', 'Sunday'],
      shouldNotContain: ['verification', 'email required', 'cannot help']
    },
    {
      name: '2. Product Search',  
      query: 'Do you sell hydraulic pumps?',
      expectedKeywords: ['pump', 'hydraulic', 'available', 'products'],
      shouldNotContain: ['verification needed', 'login required']
    },
    {
      name: '3. Order Tracking (Unverified)',
      query: 'I need to track my order',
      expectedKeywords: ['help', 'track', 'order', 'email', 'number'],
      shouldNotContain: ['cannot access', 'unable to help', 'no access']
    },
    {
      name: '4. Customer Verification',
      query: 'My email is test@example.com, can you show me my orders?',
      expectedKeywords: ['email', 'orders', 'test@example.com'],
      shouldNotContain: ['cannot find', 'error']
    },
    {
      name: '5. Problem Resolution',
      query: 'I have a problem with my order #12345',
      expectedKeywords: ['help', 'order', '12345', 'email', 'verification'],
      shouldNotContain: ['go away', 'not my problem']
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    console.log(`\n📋 ${test.name}`);
    console.log(`   Query: "${test.query}"`);
    
    const startTime = Date.now();
    const response = await testChatAPI(test.query);
    const timeTaken = Date.now() - startTime;
    
    // Truncate response for display
    const displayResponse = response.length > 150 
      ? response.substring(0, 150) + '...'
      : response;
    console.log(`   Response: "${displayResponse}"`);
    console.log(`   Time: ${timeTaken}ms`);
    
    // Check response quality
    const responseLower = response.toLowerCase();
    let score = 0;
    let issues = [];
    
    // Check for expected keywords
    for (const keyword of test.expectedKeywords) {
      if (responseLower.includes(keyword.toLowerCase())) {
        score++;
      } else {
        issues.push(`Missing: "${keyword}"`);
      }
    }
    
    // Check for problematic phrases
    for (const badPhrase of test.shouldNotContain) {
      if (responseLower.includes(badPhrase.toLowerCase())) {
        issues.push(`❌ Contains: "${badPhrase}"`);
        score--;
      }
    }
    
    const percentage = (score / test.expectedKeywords.length) * 100;
    const testPassed = percentage >= 60 && !response.startsWith('Error');
    
    if (testPassed) {
      console.log(`   Result: ✅ PASSED (${percentage.toFixed(0)}%)`);
      passed++;
    } else {
      console.log(`   Result: ❌ FAILED (${percentage.toFixed(0)}%)`);
      if (issues.length > 0) {
        console.log(`   Issues: ${issues.slice(0, 2).join(', ')}`);
      }
      failed++;
    }
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESULTS SUMMARY');
  console.log('=' .repeat(50));
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed} (${((passed/tests.length)*100).toFixed(0)}%)`);
  console.log(`Failed: ${failed}`);
  
  const passRate = (passed / tests.length) * 100;
  console.log('\n🎯 VERDICT:');
  if (passRate >= 80) {
    console.log('✅ GOOD: Agent meets basic customer service standards');
  } else if (passRate >= 60) {
    console.log('⚠️  ADEQUATE: Agent needs some improvement');
  } else {
    console.log('❌ NEEDS WORK: Agent requires significant improvement');
  }
  
  console.log('\n' + '=' .repeat(50));
}

// Run tests
runQuickTests().catch(console.error);