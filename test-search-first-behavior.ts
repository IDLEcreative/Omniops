/**
 * Test search-first behavior for ambiguous queries
 * Verifies AI searches before asking clarifying questions
 */

async function testQuery(query: string): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: "${query}"`);
  console.log('='.repeat(80));

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: query,
      session_id: `test-${Date.now()}`,
      domain: 'www.thompsonseparts.co.uk',
      config: {
        features: { woocommerce: { enabled: true }, websiteScraping: { enabled: true } },
        ai: { maxSearchIterations: 3, searchTimeout: 10000 }
      }
    })
  });

  const data = await response.json();

  console.log('\n📊 AI Response:');
  console.log(data.message.substring(0, 300) + '...\n');

  if (data.searchMetadata) {
    console.log('🔍 Search Activity:');
    console.log(`  - Iterations: ${data.searchMetadata.iterations}`);
    console.log(`  - Searches Performed: ${data.searchMetadata.totalSearches}`);

    if (data.searchMetadata.searchLog && data.searchMetadata.searchLog.length > 0) {
      console.log('\n  Search Log:');
      data.searchMetadata.searchLog.forEach((log: any) => {
        console.log(`    ✓ ${log.tool}("${log.query}"): ${log.resultCount} results`);
      });
      console.log('\n✅ PASS - AI searched first before responding');
    } else {
      console.log('\n❌ FAIL - AI did NOT search before responding');
    }
  }

  if (data.sources && data.sources.length > 0) {
    console.log(`\n📎 Sources Found: ${data.sources.length}`);
    data.sources.slice(0, 3).forEach((s: any, i: number) => {
      console.log(`    ${i + 1}. ${s.title}`);
    });
  }
}

async function runTests() {
  console.log('\n🚀 Testing Search-First Behavior');
  console.log('Expecting AI to search BEFORE asking clarifying questions\n');

  await testQuery('sheet motor');
  await new Promise(r => setTimeout(r, 2000));

  await testQuery('tipper sheet');

  console.log('\n' + '='.repeat(80));
  console.log('🏁 Tests Complete');
  console.log('='.repeat(80));
}

runTests().catch(console.error);
