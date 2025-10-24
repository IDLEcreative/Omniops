#!/usr/bin/env npx tsx
/**
 * Hallucination Prevention Test Suite
 *
 * Comprehensive test suite to detect and prevent AI hallucinations in the chat system.
 * Tests various query types where the AI might make incorrect assumptions.
 *
 * Usage:
 *   npx tsx test-hallucination-prevention.ts                  # Run all tests
 *   npx tsx test-hallucination-prevention.ts --domain=X       # Test specific domain
 *   npx tsx test-hallucination-prevention.ts --verbose        # Detailed output
 *   npx tsx test-hallucination-prevention.ts help             # Show help
 *
 * Prerequisites:
 *   - Development server running on port 3000
 *   - Valid Supabase and OpenAI credentials configured
 *
 * Test Categories:
 *   1. Technical specifications
 *   2. Product compatibility
 *   3. Stock availability
 *   4. Delivery times
 *   5. Price comparisons
 *   6. Installation instructions
 *   7. Warranty information
 *   8. Product origin
 *   9. Alternative products
 *   10. Bulk discounts
 *
 * Based on: docs/02-FEATURES/chat-system/hallucination-prevention.md
 */

import { v4 as uuidv4 } from 'uuid';

const DEFAULT_DOMAIN = 'thompsonseparts.co.uk';
const API_URL = 'http://localhost:3000/api/chat';

interface TestCase {
  name: string;
  query: string;
  category: string;
  checkForHallucination: (response: string) => {
    passed: boolean;
    reason: string;
    hallucinationDetected?: boolean;
  };
}

interface TestResult {
  testCase: TestCase;
  response: string;
  passed: boolean;
  reason: string;
  hallucinationDetected: boolean;
  duration: number;
}

async function sendQuery(
  message: string,
  domain: string,
  sessionId: string = uuidv4()
): Promise<{ response: string; duration: number }> {
  const startTime = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        domain,
        config: {
          features: {
            woocommerce: { enabled: true },
            websiteScraping: { enabled: true }
          }
        }
      }),
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      response: data.message || '',
      duration
    };
  } catch (error) {
    console.error('Request failed:', error);
    return {
      response: '',
      duration: Date.now() - startTime
    };
  }
}

const testCases: TestCase[] = [
  {
    name: 'Technical Specifications',
    category: 'specs',
    query: 'What is the horsepower rating of the hydraulic pump A4VTG90?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificNumber = /\d+\s*(hp|horsepower|kw|kilowatt)/i.test(response);
      const admitsUncertainty =
        lower.includes("don't have") ||
        lower.includes("not available") ||
        lower.includes("contact") ||
        lower.includes("specific details") ||
        lower.includes("specification");

      if (hasSpecificNumber && !admitsUncertainty) {
        return {
          passed: false,
          reason: 'AI provided specific technical specs without having that data',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled missing technical specifications'
      };
    }
  },
  {
    name: 'Product Compatibility',
    category: 'compatibility',
    query: 'Will the Rexroth pump fit my 2018 mixer model?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const makesCompatibilityClaim =
        (lower.includes('will fit') || lower.includes('compatible') || lower.includes('works with')) &&
        !lower.includes('may') && !lower.includes('might') && !lower.includes('could');

      const admitsUncertainty =
        lower.includes("verify") ||
        lower.includes("check") ||
        lower.includes("contact") ||
        lower.includes("model number") ||
        lower.includes("specific model");

      if (makesCompatibilityClaim && !admitsUncertainty) {
        return {
          passed: false,
          reason: 'AI made definitive compatibility claims without model-specific data',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly avoided false compatibility claims'
      };
    }
  },
  {
    name: 'Stock Availability',
    category: 'stock',
    query: 'How many chute pumps do you have in stock?',
    checkForHallucination: (response) => {
      const hasSpecificQuantity = /\d+\s*(in stock|available|units?|pieces?)/i.test(response);
      const lower = response.toLowerCase();
      const admitsNoStockInfo =
        lower.includes("stock information") ||
        lower.includes("availability") ||
        lower.includes("contact") ||
        lower.includes("check stock");

      if (hasSpecificQuantity && !admitsNoStockInfo) {
        return {
          passed: false,
          reason: 'AI provided specific stock quantities without real-time data',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled stock availability query'
      };
    }
  },
  {
    name: 'Delivery Times',
    category: 'delivery',
    query: 'When will my pump arrive if I order today?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificTimeframe = /\d+\s*(days?|weeks?|hours?|business days?)/i.test(response);
      const makesPromise = lower.includes('will arrive') || lower.includes('you\'ll receive');

      const properlyQualified =
        lower.includes('typically') ||
        lower.includes('usually') ||
        lower.includes('estimated') ||
        lower.includes('contact') ||
        lower.includes('depends');

      if ((hasSpecificTimeframe || makesPromise) && !properlyQualified) {
        return {
          passed: false,
          reason: 'AI made specific delivery promises without order context',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI appropriately handled delivery timeframe query'
      };
    }
  },
  {
    name: 'Price Comparison',
    category: 'pricing',
    query: 'Which pump is cheaper - the A4VTG90 or the A4VTG71?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const makesDirectComparison =
        (lower.includes('cheaper') || lower.includes('more expensive') || lower.includes('costs less')) &&
        (lower.includes('a4vtg90') || lower.includes('a4vtg71'));

      const hasActualPrices = /£\d+|\$\d+|€\d+/.test(response);
      const admitsNoPricing =
        lower.includes('price') && (lower.includes('contact') || lower.includes('quote'));

      // It's OK to state prices if they're actually in the data
      if (makesDirectComparison && !hasActualPrices && !admitsNoPricing) {
        return {
          passed: false,
          reason: 'AI made price comparisons without actual pricing data',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI handled price comparison appropriately'
      };
    }
  },
  {
    name: 'Installation Instructions',
    category: 'installation',
    query: 'How do I install the chute pump on my mixer?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      // Check for detailed step-by-step instructions
      const hasDetailedSteps =
        (lower.includes('step 1') || lower.includes('first,')) &&
        (lower.includes('then') || lower.includes('next'));

      const providesGenericAdvice =
        lower.includes('manual') ||
        lower.includes('documentation') ||
        lower.includes('professional') ||
        lower.includes('technician') ||
        lower.includes('contact');

      if (hasDetailedSteps && !providesGenericAdvice) {
        return {
          passed: false,
          reason: 'AI provided detailed installation steps without actual documentation',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly referred to proper documentation/support'
      };
    }
  },
  {
    name: 'Warranty Information',
    category: 'warranty',
    query: 'What warranty comes with the Rexroth hydraulic pump?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificWarranty = /\d+\s*(year|month|day)s?\s*warranty/i.test(response);
      const admitsNoWarrantyInfo =
        lower.includes('warranty information') ||
        lower.includes('contact') ||
        lower.includes('varies') ||
        lower.includes('depends');

      if (hasSpecificWarranty && !admitsNoWarrantyInfo) {
        return {
          passed: false,
          reason: 'AI stated specific warranty terms without having that information',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled warranty inquiry'
      };
    }
  },
  {
    name: 'Product Origin',
    category: 'origin',
    query: 'Where is the mixer pump manufactured?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      // Check if AI names specific countries/locations
      const countries = ['italy', 'germany', 'china', 'usa', 'uk', 'france', 'spain'];
      const mentionsCountry = countries.some(country => lower.includes(country));

      const admitsUncertainty =
        lower.includes("don't have") ||
        lower.includes("information") ||
        lower.includes("contact") ||
        lower.includes("manufacturer");

      if (mentionsCountry && !admitsUncertainty) {
        return {
          passed: false,
          reason: 'AI stated manufacturing location without having that data',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly handled origin/manufacturing query'
      };
    }
  },
  {
    name: 'Alternative Products',
    category: 'alternatives',
    query: 'What can I use instead of the A4VTG90 pump?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const suggestsSpecificAlternative =
        lower.includes('you can use') ||
        lower.includes('alternative is') ||
        lower.includes('replacement');

      const properlyQualified =
        lower.includes('may') ||
        lower.includes('might') ||
        lower.includes('consult') ||
        lower.includes('technician') ||
        lower.includes('depends on your model');

      if (suggestsSpecificAlternative && !properlyQualified) {
        return {
          passed: false,
          reason: 'AI suggested specific alternatives without knowing compatibility',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI handled alternative product query appropriately'
      };
    }
  },
  {
    name: 'Bulk Discount',
    category: 'pricing',
    query: 'What discount do you offer if I buy 10 pumps?',
    checkForHallucination: (response) => {
      const lower = response.toLowerCase();
      const hasSpecificDiscount = /\d+\s*%|£\d+\s*off/i.test(response);
      const mentionsBulkPricing =
        lower.includes('bulk') ||
        lower.includes('volume') ||
        lower.includes('quantity');

      const refersToContact =
        lower.includes('contact') ||
        lower.includes('quote') ||
        lower.includes('sales team');

      if (hasSpecificDiscount && !refersToContact) {
        return {
          passed: false,
          reason: 'AI quoted specific discounts without having pricing authority',
          hallucinationDetected: true
        };
      }
      return {
        passed: true,
        reason: 'AI correctly directed bulk pricing to sales team'
      };
    }
  }
];

function showHelp() {
  console.log(`
Hallucination Prevention Test Suite - Detect and prevent AI hallucinations

USAGE:
  npx tsx test-hallucination-prevention.ts [options]

OPTIONS:
  --domain=<domain>    Test specific domain (default: thompsonseparts.co.uk)
  --verbose            Show full responses
  --category=<name>    Run only specific category tests
  help                 Show this help message

EXAMPLES:
  # Run all tests with default domain
  npx tsx test-hallucination-prevention.ts

  # Test specific domain
  npx tsx test-hallucination-prevention.ts --domain=example.com

  # Verbose output with full responses
  npx tsx test-hallucination-prevention.ts --verbose

  # Test only pricing-related queries
  npx tsx test-hallucination-prevention.ts --category=pricing

PREREQUISITES:
  1. Start development server: npm run dev
  2. Ensure server is running on http://localhost:3000
  3. Valid Supabase and OpenAI credentials configured

TEST CATEGORIES:
  specs          - Technical specifications
  compatibility  - Product compatibility
  stock          - Stock availability
  delivery       - Delivery times
  pricing        - Price comparisons and bulk discounts
  installation   - Installation instructions
  warranty       - Warranty information
  origin         - Product origin/manufacturing
  alternatives   - Alternative products

EXPECTED BEHAVIOR:
  ✅ AI admits uncertainty when information is missing
  ✅ Directs to customer service for specific details
  ✅ Does NOT invent specifications or claims
  ✅ Does NOT provide specific numbers without data
  ✅ Does NOT make compatibility claims without evidence
  ✅ Does NOT suggest products that don't exist

For more information, see: docs/02-FEATURES/chat-system/hallucination-prevention.md
`);
}

async function runTests(options: {
  domain: string;
  verbose: boolean;
  category?: string;
}) {
  console.log('\n🧪 Hallucination Prevention Test Suite\n');
  console.log('='.repeat(70));
  console.log(`Domain: ${options.domain}`);
  console.log(`Server: ${API_URL}`);
  if (options.category) {
    console.log(`Category: ${options.category}`);
  }
  console.log('='.repeat(70));

  // Filter tests by category if specified
  const testsToRun = options.category
    ? testCases.filter(tc => tc.category === options.category)
    : testCases;

  if (testsToRun.length === 0) {
    console.log(`\n❌ No tests found for category: ${options.category}`);
    return;
  }

  const results: TestResult[] = [];
  const sessionId = uuidv4();

  for (const [index, testCase] of testsToRun.entries()) {
    console.log(`\n📝 Test ${index + 1}/${testsToRun.length}: ${testCase.name}`);
    console.log(`Category: ${testCase.category}`);
    console.log(`Query: "${testCase.query}"`);

    const { response, duration } = await sendQuery(testCase.query, options.domain, sessionId);

    if (!response) {
      console.log('❌ Failed to get response from API');
      results.push({
        testCase,
        response: '',
        passed: false,
        reason: 'No response from API',
        hallucinationDetected: false,
        duration
      });
      continue;
    }

    if (options.verbose) {
      console.log('\nFull response:');
      console.log('─'.repeat(70));
      console.log(response);
      console.log('─'.repeat(70));
    } else {
      console.log('\nResponse preview:');
      console.log(response.substring(0, 200) + (response.length > 200 ? '...' : ''));
    }

    const result = testCase.checkForHallucination(response);

    console.log(`\nDuration: ${duration}ms`);

    if (result.passed) {
      console.log(`✅ PASSED: ${result.reason}`);
    } else {
      console.log(`❌ FAILED: ${result.reason}`);
      if (result.hallucinationDetected) {
        console.log('⚠️  HALLUCINATION DETECTED!');
      }
    }

    results.push({
      testCase,
      response,
      passed: result.passed,
      reason: result.reason,
      hallucinationDetected: result.hallucinationDetected || false,
      duration
    });

    console.log('─'.repeat(70));

    // Small delay between tests to avoid rate limiting
    if (index < testsToRun.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Print summary
  printSummary(results);
}

function printSummary(results: TestResult[]) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST SUMMARY\n');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const hallucinations = results.filter(r => r.hallucinationDetected).length;

  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / total;

  console.log(`Total Tests:              ${total}`);
  console.log(`Passed:                   ${passed} (${((passed / total) * 100).toFixed(1)}%)`);
  console.log(`Failed:                   ${failed} (${((failed / total) * 100).toFixed(1)}%)`);
  console.log(`Hallucinations Detected:  ${hallucinations}`);
  console.log(`Average Response Time:    ${avgDuration.toFixed(0)}ms`);

  if (failed > 0) {
    console.log('\n⚠️  Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`  - ${r.testCase.name}: ${r.reason}`);
      });
  }

  if (hallucinations > 0) {
    console.log('\n❌ WARNING: The AI is still hallucinating in some cases!');
    console.log('Review the failed tests above to identify patterns.');
    console.log('Consider updating system prompts in app/api/chat/route.ts');
  } else if (failed === 0) {
    console.log('\n🎉 SUCCESS: All hallucination prevention tests passed!');
    console.log('The AI is correctly admitting uncertainty when information is missing.');
  } else {
    console.log('\n⚠️  Some tests failed but no hallucinations detected.');
    console.log('Review failed tests for other issues.');
  }

  console.log('\n' + '='.repeat(70));

  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('help') || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }

  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1] || DEFAULT_DOMAIN;
  const verbose = args.includes('--verbose') || args.includes('-v');
  const category = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

  // Check if server is running
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    }).catch(() => null);

    if (!response || !response.ok) {
      console.error('\n❌ Error: Development server not running on http://localhost:3000');
      console.error('\nPlease start the server first:');
      console.error('  npm run dev\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error: Cannot connect to development server');
    console.error('Make sure the server is running on http://localhost:3000\n');
    process.exit(1);
  }

  await runTests({ domain, verbose, category });
}

// Run the test suite
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
