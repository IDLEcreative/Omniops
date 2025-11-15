#!/usr/bin/env tsx
/**
 * Test: Pronoun Resolution with Real Data
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { RealProduct, TestResult } from './types';
import { parseAndTrack } from './helpers';

export async function testPronounResolutionWithRealData(products: RealProduct[]): Promise<TestResult> {
  if (products.length < 1) {
    console.error('❌ No products for pronoun test');
    return {
      testName: 'Pronoun Resolution with Real Data',
      passed: false,
      details: 'No products available',
      productsUsed: []
    };
  }

  console.log('\n🧪 TEST 3: Pronoun Resolution with Real Data');
  console.log('=' .repeat(60));

  const product = products[0]!;
  const manager = new ConversationMetadataManager();

  // Reference product by name
  manager.incrementTurn();
  const aiResponse = `Yes, we have [${product.title}](${product.url}) in stock.`;
  await parseAndTrack(aiResponse, `Do you have ${product.title}?`, manager);

  // Use pronoun "it"
  manager.incrementTurn();
  const resolved = manager.resolveReference('it');

  const passed = resolved?.value === product.title &&
                 resolved?.metadata?.url === product.url;

  console.log('\n📋 Initial Reference:');
  console.log(`   Product: ${product.title}`);
  console.log(`   URL: ${product.url}`);

  console.log('\n🔍 Resolving pronoun "it":');
  console.log(`   Expected: ${product.title}`);
  console.log(`   Resolved: ${resolved?.value || 'null'}`);
  console.log(`   URL Match: ${resolved?.metadata?.url === product.url ? '✅' : '❌'}`);

  return {
    testName: 'Pronoun Resolution with Real Data',
    passed,
    details: `Tested "it" resolving to "${product.title}"`,
    productsUsed: [product.title]
  };
}
