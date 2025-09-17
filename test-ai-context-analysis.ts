#!/usr/bin/env npx tsx
/**
 * Test AI Context Analysis
 * Verifies that the AI receives full context and uses it intelligently
 */

interface TestScenario {
  name: string;
  query: string;
  expectedBehavior: {
    minResults?: number;
    maxResults?: number;
    shouldCategorize?: boolean;
    shouldOfferOptions?: boolean;
    shouldProvideDetails?: boolean;
  };
}

const scenarios: TestScenario[] = [
  {
    name: "Single Specific Item",
    query: "Cifa Mixer Proportional Mag Solenoid",
    expectedBehavior: {
      minResults: 1,
      maxResults: 5,
      shouldProvideDetails: true,
      shouldOfferOptions: false
    }
  },
  {
    name: "Few Items (5-10)",
    query: "Cifa water pumps",
    expectedBehavior: {
      minResults: 5,
      maxResults: 15,
      shouldProvideDetails: true,
      shouldOfferOptions: true
    }
  },
  {
    name: "Many Items (50+)",
    query: "hydraulic pumps all types",
    expectedBehavior: {
      minResults: 30,
      shouldCategorize: true,
      shouldOfferOptions: true
    }
  },
  {
    name: "Massive Results (200+)",
    query: "Show me all Cifa products",
    expectedBehavior: {
      minResults: 200,
      shouldCategorize: true,
      shouldOfferOptions: true
    }
  }
];

async function testScenario(scenario: TestScenario): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 Testing: ${scenario.name}`);
  console.log(`Query: "${scenario.query}"`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch('http://localhost:3000/api/chat-intelligent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: scenario.query,
        session_id: `test-context-${Date.now()}`,
        domain: 'thompsonseparts.co.uk'
      })
    });

    const data = await response.json();
    
    // Analyze search results
    const searchResults = data.searchMetadata?.searchLog?.[0]?.resultCount || 0;
    console.log(`\n📊 Search Results: ${searchResults} items found`);
    
    // Check against expectations
    const { expectedBehavior } = scenario;
    
    if (expectedBehavior.minResults) {
      const pass = searchResults >= expectedBehavior.minResults;
      console.log(`✓ Min results (${expectedBehavior.minResults}): ${pass ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    if (expectedBehavior.maxResults) {
      const pass = searchResults <= expectedBehavior.maxResults;
      console.log(`✓ Max results (${expectedBehavior.maxResults}): ${pass ? '✅ PASS' : '❌ FAIL'}`);
    }
    
    // Analyze AI response behavior
    const message = data.message || '';
    console.log('\n🤖 AI Behavior Analysis:');
    
    // Check if AI categorizes
    const hasCategorization = message.includes('category') || 
                             message.includes('types') || 
                             message.includes('hydraulic') ||
                             message.includes('electrical') ||
                             message.includes('water system');
    console.log(`- Categorizes results: ${hasCategorization ? '✅' : '❌'}`);
    
    // Check if AI offers options
    const offersOptions = message.includes('Which') || 
                         message.includes('Would you like') ||
                         message.includes('Tell me which') ||
                         message.includes('How would you like');
    console.log(`- Offers navigation options: ${offersOptions ? '✅' : '❌'}`);
    
    // Check if AI provides details
    const providesDetails = message.includes('£') || 
                           message.includes('Part No') ||
                           message.includes('SKU') ||
                           message.includes('specifications');
    console.log(`- Provides product details: ${providesDetails ? '✅' : '❌'}`);
    
    // Check token usage
    const tokens = data.tokenUsage?.total || 0;
    console.log(`\n💾 Context Usage: ${tokens} tokens`);
    if (tokens > 10000) {
      console.log('  ⚠️  Large context - AI has access to extensive product data');
    }
    
    // Show response strategy
    console.log('\n📝 AI Response Strategy:');
    if (searchResults === 0) {
      console.log('  → No results: AI should explain and offer alternatives');
    } else if (searchResults === 1) {
      console.log('  → Single result: AI should provide complete details');
    } else if (searchResults <= 10) {
      console.log('  → Few results: AI should list all with details');
    } else if (searchResults <= 50) {
      console.log('  → Many results: AI should categorize and show popular items');
    } else {
      console.log('  → Massive results: AI should organize into categories and guide narrowing');
    }
    
    // Show response preview
    console.log('\n💬 Response Preview:');
    console.log(message.substring(0, 300) + '...');
    
  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 AI Context Analysis Test Suite');
  console.log('Testing how AI handles different result set sizes\n');
  
  for (const scenario of scenarios) {
    await testScenario(scenario);
    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('✅ All tests completed');
  console.log('\n📋 Summary:');
  console.log('The AI should adapt its response strategy based on:');
  console.log('  1. Number of results found');
  console.log('  2. Query specificity');
  console.log('  3. Customer intent');
  console.log('  4. Available context window');
}

runAllTests().catch(console.error);