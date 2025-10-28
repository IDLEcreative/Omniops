/**
 * Quick test to verify tool_choice: 'required' fix
 *
 * This test checks if the AI is now FORCED to use tools instead of hallucinating.
 */

async function testToolForcingFix() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TESTING TOOL FORCING FIX (tool_choice: required)             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const conversationId = `test-${Date.now()}`;

  console.log('🧪 Test Query: "Do you have 10mtr extension cables?"\n');
  console.log('Expected: AI MUST call search_products or get_product_details\n');
  console.log('Previous Behavior: AI responded without tools (hallucinated)\n');
  console.log('New Behavior: AI forced to use tools first\n');
  console.log('─────────────────────────────────────────────────────────────────\n');

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Do you have 10mtr extension cables?",
        conversationId,
        session_id: conversationId,
        domain: 'thompsonseparts.co.uk'
      })
    });

    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error: ${errorText.substring(0, 500)}`);
      return;
    }

    const data = await response.json();

    console.log('✅ API Response Received\n');
    console.log('=== AI RESPONSE ===');
    console.log(data.message.substring(0, 500));
    console.log('\n=== TOOL USAGE ANALYSIS ===');

    // Check if metadata contains tool information
    if (data.metadata?.searchLog && data.metadata.searchLog.length > 0) {
      console.log('✅ TOOLS CALLED:', data.metadata.searchLog.length);
      data.metadata.searchLog.forEach((log: any, i: number) => {
        console.log(`   ${i + 1}. ${log.tool} - query: "${log.query}" - results: ${log.resultCount}`);
      });
      console.log('\n🎉 SUCCESS: AI is now using tools instead of hallucinating!');
    } else {
      console.log('❌ NO TOOLS CALLED');
      console.log('⚠️  AI responded without searching (still hallucinating)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
  }
}

testToolForcingFix().catch(console.error);
