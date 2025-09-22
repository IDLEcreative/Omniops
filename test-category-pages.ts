#!/usr/bin/env npx tsx

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api/chat-intelligent';

async function testChatQuery(query: string, description: string) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Test: ${description}`);
  console.log(`Query: "${query}"`);
  console.log(`${'='.repeat(80)}`);

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        session_id: `test-session-${Date.now()}`,
        domain: 'thompsonseparts.co.uk',
        config: {
          features: {
            websiteScraping: { enabled: true }
          },
          ai: {
            maxSearchIterations: 2,
            searchTimeout: 10000
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('\n📝 AI Response:');
    console.log('-'.repeat(40));
    console.log(data.message);
    console.log('-'.repeat(40));
    
    // Check for category pages
    const responseText = data.message.toLowerCase();
    const hasCategoryLinks = responseText.includes('product-category') || 
                             responseText.includes('browse') ||
                             responseText.includes('category');
    
    console.log('\n✅ Analysis:');
    console.log(`- Contains category links: ${hasCategoryLinks ? '✓' : '✗'}`);
    
    // Check for external site mentions
    const hasExternalSites = responseText.includes('external') ||
                            responseText.includes('elsewhere') ||
                            responseText.includes('google') ||
                            responseText.includes('amazon') ||
                            responseText.includes('ebay') ||
                            responseText.includes('other website') ||
                            responseText.includes('third-party');
    
    console.log(`- No external sites suggested: ${!hasExternalSites ? '✓' : '✗ (ISSUE!)'}`);
    
    // Extract category URLs
    const categoryMatches = data.message.match(/\/product-category\/[^\s\)]+/g);
    if (categoryMatches) {
      console.log(`- Found category URLs:`);
      categoryMatches.forEach(url => console.log(`  • ${url}`));
    }
    
    // Check sources
    if (data.sources && data.sources.length > 0) {
      console.log(`- Sources provided: ${data.sources.length} items`);
    }
    
    if (data.metadata) {
      console.log(`- Execution time: ${data.metadata.executionTime}ms`);
      console.log(`- Search results: ${data.metadata.searchCount || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Chat API with Category Pages Enhancement');
  console.log('Starting tests...\n');
  
  // Test cases
  const testCases = [
    {
      query: "torque wrenches",
      description: "Testing tools search (should include category page if found)"
    },
    {
      query: "Do you have any hydraulic pumps?",
      description: "Testing pumps search (should include relevant categories)"
    },
    {
      query: "Show me workshop tools",
      description: "Testing workshop tools (should include categories)"
    },
    {
      query: "I need safety equipment",
      description: "Testing safety equipment (should include relevant categories)"
    },
    {
      query: "What batteries do you have?",
      description: "Testing batteries search (should include categories if found)"
    },
    {
      query: "XYZABC123 part",
      description: "Testing non-existent part (should handle no results gracefully)"
    }
  ];
  
  for (const testCase of testCases) {
    await testChatQuery(testCase.query, testCase.description);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch(console.error);