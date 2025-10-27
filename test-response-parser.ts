/**
 * Test suite for ResponseParser
 * Validates regex patterns and edge case handling
 */

import { ResponseParser } from './lib/chat/response-parser';

interface TestCase {
  name: string;
  userMessage: string;
  aiResponse: string;
  expectedCorrections: number;
  expectedEntities: number;
  expectedLists: number;
  details?: string;
}

const testCases: TestCase[] = [
  // CORRECTION DETECTION TESTS
  {
    name: 'Correction: "I meant X not Y"',
    userMessage: 'Sorry, I meant ZF4 not ZF5',
    aiResponse: 'Got it, looking at ZF4 instead.',
    expectedCorrections: 1,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should detect: original=ZF5, corrected=ZF4',
  },
  {
    name: 'Correction: "not Y but X"',
    userMessage: 'not red but blue',
    aiResponse: 'Understood, switching to blue.',
    expectedCorrections: 1,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should detect: original=red, corrected=blue',
  },
  {
    name: 'Correction: Arrow notation "X → Y"',
    userMessage: 'red -> blue',
    aiResponse: 'Switching to blue.',
    expectedCorrections: 1,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should detect: original=red, corrected=blue',
  },
  {
    name: 'Correction: "I said X not Y"',
    userMessage: 'I said large, not medium',
    aiResponse: 'Got it, large size.',
    expectedCorrections: 1,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should detect: original=medium, corrected=large',
  },
  {
    name: 'Correction: "actually it\'s X not Y"',
    userMessage: 'actually it\'s premium not basic',
    aiResponse: 'Switching to premium.',
    expectedCorrections: 1,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should detect: original=basic, corrected=premium',
  },

  // PRODUCT EXTRACTION TESTS
  {
    name: 'Product: Single product with URL',
    userMessage: 'Show me pumps',
    aiResponse: 'Here is the [ZF4 Pump](https://example.com/products/zf4)',
    expectedCorrections: 0,
    expectedEntities: 1,
    expectedLists: 0,
    details: 'Should extract: ZF4 Pump with URL',
  },
  {
    name: 'Product: Multiple products with URLs',
    userMessage: 'Show me products',
    aiResponse: 'Check out [ZF4 Pump](https://example.com/zf4) and [ZF5 Pump](https://example.com/zf5)',
    expectedCorrections: 0,
    expectedEntities: 2,
    expectedLists: 0,
    details: 'Should extract: 2 products',
  },
  {
    name: 'Product: Filter out generic link text',
    userMessage: 'Tell me more',
    aiResponse: 'For details, [click here](https://example.com/info)',
    expectedCorrections: 0,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should NOT extract generic "click here" as product',
  },
  {
    name: 'Product: Filter out docs/support links',
    userMessage: 'Help',
    aiResponse: 'See our [documentation](https://docs.example.com/guide)',
    expectedCorrections: 0,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should NOT extract docs links as products',
  },

  // ORDER EXTRACTION TESTS
  {
    name: 'Order: With # prefix',
    userMessage: 'Check my order',
    aiResponse: 'Your order #12345 is being processed.',
    expectedCorrections: 0,
    expectedEntities: 1,
    expectedLists: 0,
    details: 'Should extract: order 12345',
  },
  {
    name: 'Order: Without # prefix',
    userMessage: 'Check my order',
    aiResponse: 'Your order 67890 has shipped.',
    expectedCorrections: 0,
    expectedEntities: 1,
    expectedLists: 0,
    details: 'Should extract: order 67890',
  },
  {
    name: 'Order: Alphanumeric ID',
    userMessage: 'Check my order',
    aiResponse: 'Your order ABC123 is ready.',
    expectedCorrections: 0,
    expectedEntities: 1,
    expectedLists: 0,
    details: 'Should extract: order ABC123',
  },
  {
    name: 'Order: Multiple orders',
    userMessage: 'Check orders',
    aiResponse: 'Order #111 is shipped, order #222 is pending.',
    expectedCorrections: 0,
    expectedEntities: 2,
    expectedLists: 0,
    details: 'Should extract: 2 orders',
  },

  // LIST DETECTION TESTS
  {
    name: 'List: Numbered list with 2+ items',
    userMessage: 'Show me options',
    aiResponse: '1. [Option A](https://example.com/a)\n2. [Option B](https://example.com/b)',
    expectedCorrections: 0,
    expectedEntities: 2, // List items are ALSO tracked as product entities
    expectedLists: 1,
    details: 'Should detect list with 2 items (and track items as products)',
  },
  {
    name: 'List: Bulleted list with dashes',
    userMessage: 'Show me options',
    aiResponse: '- [Option A](https://example.com/a)\n- [Option B](https://example.com/b)',
    expectedCorrections: 0,
    expectedEntities: 2, // List items are ALSO tracked as product entities
    expectedLists: 1,
    details: 'Should detect bulleted list (and track items as products)',
  },
  {
    name: 'List: Bulleted list with bullets',
    userMessage: 'Show me options',
    aiResponse: '• [Option A](https://example.com/a)\n• [Option B](https://example.com/b)',
    expectedCorrections: 0,
    expectedEntities: 2, // List items are ALSO tracked as product entities
    expectedLists: 1,
    details: 'Should detect bullet list (and track items as products)',
  },
  {
    name: 'List: Single item (should NOT be list)',
    userMessage: 'Show me one',
    aiResponse: '1. [Only Option](https://example.com/only)',
    expectedCorrections: 0,
    expectedEntities: 1, // Single item is still tracked as product
    expectedLists: 0, // But NOT as a list (need 2+ items)
    details: 'Should NOT detect list with only 1 item (but track as product)',
  },
  {
    name: 'List: 3+ items',
    userMessage: 'Show me many',
    aiResponse: '1. [A](https://a.com)\n2. [B](https://b.com)\n3. [C](https://c.com)',
    expectedCorrections: 0,
    expectedEntities: 3, // List items are ALSO tracked as product entities
    expectedLists: 1,
    details: 'Should detect list with 3 items (and track items as products)',
  },

  // COMBINED TESTS
  {
    name: 'Combined: Correction + Product',
    userMessage: 'Sorry, I meant blue not red',
    aiResponse: 'Here is the [Blue Widget](https://example.com/blue)',
    expectedCorrections: 1,
    expectedEntities: 1,
    expectedLists: 0,
    details: 'Should detect both correction and product',
  },
  {
    name: 'Combined: Product + Order',
    userMessage: 'What did I order?',
    aiResponse: 'Your order #999 includes [Premium Plan](https://example.com/premium)',
    expectedCorrections: 0,
    expectedEntities: 2,
    expectedLists: 0,
    details: 'Should detect both product and order',
  },

  // EDGE CASES
  {
    name: 'Edge: Empty messages',
    userMessage: '',
    aiResponse: '',
    expectedCorrections: 0,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should handle empty input gracefully',
  },
  {
    name: 'Edge: Very long correction values (should ignore)',
    userMessage: 'I meant ' + 'a'.repeat(60) + ' not ' + 'b'.repeat(60),
    aiResponse: 'Got it.',
    expectedCorrections: 0,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should ignore corrections with values >50 chars',
  },
  {
    name: 'Edge: Malformed markdown',
    userMessage: 'Show me',
    aiResponse: '[Product](incomplete url',
    expectedCorrections: 0,
    expectedEntities: 0,
    expectedLists: 0,
    details: 'Should handle malformed markdown gracefully',
  },
];

// Run tests
console.log('🧪 Testing ResponseParser\n');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n[Test ${index + 1}/${testCases.length}] ${testCase.name}`);
  console.log(`User: "${testCase.userMessage}"`);
  console.log(`AI: "${testCase.aiResponse}"`);

  const result = ResponseParser.parseResponse(
    testCase.userMessage,
    testCase.aiResponse,
    1 // turnNumber
  );

  const correctionCount = result.corrections.length;
  const entityCount = result.entities.length;
  const listCount = result.lists.length;

  const correctionsMatch = correctionCount === testCase.expectedCorrections;
  const entitiesMatch = entityCount === testCase.expectedEntities;
  const listsMatch = listCount === testCase.expectedLists;

  const testPassed = correctionsMatch && entitiesMatch && listsMatch;

  if (testPassed) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    console.log(`   Expected: ${testCase.expectedCorrections} corrections, ${testCase.expectedEntities} entities, ${testCase.expectedLists} lists`);
    console.log(`   Got:      ${correctionCount} corrections, ${entityCount} entities, ${listCount} lists`);
    failed++;
  }

  if (testCase.details) {
    console.log(`   ${testCase.details}`);
  }

  // Show parsed results for failed tests
  if (!testPassed) {
    if (result.corrections.length > 0) {
      console.log('   Corrections:', JSON.stringify(result.corrections, null, 2));
    }
    if (result.entities.length > 0) {
      console.log('   Entities:', JSON.stringify(result.entities.map(e => ({ type: e.type, value: e.value })), null, 2));
    }
    if (result.lists.length > 0) {
      console.log('   Lists:', JSON.stringify(result.lists, null, 2));
    }
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed}/${testCases.length} tests passed`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} test(s) failed`);
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
