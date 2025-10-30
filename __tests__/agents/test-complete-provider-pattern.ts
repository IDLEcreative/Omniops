/**
 * Comprehensive test for Commerce Provider Pattern
 * Tests all scenarios including the original user-reported issues
 */

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function testOrderLookup() {
  console.log('\n📦 TEST 1: Order Lookup via Provider Pattern');
  console.log('='.repeat(80));

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'chasing order 120876',
        session_id: `test-provider-${Date.now()}`,
        domain: 'www.thompsonseparts.co.uk',
        config: {
          features: { woocommerce: { enabled: true } }
        }
      })
    });

    const data = await response.json();

    console.log('\n📊 AI Response:');
    console.log(data.message.substring(0, 300));

    console.log('\n🔍 Search Metadata:');
    const searchLog = data.searchMetadata?.searchLog?.[0];
    console.log('  Tool:', searchLog?.tool);
    console.log('  Source:', searchLog?.source);
    console.log('  Results:', searchLog?.resultCount);

    // Verify it's using the provider pattern
    const usesProvider = searchLog?.tool === 'lookup_order' && searchLog?.source === 'woocommerce';
    const foundOrder = data.message.includes('120876') && data.message.includes('Status:');

    if (usesProvider && foundOrder) {
      console.log('\n✅ PASS - Provider pattern working correctly!');
      results.push({
        name: 'Order Lookup',
        passed: true,
        details: 'Successfully used WooCommerce provider to find order'
      });
    } else {
      console.log('\n❌ FAIL - Provider pattern not working');
      results.push({
        name: 'Order Lookup',
        passed: false,
        details: `Provider: ${usesProvider}, Found Order: ${foundOrder}`
      });
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
    results.push({
      name: 'Order Lookup',
      passed: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function testAllOriginalScenarios() {
  console.log('\n\n🔄 TEST 2: All Original User-Reported Scenarios');
  console.log('='.repeat(80));

  const scenarios = [
    { name: 'crane handle', shouldFind: true },
    { name: 'sheet motor', shouldFind: true },
    { name: 'tipper sheet', shouldFind: true }
  ];

  for (const scenario of scenarios) {
    console.log(`\n\n  Testing: "${scenario.name}"`);
    console.log('  ' + '-'.repeat(60));

    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: scenario.name,
          session_id: `test-${Date.now()}`,
          domain: 'www.thompsonseparts.co.uk',
          config: {
            features: { woocommerce: { enabled: true } }
          }
        })
      });

      const data = await response.json();
      const searchLog = data.searchMetadata?.searchLog || [];
      const totalSearches = searchLog.length;
      const totalResults = searchLog.reduce((sum: number, log: any) => sum + (log.resultCount || 0), 0);

      console.log(`  Searches performed: ${totalSearches}`);
      console.log(`  Total results: ${totalResults}`);
      console.log(`  Response preview: ${data.message.substring(0, 100)}...`);

      const passed = totalSearches > 0 && totalResults > 0;

      if (passed) {
        console.log('  ✅ PASS');
        results.push({
          name: scenario.name,
          passed: true,
          details: `Found ${totalResults} results via ${totalSearches} searches`
        });
      } else {
        console.log('  ❌ FAIL - No search performed or no results');
        results.push({
          name: scenario.name,
          passed: false,
          details: `Searches: ${totalSearches}, Results: ${totalResults}`
        });
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log('  ❌ ERROR');
      results.push({
        name: scenario.name,
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 COMPREHENSIVE PROVIDER PATTERN TEST SUITE');
  console.log('='.repeat(80));

  await testOrderLookup();
  await testAllOriginalScenarios();

  // Print summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  console.log(`\nTotal Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  console.log('\n📋 Detailed Results:');
  results.forEach((result, idx) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`\n${idx + 1}. ${status} ${result.name}`);
    console.log(`   ${result.details}`);
  });

  console.log('\n' + '='.repeat(80));
  if (passed === total) {
    console.log('🎉 ALL TESTS PASSED!');
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
  }
  console.log('='.repeat(80) + '\n');
}

runAllTests().catch(console.error);
