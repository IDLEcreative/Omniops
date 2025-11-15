#!/usr/bin/env tsx
/**
 * Test: Multiple Corrections in Sequence
 */

import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { RealProduct, TestResult } from './types';
import { parseAndTrack } from './helpers';

export async function testMultipleCorrectionsWithRealProducts(products: RealProduct[]): Promise<TestResult> {
  if (products.length < 3) {
    console.error('❌ Not enough products for multiple corrections test');
    return {
      testName: 'Multiple Corrections in Sequence',
      passed: false,
      details: 'Insufficient products',
      productsUsed: []
    };
  }

  console.log('\n🧪 TEST 4: Multiple Corrections in Sequence');
  console.log('=' .repeat(60));

  const [p1, p2, p3] = products;
  const manager = new ConversationMetadataManager();

  // First mention
  manager.incrementTurn();
  await parseAndTrack(
    `Looking at [${p1!.title}](${p1!.url})`,
    `Show me ${p1!.title}`,
    manager
  );

  // First correction
  manager.incrementTurn();
  await parseAndTrack(
    `Switching to [${p2!.title}](${p2!.url})`,
    `Actually ${p2!.title} not ${p1!.title}`,
    manager
  );

  // Second correction
  manager.incrementTurn();
  await parseAndTrack(
    `Now showing [${p3!.title}](${p3!.url})`,
    `Sorry, ${p3!.title} not ${p2!.title}`,
    manager
  );

  const contextSummary = manager.generateContextSummary();

  const hasBothCorrections =
    contextSummary.includes(p1!.title) &&
    contextSummary.includes(p2!.title) &&
    contextSummary.includes(p3!.title);

  const passed = hasBothCorrections;

  console.log('\n📋 Context Summary:');
  console.log(contextSummary);

  console.log('\n✅ Validation:');
  console.log(`   - All products tracked: ${hasBothCorrections ? '✅' : '❌'}`);

  return {
    testName: 'Multiple Corrections in Sequence',
    passed,
    details: `Tested ${p1!.title} → ${p2!.title} → ${p3!.title}`,
    productsUsed: [p1!.title, p2!.title, p3!.title]
  };
}
