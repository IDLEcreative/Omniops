#!/usr/bin/env tsx
/**
 * Test: Correction Tracking with Real Products
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { ResponseParser } from '../../../lib/chat/response-parser';
import { RealProduct, TestResult } from './types';
import { parseAndTrack } from './helpers';

export async function testCorrectionTrackingWithRealProducts(products: RealProduct[]): Promise<TestResult> {
  if (products.length < 2) {
    console.error('❌ Not enough products for correction test');
    return {
      testName: 'Correction Tracking with Real Products',
      passed: false,
      details: 'Insufficient products',
      productsUsed: []
    };
  }

  console.log('\n🧪 TEST 1: Correction Tracking with Real Products');
  console.log('=' .repeat(60));

  const product1 = products[0]!;
  const product2 = products[1]!;

  const manager = new ConversationMetadataManager();

  // Simulate conversation
  const userMsg1 = `I need parts for ${product1.title}`;
  const aiResponse1 = `Here are the available parts for [${product1.title}](${product1.url})`;

  manager.incrementTurn();
  await parseAndTrack(aiResponse1, userMsg1, manager);

  // User corrects
  const userMsg2 = `Sorry, I meant ${product2.title} not ${product1.title}`;
  const aiResponse2 = `Got it, looking at [${product2.title}](${product2.url}) instead`;

  manager.incrementTurn();
  await parseAndTrack(aiResponse2, userMsg2, manager);

  // Validate
  const contextSummary = manager.generateContextSummary();

  const hasCorrection = contextSummary.includes(product1.title) &&
                        contextSummary.includes(product2.title);
  const hasProduct2Entity = contextSummary.includes(product2.title);

  const passed = hasCorrection && hasProduct2Entity;

  console.log('\n📋 Context Summary Generated:');
  console.log(contextSummary);

  console.log('\n✅ Validation:');
  console.log(`   - Correction tracked: ${hasCorrection ? '✅' : '❌'}`);
  console.log(`   - Corrected product entity tracked: ${hasProduct2Entity ? '✅' : '❌'}`);

  return {
    testName: 'Correction Tracking with Real Products',
    passed,
    details: `Tested correction from "${product1.title}" to "${product2.title}"`,
    productsUsed: [product1.title, product2.title]
  };
}
