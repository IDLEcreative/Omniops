#!/usr/bin/env tsx
/**
 * Test: Product URL Extraction Accuracy
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { RealProduct, TestResult } from './types';
import { parseAndTrack } from './helpers';

export async function testProductUrlExtractionAccuracy(products: RealProduct[]): Promise<TestResult> {
  if (products.length < 1) {
    console.error('❌ No products for URL extraction test');
    return {
      testName: 'Product URL Extraction Accuracy',
      passed: false,
      details: 'No products available',
      productsUsed: []
    };
  }

  console.log('\n🧪 TEST 5: Product URL Extraction Accuracy');
  console.log('=' .repeat(60));

  const product = products[0]!;
  const manager = new ConversationMetadataManager();

  manager.incrementTurn();
  const aiResponse = `Check out [${product.title}](${product.url}) for more details.`;
  await parseAndTrack(aiResponse, 'Show me options', manager);

  const contextSummary = manager.generateContextSummary();
  const entities = Array.from((manager as any).entities.values()) as any[];

  const productEntity = entities.find((e) => e.value === product.title);
  const urlMatches = productEntity?.metadata?.url === product.url;
  const passed = urlMatches;

  console.log('\n📋 Extracted Entity:');
  console.log(`   Product: ${productEntity?.value || 'NOT FOUND'}`);
  console.log(`   Expected URL: ${product.url}`);
  console.log(`   Extracted URL: ${productEntity?.metadata?.url || 'NOT FOUND'}`);
  console.log(`   URL Match: ${urlMatches ? '✅' : '❌'}`);

  return {
    testName: 'Product URL Extraction Accuracy',
    passed,
    details: `Tested URL extraction for "${product.title}"`,
    productsUsed: [product.title]
  };
}
