/**
 * Validation Tests for Metadata System Components
 * Tests ConversationMetadataManager and ResponseParser
 */

import { ConversationMetadataManager } from '../../lib/chat/conversation-metadata';
import { ResponseParser, parseAndTrackEntities } from '../../lib/chat/response-parser';

console.log('🧪 METADATA SYSTEM VALIDATION TESTS\n');
console.log('=' .repeat(70));

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => boolean | Promise<boolean>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(passed => {
        if (passed) {
          console.log(`✅ ${name}`);
          testsPassed++;
        } else {
          console.log(`❌ ${name}`);
          testsFailed++;
        }
      });
    } else {
      if (result) {
        console.log(`✅ ${name}`);
        testsPassed++;
      } else {
        console.log(`❌ ${name}`);
        testsFailed++;
      }
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error}`);
    testsFailed++;
  }
}

// Test Suite 1: ConversationMetadataManager
console.log('\n📦 Test Suite 1: ConversationMetadataManager');
console.log('-'.repeat(70));

test('Can create metadata manager instance', () => {
  const manager = new ConversationMetadataManager();
  return manager !== null && manager !== undefined;
});

test('Can track entities', () => {
  const manager = new ConversationMetadataManager();
  manager.trackEntity({
    id: 'product_1',
    type: 'product',
    value: 'A4VTG90 Pump',
    aliases: ['it', 'that', 'the pump'],
    turnNumber: 1
  });

  const entity = manager.resolveReference('it');
  return entity !== null && entity.value === 'A4VTG90 Pump';
});

test('Can track corrections', () => {
  const manager = new ConversationMetadataManager();
  manager.trackCorrection('ZF5', 'ZF4', 'User corrected pump model');

  const summary = manager.generateContextSummary();
  return summary.includes('ZF5') && summary.includes('ZF4') && summary.includes('corrected');
});

test('Can track numbered lists', () => {
  const manager = new ConversationMetadataManager();
  const listId = manager.trackList([
    { name: 'Product 1', url: 'https://example.com/1' },
    { name: 'Product 2', url: 'https://example.com/2' },
    { name: 'Product 3', url: 'https://example.com/3' }
  ]);

  const item2 = manager.resolveListItem(2);
  return item2 !== null && item2.name === 'Product 2';
});

test('Can resolve pronoun references', () => {
  const manager = new ConversationMetadataManager();
  manager.trackEntity({
    id: 'order_1',
    type: 'order',
    value: '12345',
    aliases: ['it', 'that', 'my order'],
    turnNumber: 1
  });

  const resolved = manager.resolveReference('my order');
  return resolved !== null && resolved.value === '12345';
});

test('Can resolve ordinal references', () => {
  const manager = new ConversationMetadataManager();
  manager.trackEntity({
    id: 'product_1',
    type: 'product',
    value: 'First Product',
    aliases: ['the first one'],
    turnNumber: 1
  });

  const resolved = manager.resolveReference('the first one');
  return resolved !== null && resolved.value === 'First Product';
});

test('Can increment turns', () => {
  const manager = new ConversationMetadataManager();
  const startTurn = manager.getCurrentTurn();
  manager.incrementTurn();
  return manager.getCurrentTurn() === startTurn + 1;
});

test('Can serialize and deserialize', () => {
  const manager = new ConversationMetadataManager();
  manager.trackEntity({
    id: 'test_1',
    type: 'product',
    value: 'Test Product',
    aliases: ['it'],
    turnNumber: 1
  });
  manager.incrementTurn();

  const serialized = manager.serialize();
  const deserialized = ConversationMetadataManager.deserialize(serialized);

  const entity = deserialized.resolveReference('it');
  return entity !== null && entity.value === 'Test Product' && deserialized.getCurrentTurn() === 1;
});

test('Handles malformed deserialization gracefully', () => {
  const manager = ConversationMetadataManager.deserialize('invalid json {]');
  return manager !== null && manager.getCurrentTurn() === 0;
});

// Test Suite 2: ResponseParser
console.log('\n📦 Test Suite 2: ResponseParser');
console.log('-'.repeat(70));

test('Can detect corrections: "I meant X not Y"', () => {
  const parsed = ResponseParser.parseResponse(
    'Sorry I meant ZF4 not ZF5',
    'Test response',
    1
  );

  return parsed.corrections.length === 1 &&
         parsed.corrections[0].original === 'ZF5' &&
         parsed.corrections[0].corrected === 'ZF4';
});

test('Can detect corrections: "actually it\'s X not Y"', () => {
  const parsed = ResponseParser.parseResponse(
    'Actually it\'s pump-123 not pump-456',
    'Test response',
    1
  );

  return parsed.corrections.length === 1 &&
         parsed.corrections[0].original === 'pump-456' &&
         parsed.corrections[0].corrected === 'pump-123';
});

test('Can extract product references from markdown links', () => {
  const aiResponse = `
Here are the available pumps:

- [A4VTG90 Hydraulic Pump](https://example.com/pump1)
- [Cifa Mixer Pump](https://example.com/pump2)
  `;

  const parsed = ResponseParser.parseResponse('', aiResponse, 1);

  return parsed.entities.length === 2 &&
         parsed.entities[0].type === 'product' &&
         parsed.entities[0].value === 'A4VTG90 Hydraulic Pump';
});

test('Filters out non-product links (docs, help, etc)', () => {
  const aiResponse = `
Check out [our documentation](https://example.com/docs) and [click here](https://example.com/help).
Also see [Product Name](https://example.com/product).
  `;

  const parsed = ResponseParser.parseResponse('', aiResponse, 1);

  // Should only extract the actual product, not docs/help
  return parsed.entities.length === 1 &&
         parsed.entities[0].value === 'Product Name';
});

test('Can detect order references', () => {
  const aiResponse = 'I found your order #12345 and order 67890 in the system.';

  const parsed = ResponseParser.parseResponse('', aiResponse, 1);

  return parsed.entities.some(e => e.type === 'order' && e.value === '12345') &&
         parsed.entities.some(e => e.type === 'order' && e.value === '67890');
});

test('Can detect numbered lists', () => {
  const aiResponse = `
Here are your options:

1. [Product One](https://example.com/1)
2. [Product Two](https://example.com/2)
3. [Product Three](https://example.com/3)
  `;

  const parsed = ResponseParser.parseResponse('', aiResponse, 1);

  return parsed.lists.length === 1 &&
         parsed.lists[0].items.length === 3 &&
         parsed.lists[0].items[1].name === 'Product Two';
});

test('Only tracks lists with 2+ items', () => {
  const aiResponse = `
Here is one item:
- [Single Product](https://example.com/1)
  `;

  const parsed = ResponseParser.parseResponse('', aiResponse, 1);

  return parsed.lists.length === 0; // Should not track single-item lists
});

// Test Suite 3: Integration
console.log('\n📦 Test Suite 3: Integration Tests');
console.log('-'.repeat(70));

test('parseAndTrackEntities works end-to-end', async () => {
  const manager = new ConversationMetadataManager();
  manager.incrementTurn();

  const userMessage = 'Sorry I meant ZF4 not ZF5';
  const aiResponse = `
Got it! Looking at ZF4. Here are the options:

1. [ZF4 Pro](https://example.com/zf4-pro)
2. [ZF4 Standard](https://example.com/zf4-std)
  `;

  await parseAndTrackEntities(aiResponse, userMessage, manager);

  const summary = manager.generateContextSummary();

  // Should have correction, products, and list
  const hasCorrection = summary.includes('ZF4') && summary.includes('ZF5');
  const hasProducts = summary.includes('ZF4 Pro') || summary.includes('product');
  const hasList = summary.includes('Item 1') || summary.includes('Item 2');

  return hasCorrection && hasProducts && hasList;
});

test('Context summary provides AI instructions', () => {
  const manager = new ConversationMetadataManager();
  manager.trackList([
    { name: 'Item 1' },
    { name: 'Item 2' }
  ]);

  const summary = manager.generateContextSummary();

  return summary.includes('Active Numbered List') &&
         summary.includes('item 2');
});

// Print Results
setTimeout(() => {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`📈 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

  if (testsFailed === 0) {
    console.log('\n🎉 All validation tests passed! Components are ready for integration.');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the components before proceeding.');
    process.exit(1);
  }
}, 100); // Small delay to ensure async tests complete
