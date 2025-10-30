/**
 * Test script to verify domain-agnostic fixes
 * Tests the scenarios reported by the user
 */

interface TestCase {
  name: string;
  message: string;
  expectedBehavior: string;
}

const testCases: TestCase[] = [
  {
    name: "Product search - crane handle",
    message: "crane handle",
    expectedBehavior: "Should return products related to crane handles"
  },
  {
    name: "Product search - bawer toolbox",
    message: "bawer toolbox",
    expectedBehavior: "Should provide helpful error message with suggestions"
  },
  {
    name: "Product search - thompsons toolbox",
    message: "thompsons toolbox",
    expectedBehavior: "Should provide helpful error message with suggestions"
  },
  {
    name: "Order tracking",
    message: "chasing order 120876",
    expectedBehavior: "Should use lookup_order tool to find order information"
  },
  {
    name: "Product search - sheet motor",
    message: "sheet motor",
    expectedBehavior: "Should suggest 'tipper sheet motor' as alternative"
  },
  {
    name: "Product search - tipper sheet",
    message: "tipper sheet",
    expectedBehavior: "Should find both bulk and single sheet options"
  }
];

async function testChatAPI(testCase: TestCase): Promise<void> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testCase.name}`);
  console.log(`MESSAGE: "${testCase.message}"`);
  console.log(`EXPECTED: ${testCase.expectedBehavior}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testCase.message,
        session_id: `test-session-${Date.now()}`,
        domain: 'www.thompsonseparts.co.uk',
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          },
          ai: {
            maxSearchIterations: 3,
            searchTimeout: 10000
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ FAILED - HTTP ${response.status}:`, errorText);
      return;
    }

    const data = await response.json();

    console.log('\n📊 RESPONSE:');
    console.log('Message:', data.message);

    if (data.searchMetadata) {
      console.log('\n🔍 SEARCH METADATA:');
      console.log('- Iterations:', data.searchMetadata.iterations);
      console.log('- Total Searches:', data.searchMetadata.totalSearches);
      console.log('- Search Log:');
      data.searchMetadata.searchLog?.forEach((log: any) => {
        console.log(`  - ${log.tool}("${log.query}"): ${log.resultCount} results from ${log.source}`);
      });
    }

    if (data.sources && data.sources.length > 0) {
      console.log('\n📎 SOURCES:', data.sources.length);
      data.sources.slice(0, 3).forEach((source: any, idx: number) => {
        console.log(`  ${idx + 1}. ${source.title} (${(source.relevance * 100).toFixed(1)}% relevance)`);
      });
    }

    console.log('\n✅ TEST COMPLETED');

  } catch (error) {
    console.error('❌ TEST FAILED:', error instanceof Error ? error.message : error);
  }
}

async function runAllTests() {
  console.log('\n🚀 STARTING DOMAIN-AGNOSTIC FIXES TEST SUITE');
  console.log('Testing scenarios from user feedback...\n');

  for (const testCase of testCases) {
    await testChatAPI(testCase);
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 ALL TESTS COMPLETED');
  console.log('='.repeat(80));
}

// Run tests
runAllTests().catch(console.error);
