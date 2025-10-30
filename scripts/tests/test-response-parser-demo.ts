/**
 * Demonstration of ResponseParser functionality
 * Shows how the parser detects corrections, products, orders, and lists
 */

import { ResponseParser } from './lib/chat/response-parser';
import { ConversationMetadataManager } from './lib/chat/conversation-metadata';

console.log('='.repeat(80));
console.log('ResponseParser Demonstration');
console.log('='.repeat(80));

// Test 1: Correction Detection
console.log('\n1. CORRECTION DETECTION');
console.log('-'.repeat(80));

const correctionTests = [
  "Sorry I meant ZF4 not ZF5",
  "Actually it's pump-123 not pump-456",
  "No wait, I said A4VTG90 instead of A4VTG80",
  "Not the red one but the blue one",
  "ZF4 → ZF5"
];

correctionTests.forEach((msg, i) => {
  const result = ResponseParser.parseResponse(msg, "", 1);
  console.log(`\nTest ${i + 1}: "${msg}"`);
  if (result.corrections.length > 0) {
    const c = result.corrections[0];
    console.log(`✅ Detected: "${c.original}" → "${c.corrected}"`);
  } else {
    console.log('❌ No correction detected');
  }
});

// Test 2: Product Reference Extraction
console.log('\n\n2. PRODUCT REFERENCE EXTRACTION');
console.log('-'.repeat(80));

const productResponse = `
I found these pumps for you:
1. [ZF4 Hydraulic Pump](https://example.com/products/zf4)
2. [A4VTG90 Variable Pump](https://example.com/products/a4vtg90)

Would you like more details about any of these?
`;

const productResult = ResponseParser.parseResponse("", productResponse, 2);
console.log(`\nAI Response excerpt: "I found these pumps..."`);
console.log(`\nExtracted ${productResult.entities.length} products:`);
productResult.entities.forEach(entity => {
  console.log(`  ✅ ${entity.value}`);
  console.log(`     - ID: ${entity.id}`);
  console.log(`     - URL: ${entity.metadata?.url}`);
  console.log(`     - Aliases: ${entity.aliases.join(', ')}`);
});

// Test 3: Order Reference Extraction
console.log('\n\n3. ORDER REFERENCE EXTRACTION');
console.log('-'.repeat(80));

const orderResponse = `
Your order #12345 has been shipped. You can track order #12345
using the tracking number provided in your email.
`;

const orderResult = ResponseParser.parseResponse("", orderResponse, 3);
console.log(`\nAI Response excerpt: "Your order #12345 has been shipped..."`);
console.log(`\nExtracted ${orderResult.entities.length} orders:`);
orderResult.entities.forEach(entity => {
  console.log(`  ✅ Order ${entity.value}`);
  console.log(`     - Aliases: ${entity.aliases.join(', ')}`);
});

// Test 4: Numbered List Detection
console.log('\n\n4. NUMBERED LIST DETECTION');
console.log('-'.repeat(80));

const listResponse = `
Here are the available pumps:

1. [ZF4 Pump](https://example.com/zf4)
2. [ZF5 Pump](https://example.com/zf5)
3. [A4VTG90 Pump](https://example.com/a4vtg90)

Let me know which one interests you!
`;

const listResult = ResponseParser.parseResponse("", listResponse, 4);
console.log(`\nAI Response with numbered list (3 items)`);
console.log(`\nDetected ${listResult.lists.length} list(s):`);
listResult.lists.forEach((list, i) => {
  console.log(`  List ${i + 1}: ${list.items.length} items`);
  list.items.forEach((item, j) => {
    console.log(`    ${j + 1}. ${item.name}`);
    console.log(`       URL: ${item.url}`);
  });
});

// Test 5: Complete Integration with ConversationMetadataManager
console.log('\n\n5. COMPLETE INTEGRATION TEST');
console.log('-'.repeat(80));

const manager = new ConversationMetadataManager();
manager.incrementTurn();

// Simulate a conversation turn
const userMsg = "Sorry I meant ZF4 not ZF5";
const aiMsg = `
Got it! Looking at ZF4 instead. Here are the ZF4 models:

1. [ZF4-Pro](https://example.com/zf4-pro)
2. [ZF4-Standard](https://example.com/zf4-standard)

Which one would you like to know more about?
`;

const parsed = ResponseParser.parseResponse(userMsg, aiMsg, manager.getCurrentTurn());

// Track everything
parsed.corrections.forEach(c => {
  manager.trackCorrection(c.original, c.corrected, userMsg);
});
parsed.entities.forEach(e => {
  manager.trackEntity(e);
});
parsed.lists.forEach(l => {
  manager.trackList(l.items);
});

console.log('\nConversation Turn:', manager.getCurrentTurn());
console.log('\nTracked Data:');
console.log('  - Corrections:', parsed.corrections.length);
console.log('  - Entities:', parsed.entities.length);
console.log('  - Lists:', parsed.lists.length);

console.log('\nGenerated Context Summary:');
console.log(manager.generateContextSummary());

// Test 6: Serialization
console.log('\n\n6. SERIALIZATION TEST');
console.log('-'.repeat(80));

const serialized = manager.serialize();
console.log('Serialized metadata length:', serialized.length, 'characters');

const deserialized = ConversationMetadataManager.deserialize(serialized);
console.log('✅ Successfully deserialized');
console.log('Current turn after deserialization:', deserialized.getCurrentTurn());

console.log('\n' + '='.repeat(80));
console.log('Demonstration Complete!');
console.log('='.repeat(80));
