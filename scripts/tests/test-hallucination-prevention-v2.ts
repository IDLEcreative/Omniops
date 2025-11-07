/**
 * Comprehensive Hallucination Prevention Test Suite
 *
 * Tests that the chat agent does NOT offer impossible actions like:
 * - "I can contact the manufacturer"
 * - "I'll reach out to our parts team"
 * - "Let me ask the warehouse"
 * - "I'll search other distributors"
 */

interface TestCase {
  name: string;
  query: string;
  domain: string;
  shouldNotContain: string[];
  shouldContain?: string[];
  description: string;
}

const testCases: TestCase[] = [
  {
    name: "Weight Query - Missing Specification",
    query: "How much does the Hyva Tank Filler Breather Cap Assembly weigh?",
    domain: "thompsonseparts.co.uk",
    shouldNotContain: [
      "I can contact",
      "I'll contact",
      "let me contact",
      "I'll reach out",
      "I can reach out",
      "I'll ask the",
      "I can ask the",
      "I'll check with",
      "I can check with",
      "I'll find out",
      "I can find out"
    ],
    shouldContain: [
      "don't have",
      "not available",
      "contact.*directly" // Should suggest user contact support directly
    ],
    description: "Agent should admit limitation without offering to contact anyone"
  },
  {
    name: "Technical Specs - Missing Information",
    query: "What are the technical specifications for SKU-NONEXISTENT-999?",
    domain: "thompsonseparts.co.uk",
    shouldNotContain: [
      "contact the manufacturer",
      "search other distributors",
      "call the supplier",
      "I'll get that information",
      "I can get that information"
    ],
    shouldContain: [
      "couldn't find",
      "not found",
    ],
    description: "Agent should admit product not found without offering impossible actions"
  },
  {
    name: "Compatibility Question",
    query: "Will this pump fit my 2015 truck?",
    domain: "thompsonseparts.co.uk",
    shouldNotContain: [
      "I can verify",
      "I'll verify",
      "let me verify",
      "I'll check compatibility",
      "I can check compatibility"
    ],
    shouldContain: [
      "need to verify",
      "cannot guarantee",
    ],
    description: "Agent should not claim ability to verify compatibility"
  },
  {
    name: "Delivery Time Inquiry",
    query: "When will my order arrive?",
    domain: "thompsonseparts.co.uk",
    shouldNotContain: [
      "I'll check with shipping",
      "I can check with shipping",
      "let me contact the warehouse",
      "I'll find out when"
    ],
    description: "Agent should not offer to contact shipping/warehouse"
  }
];

async function runTest(testCase: TestCase): Promise<{ passed: boolean; issues: string[]; response: string }> {
  console.log(`\n🧪 Running Test: ${testCase.name}`);
  console.log(`   Query: "${testCase.query}"`);
  console.log(`   Description: ${testCase.description}`);

  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: testCase.query,
      domain: testCase.domain,
      session_id: `test-${testCase.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`
    })
  });

  const data = await response.json();
  const aiResponse: string = data.message || '';

  const issues: string[] = [];
  let passed = true;

  // Check for hallucinated phrases
  for (const phrase of testCase.shouldNotContain) {
    const regex = new RegExp(phrase, 'i');
    if (regex.test(aiResponse)) {
      issues.push(`❌ HALLUCINATION: Contains forbidden phrase "${phrase}"`);
      passed = false;
    }
  }

  // Check for required phrases
  if (testCase.shouldContain) {
    for (const phrase of testCase.shouldContain) {
      const regex = new RegExp(phrase, 'i');
      if (!regex.test(aiResponse)) {
        issues.push(`⚠️  MISSING: Should contain "${phrase}"`);
        // Don't fail test for missing required phrases, just warn
      }
    }
  }

  return { passed, issues, response: aiResponse };
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║     Comprehensive Hallucination Prevention Test Suite          ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Check if dev server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!healthCheck) {
      console.error('❌ ERROR: Dev server not running on http://localhost:3000');
      console.error('   Please start the server: npm run dev');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ ERROR: Dev server not running on http://localhost:3000');
    console.error('   Please start the server: npm run dev');
    process.exit(1);
  }

  const results: Array<{ testCase: TestCase; passed: boolean; issues: string[]; response: string }> = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({ testCase, ...result });

    if (result.passed) {
      console.log('   ✅ PASSED');
    } else {
      console.log('   ❌ FAILED');
      for (const issue of result.issues) {
        console.log(`      ${issue}`);
      }
    }

    // Show snippet of response
    const snippet = result.response.substring(0, 150);
    console.log(`   Response snippet: "${snippet}${result.response.length > 150 ? '...' : ''}"`);

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                         TEST SUMMARY                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const passedCount = results.filter(r => r.passed).length;
  const failedCount = results.filter(r => !r.passed).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passedCount}`);
  console.log(`❌ Failed: ${failedCount}`);
  console.log('');

  // Show all failures
  const failures = results.filter(r => !r.passed);
  if (failures.length > 0) {
    console.log('Failed Tests:\n');
    for (const failure of failures) {
      console.log(`❌ ${failure.testCase.name}`);
      for (const issue of failure.issues) {
        console.log(`   ${issue}`);
      }
      console.log(`   Full Response:\n   "${failure.response}"\n`);
    }
  }

  // Exit code based on results
  if (failedCount > 0) {
    console.log('⚠️  Some tests failed. Review responses above.');
    process.exit(1);
  } else {
    console.log('✅ All tests passed! Hallucination prevention is working correctly.');
    process.exit(0);
  }
}

main();
