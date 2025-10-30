/**
 * Test WooCommerce Integration in Chat
 * Tests the complete flow: chat request -> AI tool call -> WooCommerce API
 */

async function testChatWooCommerce() {
  console.log('🧪 Testing WooCommerce Chat Integration\n');

  const chatRequest = {
    message: "Do you have any angle grinders in stock?",
    domain: "thompsonseparts.co.uk",
    session_id: "test-woocommerce-" + Date.now()
  };

  console.log('📤 Sending chat request:');
  console.log(`   Message: "${chatRequest.message}"`);
  console.log(`   Domain: ${chatRequest.domain}`);
  console.log(`   Session: ${chatRequest.session_id}\n`);

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest),
    });

    console.log(`📥 Response Status: ${response.status} ${response.statusText}\n`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Request failed:');
      console.error(errorText);
      return;
    }

    const data = await response.json();

    console.log('✅ Chat Response Received:');
    console.log('─────────────────────────────────────────────────');
    console.log(data.message);
    console.log('─────────────────────────────────────────────────\n');

    if (data.sources && data.sources.length > 0) {
      console.log(`📚 Sources Used: ${data.sources.length} results`);
      data.sources.slice(0, 3).forEach((source: any, idx: number) => {
        console.log(`   ${idx + 1}. ${source.title || source.url}`);
      });
      console.log();
    }

    if (data.metadata) {
      console.log('📊 Metadata:');
      console.log(`   Search iterations: ${data.metadata.searchIterations || 0}`);
      console.log(`   Tools used: ${data.metadata.toolsExecuted || 0}`);
      console.log(`   Model: ${data.metadata.model || 'unknown'}`);
      console.log();
    }

    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
  }
}

testChatWooCommerce();
