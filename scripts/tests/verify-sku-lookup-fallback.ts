/**
 * Manual Integration Test: SKU Lookup Fallback Message
 *
 * Tests the exact scenario from conversation analysis:
 * User provides SKU "MU110667601" that doesn't exist in catalog,
 * expecting helpful context-aware fallback (NOT "try asking more specifically")
 *
 * REQUIREMENTS:
 * - Dev server must be running (npm run dev)
 * - Redis must be running
 * - Supabase connection configured
 *
 * Usage:
 *   npx tsx scripts/tests/verify-sku-lookup-fallback.ts
 */

interface ChatResponse {
  success: boolean;
  message?: string;
  conversationId?: string;
  error?: string;
}

const CHAT_ENDPOINT = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'thompsonseparts.co.uk'; // Correct Thompson's domain from database
const TEST_SKU = 'NONEXISTENT-SKU-99999'; // Using non-existent SKU to trigger fallback

async function testSKULookupFallback(): Promise<void> {
  console.log('🧪 Testing SKU Lookup Fallback Message\n');
  console.log('Scenario: User provides non-existent SKU with maxIterations=1');
  console.log(`SKU: ${TEST_SKU}`);
  console.log(`Domain: ${TEST_DOMAIN}`);
  console.log('Config: maxSearchIterations = 1 (force immediate fallback)\n');

  try {
    const requestBody = {
      message: TEST_SKU,
      domain: TEST_DOMAIN,
      session_id: `test-${Date.now()}`,
      config: {
        ai: {
          maxSearchIterations: 1, // Force maxIterations to trigger immediately
        },
      },
    };

    console.log('📤 Sending chat request...');
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    console.log();

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Error response:', errorBody);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: any = await response.json();

    if (!data.message) {
      console.error('❌ FAILED: No message in response');
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    const message = data.message;
    console.log('📥 Response received:\n');
    console.log('━'.repeat(60));
    console.log(message);
    console.log('━'.repeat(60));
    console.log();

    // Validation checks - verify helpful, context-aware response
    const checks = {
      '✅ Should NOT contain old generic message': !message.includes('try asking more specifically') && !message.includes('I need more time to gather'),
      '✅ Should mention the specific SKU': message.includes(TEST_SKU),
      '✅ Should provide actionable alternatives': (
        message.includes('photo') ||
        message.includes('link') ||
        message.includes('product page') ||
        message.includes('product name') ||
        message.includes('send') ||
        message.includes('provide')
      ),
      '✅ Should offer multiple options': (
        (message.match(/option/gi) || []).length >= 2 ||
        (message.match(/[•\-]\s/g) || []).length >= 2 ||
        message.includes('or') ||
        message.includes('pick one')
      ),
      '✅ Should acknowledge the search attempt': (
        message.toLowerCase().includes('search') ||
        message.toLowerCase().includes('looked') ||
        message.toLowerCase().includes('couldn\'t find') ||
        message.toLowerCase().includes('having trouble')
      ),
    };

    console.log('🔍 Validation Results:\n');

    let allPassed = true;
    for (const [check, passed] of Object.entries(checks)) {
      const icon = passed ? '✅' : '❌';
      console.log(`${icon} ${check.replace('✅ ', '')}`);
      if (!passed) allPassed = false;
    }

    console.log();

    if (allPassed) {
      console.log('🎉 SUCCESS: All validation checks passed!');
      console.log('✅ The improved fallback message is working correctly.\n');
      process.exit(0);
    } else {
      console.log('❌ FAILED: Some validation checks failed.');
      console.log('⚠️  The fallback message may not be working as expected.\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    console.log();
    console.log('💡 Make sure:');
    console.log('   - Dev server is running (npm run dev)');
    console.log('   - Redis is running');
    console.log('   - Supabase connection is configured');
    console.log();
    process.exit(1);
  }
}

// Run the test
testSKULookupFallback();
