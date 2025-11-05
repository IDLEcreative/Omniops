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
// Using demoId instead of domain to bypass domain_id requirement
const TEST_DEMO_ID = 'test-sku-lookup';
const TEST_SKU = 'MU110667601';

async function testSKULookupFallback(): Promise<void> {
  console.log('🧪 Testing SKU Lookup Fallback Message\n');
  console.log('Scenario: User provides non-existent SKU');
  console.log(`SKU: ${TEST_SKU}`);
  console.log(`Demo Mode: ${TEST_DEMO_ID}\n`);

  try {
    console.log('📤 Sending chat request...\n');

    const response = await fetch(CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: TEST_SKU,
        demoId: TEST_DEMO_ID,
        session_id: `test-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: ChatResponse = await response.json();

    if (!data.success || !data.message) {
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

    // Validation checks
    const checks = {
      '✅ Should NOT contain old generic message': !message.includes('try asking more specifically'),
      '✅ Should contain new context-aware message': message.includes("I'm having trouble finding"),
      '✅ Should mention the specific SKU': message.includes(TEST_SKU),
      '✅ Should provide actionable alternatives': message.includes('To help you faster'),
      '✅ Should offer multiple options': (
        message.includes('product name') ||
        message.includes('link') ||
        message.includes('photo')
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
