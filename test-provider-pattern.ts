/**
 * Test commerce provider pattern for multi-platform support
 */

async function testOrderLookup() {
  console.log('🧪 Testing Commerce Provider Pattern\n');

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'check order 120876',
      session_id: `provider-test-${Date.now()}`,
      domain: 'www.thompsonseparts.co.uk',
      config: {
        features: { woocommerce: { enabled: true } }
      }
    })
  });

  const data = await response.json();

  console.log('📊 Response:');
  console.log(data.message.substring(0, 200));
  console.log('\n🔍 Search Metadata:');
  console.log('  Source:', data.searchMetadata?.searchLog?.[0]?.source);
  console.log('  Tool Used:', data.searchMetadata?.searchLog?.[0]?.tool);

  if (data.searchMetadata?.searchLog?.[0]?.source === 'woocommerce') {
    console.log('\n✅ SUCCESS - Using WooCommerce provider!');
  } else {
    console.log('\n❌ FAIL - Not using provider pattern');
  }
}

testOrderLookup().catch(console.error);
