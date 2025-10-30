/**
 * Diagnostic Test: Compare Chat Behavior With/Without Metadata
 */

console.log('🔍 METADATA SYSTEM DIAGNOSTIC TEST\n');
console.log('='.repeat(70));

const API_URL = 'http://localhost:3000/api/chat';
const TEST_DOMAIN = 'thompsonseparts.co.uk';

async function sendMessage(message: string, conversationId?: string): Promise<any> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      session_id: 'diagnostic-' + Date.now(),
      domain: TEST_DOMAIN,
      conversation_id: conversationId
    })
  });

  return response.json();
}

async function runDiagnostic() {
  console.log('\n📋 Test Case: Numbered List Reference (was passing, now failing)');
  console.log('-'.repeat(70));

  try {
    // Turn 1: Get numbered list
    console.log('\nTurn 1: "Show me 3 Cifa mixer pumps"');
    const response1 = await sendMessage('Show me 3 Cifa mixer pumps');

    console.log(`\n  Response length: ${response1.message.length} chars`);
    console.log(`  Has numbered list: ${/[1-3][\.)]\s*\[/.test(response1.message)}`);
    console.log(`  First 300 chars: ${response1.message.substring(0, 300)}...`);

    // Turn 2: Reference item by number
    console.log('\nTurn 2: "Tell me about item 2"');
    const response2 = await sendMessage('Tell me about item 2', response1.conversation_id);

    console.log(`\n  Response length: ${response2.message.length} chars`);
    console.log(`  Mentions "item 2": ${/item 2|second/i.test(response2.message)}`);
    console.log(`  Contains "pump": ${/pump/i.test(response2.message)}`);
    console.log(`  First 300 chars: ${response2.message.substring(0, 300)}...`);

    // Check for metadata in searchMetadata if available
    if (response2.searchMetadata) {
      console.log(`\n  Search iterations: ${response2.searchMetadata.iterations}`);
      console.log(`  Total searches: ${response2.searchMetadata.totalSearches}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 DIAGNOSTIC RESULT');
    console.log('='.repeat(70));

    const itemResolved = /item 2|second/i.test(response2.message);
    const contextMaintained = /pump/i.test(response2.message);

    console.log(`✓ Item 2 reference resolved: ${itemResolved ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Context maintained (pump): ${contextMaintained ? '✅ YES' : '❌ NO'}`);

    if (itemResolved && !contextMaintained) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   - Metadata IS working (resolves "item 2")');
      console.log('   - BUT context is being lost (no "pump" reference)');
      console.log('   - Metadata may be replacing natural language flow');
    } else if (!itemResolved) {
      console.log('\n⚠️  ISSUE IDENTIFIED:');
      console.log('   - Metadata NOT working (doesn\'t resolve "item 2")');
      console.log('   - List tracking or injection may be broken');
    } else {
      console.log('\n✅ Both checks passed - this test should be passing!');
    }

  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }
}

// Check server and run
fetch('http://localhost:3000/api/health')
  .then(() => {
    console.log('✅ Server running\n');
    runDiagnostic();
  })
  .catch(() => {
    console.log('❌ Server not running on port 3000');
    process.exit(1);
  });
