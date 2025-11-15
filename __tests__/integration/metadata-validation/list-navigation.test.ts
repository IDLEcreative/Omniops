#!/usr/bin/env tsx
/**
 * Test: List Navigation with Real Products
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { RealProduct, TestResult } from './types';
import { parseAndTrack } from './helpers';

export async function testListNavigationWithRealProducts(products: RealProduct[]): Promise<TestResult> {
  if (products.length < 3) {
    console.error('❌ Not enough products for list test');
    return {
      testName: 'List Navigation with Real Products',
      passed: false,
      details: 'Insufficient products',
      productsUsed: []
    };
  }

  console.log('\n🧪 TEST 2: List Navigation with Real Products');
  console.log('=' .repeat(60));

  const testProducts = products.slice(0, 3);
  const manager = new ConversationMetadataManager();

  // Create numbered list from real products
  manager.incrementTurn();
  const aiResponse = `Here are the available options:\n\n` +
    testProducts.map((p, idx) => `${idx + 1}. [${p.title}](${p.url})`).join('\n');

  await parseAndTrack(aiResponse, 'Show me products', manager);

  // User references item 2
  manager.incrementTurn();
  const resolved = manager.resolveReference('item 2');

  const expectedProduct = testProducts[1]!;
  const passed = resolved?.value === expectedProduct.title &&
                 resolved?.metadata?.url === expectedProduct.url;

  console.log('\n📋 AI Response (Numbered List):');
  console.log(aiResponse);

  console.log('\n🔍 Resolving "item 2":');
  console.log(`   Expected: ${expectedProduct.title}`);
  console.log(`   Resolved: ${resolved?.value || 'null'}`);
  console.log(`   URL Match: ${resolved?.metadata?.url === expectedProduct.url ? '✅' : '❌'}`);

  return {
    testName: 'List Navigation with Real Products',
    passed,
    details: `Tested "item 2" resolution to "${expectedProduct.title}"`,
    productsUsed: testProducts.map(p => p.title)
  };
}
