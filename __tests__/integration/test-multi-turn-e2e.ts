/**
 * Multi-Turn Conversation E2E Tests (Tests 8-13)
 *
 * CRITICAL: Makes REAL API calls to validate 86% conversation accuracy claim
 *
 * Prerequisites:
 * - Dev server running on port 3000
 * - OPENAI_API_KEY set
 * - Test domain configured in Supabase
 *
 * Run: npx tsx test-multi-turn-e2e.ts
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const TEST_DOMAIN = process.env.TEST_DOMAIN || 'thompsonseparts.co.uk';

interface ChatResponse {
  message: string;
  conversation_id: string;
  sources?: Array<{ url: string; title: string; relevance: number }>;
}

interface TestResult {
  testName: string;
  passed: boolean;
  reason: string;
  conversationId?: string;
}

const testConversations: string[] = [];

async function sendMessage(message: string, conversationId?: string): Promise<{
  response: string;
  conversationId: string;
  metadata: any;
}> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      domain: TEST_DOMAIN,
      conversation_id: conversationId,
      session_id: `test_e2e_${Date.now()}_${Math.random()}`
    })
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${await response.text()}`);
  }

  const data: ChatResponse = await response.json();
  const metadata = await fetchMetadataFromDB(data.conversation_id);

  return {
    response: data.message,
    conversationId: data.conversation_id,
    metadata
  };
}

async function fetchMetadataFromDB(conversationId: string): Promise<any> {
  const supabase = await createServiceRoleClient();
  const { data } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  return data?.metadata || {};
}

// Test 8: Out-of-bounds list references
async function test8_outOfBoundsReferences(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 8: Out-of-bounds list reference handling');

    const turn1 = await sendMessage('Show me your top 3 products');
    testConversations.push(turn1.conversationId);

    if (!turn1.metadata.lists) {
      return {
        testName: 'Test 8: Out-of-bounds references',
        passed: false,
        reason: 'No list created in Turn 1'
      };
    }

    const turn2 = await sendMessage('Tell me about item 5', turn1.conversationId);

    const responseLower = turn2.response.toLowerCase();
    const hasCorrectBehavior =
      responseLower.includes('only') ||
      responseLower.includes('three') ||
      responseLower.includes('3') ||
      responseLower.includes('which one') ||
      responseLower.includes('clarif');

    const hallucinatedItem5 = /item 5.*(?:cost|price|feature)/i.test(turn2.response);

    if (hasCorrectBehavior && !hallucinatedItem5) {
      return {
        testName: 'Test 8: Out-of-bounds references',
        passed: true,
        reason: 'AI correctly handled out-of-bounds reference',
        conversationId: turn1.conversationId
      };
    } else {
      return {
        testName: 'Test 8: Out-of-bounds references',
        passed: false,
        reason: hallucinatedItem5 ? 'AI hallucinated item 5' : 'AI did not explain limitation'
      };
    }
  } catch (error) {
    return {
      testName: 'Test 8: Out-of-bounds references',
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Test 9: Context accumulation (CRITICAL - 86% accuracy validation)
async function test9_contextAccumulation(): Promise<TestResult & { accuracy?: number }> {
  try {
    console.log('\n🧪 Test 9: Context accumulation across 5+ turns (CRITICAL)');

    const turnResults: Array<{ turn: number; success: boolean; reason: string }> = [];

    // Turn 1
    const turn1 = await sendMessage('What types of products do you have?');
    testConversations.push(turn1.conversationId);

    const turn1Success =
      turn1.response.length > 50 &&
      !turn1.response.toLowerCase().includes("don't understand");

    turnResults.push({
      turn: 1,
      success: turn1Success,
      reason: turn1Success ? 'Provided product categories' : 'Insufficient response'
    });

    // Turn 2
    const turn2 = await sendMessage('Show me the first type you mentioned', turn1.conversationId);
    const turn2Success =
      turn2.response.length > 50 &&
      !turn2.response.toLowerCase().includes("which") &&
      !turn2.response.toLowerCase().includes("don't understand");

    turnResults.push({
      turn: 2,
      success: turn2Success,
      reason: turn2Success ? 'Resolved category reference' : 'Failed to resolve'
    });

    // Turn 3
    const turn3 = await sendMessage('What are the prices?', turn2.conversationId);
    const turn3Success =
      (turn3.response.toLowerCase().includes('price') ||
       turn3.response.toLowerCase().includes('cost') ||
       turn3.response.match(/\$\d+/)) &&
      !turn3.response.toLowerCase().includes("which product");

    turnResults.push({
      turn: 3,
      success: turn3Success,
      reason: turn3Success ? 'Resolved price query' : 'Lost context'
    });

    // Turn 4
    const turn4 = await sendMessage('Are they in stock?', turn3.conversationId);
    const turn4Success =
      (turn4.response.toLowerCase().includes('stock') ||
       turn4.response.toLowerCase().includes('available')) &&
      !turn4.response.toLowerCase().includes("which one");

    turnResults.push({
      turn: 4,
      success: turn4Success,
      reason: turn4Success ? 'Resolved pronoun "they"' : 'Failed pronoun'
    });

    // Turn 5
    const turn5 = await sendMessage('Can I get more details about the first one?', turn4.conversationId);
    const turn5Success =
      turn5.response.length > 50 &&
      !turn5.response.toLowerCase().includes("which") &&
      !turn5.response.toLowerCase().includes("don't understand");

    turnResults.push({
      turn: 5,
      success: turn5Success,
      reason: turn5Success ? 'Resolved list reference' : 'Failed reference'
    });

    // Calculate accuracy
    const successfulTurns = turnResults.filter(t => t.success).length;
    const accuracy = (successfulTurns / turnResults.length) * 100;

    console.log('\n📊 Turn-by-turn results:');
    turnResults.forEach(result => {
      console.log(`  Turn ${result.turn}: ${result.success ? '✅' : '❌'} ${result.reason}`);
    });
    console.log(`\n🎯 Accuracy: ${accuracy}% (${successfulTurns}/${turnResults.length})`);

    const finalMetadata = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: 'Test 9: Context accumulation (86% accuracy)',
      passed: accuracy >= 86 && finalMetadata.currentTurn >= 5,
      reason: accuracy >= 86
        ? `✅ Achieved ${accuracy}% accuracy (target: 86%)`
        : `❌ Only ${accuracy}% accuracy (target: 86%)`,
      accuracy,
      conversationId: turn1.conversationId
    };
  } catch (error) {
    return {
      testName: 'Test 9: Context accumulation',
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Test 10: Context switching
async function test10_contextSwitching(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 10: Context switching gracefully');

    const turn1 = await sendMessage('Show me your products');
    testConversations.push(turn1.conversationId);

    const turn2 = await sendMessage('What about pricing?', turn1.conversationId);
    const turn3 = await sendMessage('Actually, I want to check on my order status', turn2.conversationId);

    const turn3RecognizesSwitch =
      turn3.response.toLowerCase().includes('order') ||
      turn3.response.toLowerCase().includes('track');

    if (!turn3RecognizesSwitch) {
      return {
        testName: 'Test 10: Context switching',
        passed: false,
        reason: 'Failed to recognize context switch to orders'
      };
    }

    const turn4 = await sendMessage('Going back to the products, tell me about the first one', turn3.conversationId);
    const turn4RetainsContext =
      turn4.response.length > 50 &&
      !turn4.response.toLowerCase().includes("which product");

    const metadata = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: 'Test 10: Context switching',
      passed: turn4RetainsContext && metadata.currentTurn >= 4,
      reason: turn4RetainsContext
        ? '✅ Successfully switched context and returned'
        : '❌ Lost product context after switch',
      conversationId: turn1.conversationId
    };
  } catch (error) {
    return {
      testName: 'Test 10: Context switching',
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Test 11: Intent tracking
async function test11_intentTracking(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 11: Conversation intent change tracking');

    const turn1 = await sendMessage('I need to find a hydraulic pump');
    testConversations.push(turn1.conversationId);

    const turn1IsProductSearch =
      turn1.response.toLowerCase().includes('pump') ||
      turn1.response.toLowerCase().includes('product');

    const turn2 = await sendMessage('Actually, can you help me track my order #12345?', turn1.conversationId);

    const turn2IsOrderLookup =
      turn2.response.toLowerCase().includes('order') ||
      turn2.response.toLowerCase().includes('12345') ||
      turn2.response.toLowerCase().includes('track');

    const metadata = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: 'Test 11: Intent tracking',
      passed: turn1IsProductSearch && turn2IsOrderLookup && metadata.entities !== undefined,
      reason: (turn1IsProductSearch && turn2IsOrderLookup)
        ? '✅ Tracked both product and order intents'
        : '❌ Failed to track intent changes',
      conversationId: turn1.conversationId
    };
  } catch (error) {
    return {
      testName: 'Test 11: Intent tracking',
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Test 12: Metadata persistence
async function test12_metadataPersistence(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 12: Metadata persistence after each turn');

    const turn1 = await sendMessage('Show me pumps');
    testConversations.push(turn1.conversationId);

    const dbMetadata1 = await fetchMetadataFromDB(turn1.conversationId);
    if (dbMetadata1.currentTurn !== 1) {
      return {
        testName: 'Test 12: Metadata persistence',
        passed: false,
        reason: `Turn 1 metadata incorrect: expected 1, got ${dbMetadata1.currentTurn}`
      };
    }

    const turn2 = await sendMessage('What about the first one?', turn1.conversationId);
    const dbMetadata2 = await fetchMetadataFromDB(turn1.conversationId);

    if (dbMetadata2.currentTurn !== 2) {
      return {
        testName: 'Test 12: Metadata persistence',
        passed: false,
        reason: `Turn 2 metadata incorrect: expected 2, got ${dbMetadata2.currentTurn}`
      };
    }

    const turn3 = await sendMessage('Tell me more about it', turn2.conversationId);
    const dbMetadata3 = await fetchMetadataFromDB(turn1.conversationId);

    const allPersisted =
      dbMetadata3.currentTurn === 3 &&
      dbMetadata3.currentTurn > dbMetadata2.currentTurn &&
      dbMetadata2.currentTurn > dbMetadata1.currentTurn;

    return {
      testName: 'Test 12: Metadata persistence',
      passed: allPersisted,
      reason: allPersisted
        ? '✅ Metadata persisted correctly across all turns'
        : '❌ Metadata not cumulative',
      conversationId: turn1.conversationId
    };
  } catch (error) {
    return {
      testName: 'Test 12: Metadata persistence',
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// Test 13: Metadata updates on context changes
async function test13_metadataUpdates(): Promise<TestResult> {
  try {
    console.log('\n🧪 Test 13: Metadata updates when context changes');

    const turn1 = await sendMessage('Show me ZF5 pumps');
    testConversations.push(turn1.conversationId);

    const dbMetadata1 = await fetchMetadataFromDB(turn1.conversationId);
    if (dbMetadata1.currentTurn !== 1) {
      return {
        testName: 'Test 13: Metadata updates',
        passed: false,
        reason: 'Initial metadata not saved'
      };
    }

    const turn2 = await sendMessage('Sorry, I meant ZF4 not ZF5', turn1.conversationId);
    const dbMetadata2 = await fetchMetadataFromDB(turn1.conversationId);

    // Should detect correction
    const hasCorrections = dbMetadata2.corrections !== undefined;

    let correctionDetected = false;
    if (Array.isArray(dbMetadata2.corrections) && dbMetadata2.corrections.length > 0) {
      const correction = dbMetadata2.corrections[0];
      correctionDetected =
        /ZF5/i.test(correction.originalValue) &&
        /ZF4/i.test(correction.correctedValue);
    }

    const turn3 = await sendMessage('What are the prices for those?', turn2.conversationId);

    const mentionsWrongModel = turn3.response.toLowerCase().includes('zf5');
    const dbMetadata3 = await fetchMetadataFromDB(turn1.conversationId);

    return {
      testName: 'Test 13: Metadata updates',
      passed: hasCorrections && !mentionsWrongModel && dbMetadata3.currentTurn === 3,
      reason: hasCorrections
        ? (correctionDetected
          ? '✅ Correction detected and metadata updated'
          : '✅ Corrections tracked, history preserved')
        : '❌ Correction not detected in metadata',
      conversationId: turn1.conversationId
    };
  } catch (error) {
    return {
      testName: 'Test 13: Metadata updates',
      passed: false,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

async function cleanup() {
  if (testConversations.length > 0) {
    console.log(`\n🧹 Cleaning up ${testConversations.length} test conversations...`);
    const supabase = await createServiceRoleClient();
    await supabase
      .from('conversations')
      .delete()
      .in('id', testConversations);
    console.log('✅ Cleanup complete');
  }
}

async function main() {
  console.log('🚀 Multi-Turn Conversation E2E Tests (Tests 8-13)\n');
  console.log('Testing against:', API_BASE_URL);
  console.log('Domain:', TEST_DOMAIN);

  const results: TestResult[] = [];

  try {
    // Run tests sequentially to avoid race conditions
    results.push(await test8_outOfBoundsReferences());
    results.push(await test9_contextAccumulation());
    results.push(await test10_contextSwitching());
    results.push(await test11_intentTracking());
    results.push(await test12_metadataPersistence());
    results.push(await test13_metadataUpdates());

    // Print summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL RESULTS');
    console.log('='.repeat(70));

    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const accuracy = (passed / total) * 100;

    results.forEach(result => {
      console.log(`${result.passed ? '✅' : '❌'} ${result.testName}`);
      console.log(`   ${result.reason}`);
      if (result.conversationId) {
        console.log(`   Conversation ID: ${result.conversationId}`);
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log(`🎯 Tests Passing: ${passed}/${total} (${accuracy.toFixed(1)}%)`);

    // Check for Test 9 specifically
    const test9Result = results.find(r => r.testName.includes('Test 9'));
    if (test9Result && 'accuracy' in test9Result) {
      console.log(`🔥 Conversation Accuracy: ${test9Result.accuracy}% (Target: >= 86%)`);
    }

    console.log('='.repeat(70));

    if (accuracy >= 100) {
      console.log('\n🎉 ALL TESTS PASSED! 86% accuracy claim validated!');
    } else if (passed >= 4) {
      console.log('\n⚠️  Most tests passed, but some issues detected.');
    } else {
      console.log('\n❌ CRITICAL: Multiple test failures detected.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error during test execution:', error);
  } finally {
    await cleanup();
  }
}

main().catch(console.error);
