// Test what the AI actually finds vs what exists in database

const testQueries = [
  { query: "Cifa", expected: "200+", description: "All Cifa products" },
  { query: "Cifa Mixer Proportional Mag Solenoid", expected: "1", description: "Specific product" },
  { query: "hydraulic pump", expected: "30+", description: "Category search" },
  { query: "K000901660", expected: "1", description: "Part number search" },
  { query: "water pump Cifa", expected: "5-10", description: "Filtered search" }
];

async function testSearch(query: string): Promise<number> {
  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        session_id: `test-${Date.now()}`,
        domain: 'thompsonseparts.co.uk'
      })
    });
    
    const data = await response.json();
    return data.searchMetadata?.searchLog?.[0]?.resultCount || 0;
  } catch (error) {
    return 0;
  }
}

async function runTests() {
  console.log('🔍 Search Accuracy Test\n');
  console.log('Query'.padEnd(40) + 'Expected'.padEnd(15) + 'Actual'.padEnd(15) + 'Status');
  console.log('-'.repeat(80));
  
  for (const test of testQueries) {
    const actual = await testSearch(test.query);
    const status = actual > 0 ? '✅' : '❌';
    
    console.log(
      test.query.padEnd(40) + 
      test.expected.padEnd(15) + 
      actual.toString().padEnd(15) + 
      status
    );
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

runTests().catch(console.error);
