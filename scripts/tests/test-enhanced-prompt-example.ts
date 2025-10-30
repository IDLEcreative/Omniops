/**
 * Enhanced Prompt Example Output
 *
 * Demonstrates the actual enhanced prompt content with metadata
 */

import { ConversationMetadataManager } from './lib/chat/conversation-metadata';
import { getEnhancedCustomerServicePrompt } from './lib/chat/system-prompts';

console.log('='.repeat(100));
console.log('ENHANCED SYSTEM PROMPT - EXAMPLE OUTPUT');
console.log('='.repeat(100));
console.log();

// Create a realistic conversation scenario
const metadata = new ConversationMetadataManager();

// Turn 1: User asks about a product
metadata.incrementTurn();
metadata.trackEntity({
  id: 'product_1_pump',
  type: 'product',
  value: 'A4VTG90 Hydraulic Pump',
  aliases: ['it', 'that', 'this', 'the pump'],
  turnNumber: 1,
  metadata: { sku: 'A4VTG90', price: '$899.99' }
});

// Turn 2: User provides a correction
metadata.incrementTurn();
metadata.trackCorrection('ZF5', 'ZF4', 'Sorry, I meant ZF4 not ZF5');

// Turn 3: AI shows a numbered list of alternatives
metadata.incrementTurn();
metadata.trackList([
  { name: 'ZF4 Premium Hydraulic Pump', url: 'https://example.com/zf4-premium' },
  { name: 'ZF4 Standard Hydraulic Pump', url: 'https://example.com/zf4-standard' },
  { name: 'ZF4 Economy Hydraulic Pump', url: 'https://example.com/zf4-economy' }
]);

// Turn 4: User asks about an order
metadata.incrementTurn();
metadata.trackEntity({
  id: 'order_4_12345',
  type: 'order',
  value: '12345',
  aliases: ['it', 'that', 'my order'],
  turnNumber: 4
});

// Generate the enhanced prompt
const enhancedPrompt = getEnhancedCustomerServicePrompt(metadata);

console.log('SCENARIO:');
console.log('  Turn 1: User asks about "A4VTG90 Hydraulic Pump"');
console.log('  Turn 2: User corrects "ZF5" → "ZF4"');
console.log('  Turn 3: AI shows numbered list of ZF4 alternatives');
console.log('  Turn 4: User mentions order #12345');
console.log();
console.log('='.repeat(100));
console.log('ENHANCED SYSTEM PROMPT OUTPUT:');
console.log('='.repeat(100));
console.log();
console.log(enhancedPrompt);
console.log();
console.log('='.repeat(100));
console.log('END OF ENHANCED PROMPT');
console.log('='.repeat(100));
console.log();

// Show statistics
const lines = enhancedPrompt.split('\n').length;
const words = enhancedPrompt.split(/\s+/).length;
const chars = enhancedPrompt.length;

console.log('STATISTICS:');
console.log(`  Lines: ${lines}`);
console.log(`  Words: ${words}`);
console.log(`  Characters: ${chars}`);
console.log(`  Estimated Tokens: ~${Math.ceil(words * 1.3)}`);
console.log();

// Highlight key sections
console.log('KEY SECTIONS INCLUDED:');
console.log('  ✓ Base customer service instructions');
console.log('  ✓ Search behavior rules');
console.log('  ✓ Context & memory handling');
console.log('  ✓ Anti-hallucination safeguards');
console.log('  ✓ Important corrections tracking (ZF5 → ZF4)');
console.log('  ✓ Recently mentioned entities (pump, order)');
console.log('  ✓ Active numbered list (3 ZF4 alternatives)');
console.log('  ✓ Reference resolution rules');
console.log('  ✓ Conversation quality standards');
console.log();
console.log('✅ Complete context-aware system prompt generated!');
