#!/usr/bin/env tsx

/**
 * AUTOMATED EDGE CASE TESTING
 * Tests the chat system against discovered edge cases
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

// Color utilities for output
const colors = {
  red: (text: string) => `\x1b[31m${text}\x1b[0m`,
  green: (text: string) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text: string) => `\x1b[33m${text}\x1b[0m`,
  blue: (text: string) => `\x1b[34m${text}\x1b[0m`,
  cyan: (text: string) => `\x1b[36m${text}\x1b[0m`,
  bold: (text: string) => `\x1b[1m${text}\x1b[0m`,
};

interface TestResult {
  testName: string;
  passed: boolean;
  issue?: string;
  details?: any;
}

class EdgeCaseTester {
  private baseUrl = 'http://localhost:3000';
  private results: TestResult[] = [];
  private conversationId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = `test-${Date.now()}`;
  }

  async makeRequest(message: string, useIntelligent = true): Promise<any> {
    const endpoint = useIntelligent ? '/api/chat-intelligent' : '/api/chat';
    
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: this.sessionId,
          conversation_id: this.conversationId,
          domain: 'thompsonseparts.co.uk',
          config: {
            features: {
              woocommerce: { enabled: true },
              websiteScraping: { enabled: true }
            }
          }
        })
      });

      const data = await response.json();
      
      // Store conversation ID for context
      if (data.conversation_id) {
        this.conversationId = data.conversation_id;
      }
      
      return { status: response.status, data };
    } catch (error) {
      return { status: 500, error: error.message };
    }
  }

  async testNumberReferences() {
    console.log(colors.cyan('\n📝 Testing Number References'));
    console.log('=' .repeat(50));

    // First, create a context with numbered items
    console.log('Setting up numbered list context...');
    const setupResponse = await this.makeRequest('show me your top 5 torque wrenches');
    
    if (setupResponse.status !== 200) {
      this.results.push({
        testName: 'Number References - Setup',
        passed: false,
        issue: 'Failed to create numbered list context'
      });
      return;
    }

    // Extract the list from response
    const message = setupResponse.data.message;
    const numberedItems = message.match(/\d+\.\s+[^\n]+/g) || [];
    console.log(`Found ${numberedItems.length} numbered items in response`);

    // Test various number reference formats
    const numberTests = [
      { input: 'tell me more about item 3', expected: 'Should reference third item' },
      { input: 'what about the 2nd one?', expected: 'Should reference second item' },
      { input: 'tell me about number three', expected: 'Should understand written number' },
      { input: 'details on item 99', expected: 'Should handle out-of-bounds gracefully' },
      { input: 'compare 1 and 2', expected: 'Should reference both items' }
    ];

    for (const test of numberTests) {
      console.log(`\nTesting: "${test.input}"`);
      const response = await this.makeRequest(test.input);
      
      if (response.status === 200) {
        const responseText = response.data.message.toLowerCase();
        
        // Check if it's trying to re-list or if it's referencing specific items
        const isRelisting = responseText.includes('here are') || responseText.includes('we have');
        const referencesSpecific = responseText.includes('you mentioned') || 
                                   responseText.includes('item #') ||
                                   responseText.includes('the third') ||
                                   responseText.includes('the second');
        
        this.results.push({
          testName: `Number Ref: ${test.input}`,
          passed: !isRelisting || referencesSpecific,
          issue: isRelisting && !referencesSpecific ? 'Re-listing instead of referencing specific item' : undefined,
          details: { response: responseText.substring(0, 200) }
        });
      } else {
        this.results.push({
          testName: `Number Ref: ${test.input}`,
          passed: false,
          issue: `Request failed with status ${response.status}`
        });
      }
    }
  }

  async testStockChecking() {
    console.log(colors.cyan('\n📦 Testing Stock Checking Boundaries'));
    console.log('=' .repeat(50));

    const stockTests = [
      { 
        input: 'is this in stock?',
        shouldNotContain: ['yes, it\'s in stock', 'available now', 'we have it']
      },
      {
        input: 'can I pick this up today?',
        shouldNotContain: ['yes, you can', 'available for pickup', 'collect today']
      },
      {
        input: 'do you have any ready for immediate delivery?',
        shouldNotContain: ['we can deliver', 'available for delivery', 'ship today']
      },
      {
        input: 'which ones are currently available?',
        shouldContain: ['contact', 'call', 'verify', 'check']
      }
    ];

    for (const test of stockTests) {
      console.log(`\nTesting: "${test.input}"`);
      const response = await this.makeRequest(test.input);
      
      if (response.status === 200) {
        const responseText = response.data.message.toLowerCase();
        let passed = true;
        let issues: string[] = [];

        if (test.shouldNotContain) {
          for (const phrase of test.shouldNotContain) {
            if (responseText.includes(phrase.toLowerCase())) {
              passed = false;
              issues.push(`Contains forbidden phrase: "${phrase}"`);
            }
          }
        }

        if (test.shouldContain) {
          let foundAny = false;
          for (const phrase of test.shouldContain) {
            if (responseText.includes(phrase.toLowerCase())) {
              foundAny = true;
              break;
            }
          }
          if (!foundAny) {
            passed = false;
            issues.push('Missing required redirection to contact store');
          }
        }

        this.results.push({
          testName: `Stock Check: ${test.input.substring(0, 30)}...`,
          passed,
          issue: issues.join('; '),
          details: { response: responseText.substring(0, 200) }
        });
      }
    }
  }

  async testSpecialCharacters() {
    console.log(colors.cyan('\n🔤 Testing Special Character Handling'));
    console.log('=' .repeat(50));

    const specialTests = [
      { input: 'find 3/4" wrenches', description: 'Quotes in search' },
      { input: 'products with & or /', description: 'Special chars in query' },
      { input: 'show "ultra-pro" series', description: 'Quoted terms' },
      { input: 'search for items < £50', description: 'Comparison operators' }
    ];

    for (const test of specialTests) {
      console.log(`\nTesting: "${test.input}" (${test.description})`);
      const response = await this.makeRequest(test.input);
      
      this.results.push({
        testName: `Special Chars: ${test.description}`,
        passed: response.status === 200 && !response.data.error,
        issue: response.data.error || (response.status !== 200 ? `Status ${response.status}` : undefined),
        details: response.status === 200 ? { messageLength: response.data.message?.length } : undefined
      });
    }
  }

  async testConversationContext() {
    console.log(colors.cyan('\n💭 Testing Conversation Context Management'));
    console.log('=' .repeat(50));

    // Reset conversation for fresh context
    this.conversationId = null;

    // Build up context
    console.log('Building conversation context...');
    await this.makeRequest('show me hydraulic pumps');
    await this.makeRequest('what about starter chargers?');
    await this.makeRequest('do you have any Teng tools?');

    // Test context references
    const contextTests = [
      { input: 'tell me more about that', expected: 'Should reference most recent (Teng)' },
      { input: 'go back to the pumps', expected: 'Should reference hydraulic pumps' },
      { input: 'what was the first thing I asked about?', expected: 'Should reference pumps' },
      { input: 'forget all that, show me batteries', expected: 'Should switch context' }
    ];

    for (const test of contextTests) {
      console.log(`\nTesting: "${test.input}"`);
      const response = await this.makeRequest(test.input);
      
      if (response.status === 200) {
        const responseText = response.data.message.toLowerCase();
        let passed = true;
        
        // Simple heuristic checks
        if (test.input.includes('that') && !responseText.includes('teng')) {
          passed = false;
        }
        if (test.input.includes('pumps') && !responseText.includes('pump')) {
          passed = false;
        }
        if (test.input.includes('forget') && responseText.includes('pump')) {
          passed = false; // Should have switched context
        }

        this.results.push({
          testName: `Context: ${test.input.substring(0, 30)}...`,
          passed,
          issue: !passed ? 'Incorrect context reference' : undefined,
          details: { response: responseText.substring(0, 150) }
        });
      }
    }
  }

  async testRaceConditions() {
    console.log(colors.cyan('\n🏃 Testing Race Conditions'));
    console.log('=' .repeat(50));

    // Test rapid successive messages
    console.log('Sending rapid messages...');
    const promises = [
      this.makeRequest('first message'),
      this.makeRequest('second message'),
      this.makeRequest('third message')
    ];

    const results = await Promise.allSettled(promises);
    const allSucceeded = results.every(r => r.status === 'fulfilled' && r.value.status === 200);

    this.results.push({
      testName: 'Race: Rapid successive messages',
      passed: allSucceeded,
      issue: !allSucceeded ? 'Some messages failed in rapid succession' : undefined,
      details: { 
        successCount: results.filter(r => r.status === 'fulfilled').length,
        totalSent: 3
      }
    });

    // Test duplicate conversation ID handling
    const duplicateConvId = 'test-duplicate-' + Date.now();
    console.log('\nTesting duplicate conversation ID handling...');
    
    const dup1 = await fetch(`${this.baseUrl}/api/chat-intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'first with duplicate ID',
        session_id: this.sessionId + '-dup1',
        conversation_id: duplicateConvId,
        domain: 'test.com'
      })
    });

    const dup2 = await fetch(`${this.baseUrl}/api/chat-intelligent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'second with duplicate ID',
        session_id: this.sessionId + '-dup2',
        conversation_id: duplicateConvId,
        domain: 'test.com'
      })
    });

    this.results.push({
      testName: 'Race: Duplicate conversation ID',
      passed: dup1.status === 200 && dup2.status === 200,
      issue: 'Failed to handle duplicate conversation IDs',
      details: { status1: dup1.status, status2: dup2.status }
    });
  }

  async testServiceBoundaries() {
    console.log(colors.cyan('\n🚫 Testing Service Boundary Enforcement'));
    console.log('=' .repeat(50));

    const boundaryTests = [
      {
        input: 'can you deliver to SW1A 1AA?',
        forbidden: ['yes', 'we deliver', 'delivery available']
      },
      {
        input: 'I want to order this for click and collect',
        forbidden: ['click and collect available', 'you can collect', 'reserve for pickup']
      },
      {
        input: 'can I pay with PayPal?',
        forbidden: ['yes', 'paypal accepted', 'we accept paypal']
      },
      {
        input: 'process my order please',
        forbidden: ['order processed', 'processing your order', 'payment']
      }
    ];

    for (const test of boundaryTests) {
      console.log(`\nTesting: "${test.input}"`);
      const response = await this.makeRequest(test.input);
      
      if (response.status === 200) {
        const responseText = response.data.message.toLowerCase();
        const violations = test.forbidden.filter(phrase => 
          responseText.includes(phrase.toLowerCase())
        );

        this.results.push({
          testName: `Boundary: ${test.input.substring(0, 30)}...`,
          passed: violations.length === 0,
          issue: violations.length > 0 ? `Contains: ${violations.join(', ')}` : undefined,
          details: { response: responseText.substring(0, 150) }
        });
      }
    }
  }

  printResults() {
    console.log(colors.bold(colors.cyan('\n\n📊 TEST RESULTS SUMMARY')));
    console.log('=' .repeat(60));

    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.filter(r => !r.passed).length;
    const passRate = ((passed / this.results.length) * 100).toFixed(1);

    console.log(`\nTotal Tests: ${this.results.length}`);
    console.log(colors.green(`✅ Passed: ${passed}`));
    console.log(colors.red(`❌ Failed: ${failed}`));
    console.log(`Pass Rate: ${passRate}%`);

    if (failed > 0) {
      console.log(colors.red('\n\n⚠️  FAILED TESTS:'));
      console.log('-' .repeat(60));
      
      this.results.filter(r => !r.passed).forEach(result => {
        console.log(colors.red(`\n❌ ${result.testName}`));
        if (result.issue) {
          console.log(`   Issue: ${result.issue}`);
        }
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2).split('\n').join('\n   ')}`);
        }
      });
    }

    // Risk assessment
    console.log(colors.bold(colors.yellow('\n\n⚠️  RISK ASSESSMENT')));
    console.log('=' .repeat(60));

    const criticalFailures = [
      'Number Ref', 'Stock Check', 'Boundary', 'Race'
    ];

    const criticalFails = this.results.filter(r => 
      !r.passed && criticalFailures.some(cf => r.testName.includes(cf))
    );

    if (criticalFails.length > 0) {
      console.log(colors.red(`\nCRITICAL: ${criticalFails.length} critical test failures detected!`));
      console.log('These failures could lead to:');
      console.log('  • Incorrect product information being provided');
      console.log('  • False service capabilities being offered');
      console.log('  • Lost conversation context');
      console.log('  • Database corruption from race conditions');
    } else {
      console.log(colors.green('\n✅ No critical failures detected'));
    }

    return { passed, failed, passRate: parseFloat(passRate) };
  }
}

// Main execution
async function main() {
  console.log(colors.bold(colors.cyan('🔬 EDGE CASE TEST SUITE')));
  console.log('=' .repeat(60));
  console.log('Testing chat system against discovered edge cases...');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  // Check if server is running
  try {
    const health = await fetch('http://localhost:3000/api/health');
    if (!health.ok) {
      console.log(colors.red('\n❌ Server not responding on port 3000'));
      console.log('Please ensure the development server is running: npm run dev');
      process.exit(1);
    }
  } catch (error) {
    console.log(colors.red('\n❌ Cannot connect to localhost:3000'));
    console.log('Please ensure the development server is running: npm run dev');
    process.exit(1);
  }

  const tester = new EdgeCaseTester();

  // Run all test suites
  await tester.testNumberReferences();
  await tester.testStockChecking();
  await tester.testSpecialCharacters();
  await tester.testConversationContext();
  await tester.testRaceConditions();
  await tester.testServiceBoundaries();

  // Print results
  const summary = tester.printResults();

  // Exit code based on results
  if (summary.failed > 0) {
    console.log(colors.red(`\n\n❌ TEST SUITE FAILED: ${summary.failed} tests failed`));
    process.exit(1);
  } else {
    console.log(colors.green('\n\n✅ ALL TESTS PASSED!'));
    process.exit(0);
  }
}

// Run tests
main().catch(error => {
  console.error(colors.red('\n\n❌ Test suite error:'), error);
  process.exit(1);
});