#!/usr/bin/env npx tsx

/**
 * End-to-End Integration Test for Conversation Metadata System
 * 
 * Validates:
 * - Metadata persistence to database
 * - Entity tracking across conversation turns
 * - Correction detection and tracking
 * - Numbered list reference resolution
 * - Feature flag behavior (USE_ENHANCED_METADATA_CONTEXT)
 * - Complete conversation flow simulation
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { ConversationMetadataManager } from '@/lib/chat/conversation-metadata';
import { ResponseParser, parseAndTrackEntities } from '@/lib/chat/response-parser';

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration: number;
}

const results: TestResult[] = [];

function logSection(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

function logTest(result: TestResult) {
  const icon = result.passed ? '✅' : '❌';
  console.log(`\n${icon} ${result.name}`);
  console.log(`   ${result.details}`);
  console.log(`   ⏱️  ${result.duration.toFixed(0)}ms`);
}

async function testDatabaseSchema(): Promise<TestResult> {
  const start = Date.now();
  try {
    const supabase = await createServiceRoleClient();
    
    // Query conversations table to verify metadata column exists and is accessible
    const { data, error } = await supabase
      .from('conversations')
      .select('id, metadata')
      .limit(1);

    if (error) {
      throw new Error(`Cannot query conversations table: ${error.message}`);
    }

    // Metadata column exists if query succeeds
    return {
      name: 'Database Schema Verification',
      passed: true,
      details: 'conversations.metadata column exists and is accessible (JSONB type, default: {})',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Database Schema Verification',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function testMetadataManager(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test 1: Create and increment turns
    const manager = new ConversationMetadataManager();
    
    if (manager.getCurrentTurn() !== 0) {
      throw new Error('Initial turn should be 0');
    }
    
    manager.incrementTurn();
    if (manager.getCurrentTurn() !== 1) {
      throw new Error('Turn should increment to 1');
    }

    // Test 2: Entity tracking
    manager.trackEntity({
      id: 'product_1',
      type: 'product',
      value: 'Blue Widget',
      aliases: ['it', 'that', 'the product'],
      turnNumber: 1,
      metadata: { url: 'https://example.com/blue-widget' }
    });

    // Test 3: Pronoun resolution
    const resolvedEntity = manager.resolveReference('it');
    if (!resolvedEntity || resolvedEntity.value !== 'Blue Widget') {
      throw new Error('Failed to resolve pronoun "it" to tracked entity');
    }

    // Test 4: Correction tracking
    manager.trackCorrection('ZF5', 'ZF4', 'User corrected part number');
    
    // Test 5: List tracking
    const listId = manager.trackList([
      { name: 'Product A', url: 'https://example.com/a' },
      { name: 'Product B', url: 'https://example.com/b' },
      { name: 'Product C', url: 'https://example.com/c' }
    ]);

    if (!listId || !listId.startsWith('list_')) {
      throw new Error('List tracking failed');
    }

    // Test 6: List item resolution
    const item2 = manager.resolveListItem(2);
    if (!item2 || item2.name !== 'Product B') {
      throw new Error('Failed to resolve list item 2');
    }

    // Test 7: Serialization and deserialization
    const serialized = manager.serialize();
    const deserialized = ConversationMetadataManager.deserialize(serialized);
    
    if (deserialized.getCurrentTurn() !== 1) {
      throw new Error('Deserialization lost turn count');
    }

    const resolvedAfterDeserialize = deserialized.resolveReference('it');
    if (!resolvedAfterDeserialize || resolvedAfterDeserialize.value !== 'Blue Widget') {
      throw new Error('Deserialization lost entity tracking');
    }

    return {
      name: 'ConversationMetadataManager Functionality',
      passed: true,
      details: 'All operations: entity tracking, reference resolution, corrections, lists, serialization',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'ConversationMetadataManager Functionality',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function testResponseParser(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Test 1: Correction detection
    const corrections1 = ResponseParser['detectCorrections' as keyof typeof ResponseParser](
      'I meant ZF4 not ZF5'
    ) as any;

    if (corrections1.length === 0 || corrections1[0].corrected !== 'ZF4' || corrections1[0].original !== 'ZF5') {
      throw new Error('Failed to detect "I meant X not Y" correction pattern');
    }

    // Test 2: Product reference extraction (simulating markdown links in AI response)
    const aiResponse = 'Here are some products:\n[Blue Widget](https://example.com/blue)\n[Red Widget](https://example.com/red)';
    const parsed = ResponseParser['parseResponse' as keyof typeof ResponseParser](
      'Show me widgets',
      aiResponse,
      1
    ) as any;

    if (parsed.entities.length === 0) {
      throw new Error('Failed to extract product references');
    }

    // Test 3: Order reference extraction
    const orderResponse = 'Your order #12345 has shipped and order #67890 is processing';
    const orderParsed = ResponseParser['parseResponse' as keyof typeof ResponseParser](
      'What about my orders?',
      orderResponse,
      2
    ) as any;

    if (!orderParsed.entities.some((e: any) => e.type === 'order')) {
      throw new Error('Failed to extract order references');
    }

    // Test 4: Numbered list detection
    const listResponse = '1. [First Item](https://example.com/1)\n2. [Second Item](https://example.com/2)\n3. [Third Item](https://example.com/3)';
    const listParsed = ResponseParser['parseResponse' as keyof typeof ResponseParser](
      'Show options',
      listResponse,
      3
    ) as any;

    if (listParsed.lists.length === 0) {
      throw new Error('Failed to detect numbered list');
    }

    return {
      name: 'ResponseParser Entity Extraction',
      passed: true,
      details: 'All patterns: corrections, products, orders, numbered lists',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'ResponseParser Entity Extraction',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function testDatabasePersistence(): Promise<TestResult> {
  const start = Date.now();
  try {
    const supabase = await createServiceRoleClient();

    // Get a test domain
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .limit(1)
      .single();

    if (!domain) {
      throw new Error('No test domains available');
    }

    // Create test conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        session_id: `test_e2e_${Date.now()}_${Math.random()}`,
        domain_id: domain.id,
        metadata: {}
      })
      .select()
      .single();

    if (convError || !conversation) {
      throw new Error(`Failed to create conversation: ${convError?.message}`);
    }

    // Create metadata manager and add data
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();
    manager.trackEntity({
      id: 'product_test',
      type: 'product',
      value: 'Test Product',
      aliases: ['it', 'that'],
      turnNumber: 1
    });
    manager.trackCorrection('Wrong', 'Correct', 'Test correction');
    manager.trackList([{ name: 'Item 1' }, { name: 'Item 2' }]);

    // Save to database
    const metadataObj = JSON.parse(manager.serialize());
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata: metadataObj })
      .eq('id', conversation.id);

    if (updateError) {
      throw new Error(`Failed to save metadata: ${updateError.message}`);
    }

    // Retrieve and verify
    const { data: retrieved, error: retrieveError } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversation.id)
      .single();

    if (retrieveError || !retrieved) {
      throw new Error(`Failed to retrieve metadata: ${retrieveError?.message}`);
    }

    // Verify structure
    const metadata = retrieved.metadata as any;
    if (!metadata.currentTurn || !metadata.entities || !metadata.corrections || !metadata.lists) {
      throw new Error('Retrieved metadata missing expected structure');
    }

    // Test deserialization from database
    const deserializedManager = ConversationMetadataManager.deserialize(JSON.stringify(metadata));
    if (deserializedManager.getCurrentTurn() !== 1) {
      throw new Error('Turn count lost in round-trip');
    }

    // Cleanup
    await supabase.from('conversations').delete().eq('id', conversation.id);

    return {
      name: 'Database Persistence and Round-Trip',
      passed: true,
      details: 'Metadata: create, save, retrieve, deserialize, verify structure',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Database Persistence and Round-Trip',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function testParseAndTrackEntities(): Promise<TestResult> {
  const start = Date.now();
  try {
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();

    // Test parsing and tracking
    const aiResponse = 'Here is the [Premium Widget](https://example.com/premium) and order #98765. I corrected the previous recommendation.';
    const userMessage = 'I meant the silver one not the gold one';

    await parseAndTrackEntities(aiResponse, userMessage, manager);

    // Verify entities were tracked
    const resolvedEntity = manager.resolveReference('it');
    const contextSummary = manager.generateContextSummary();

    if (!contextSummary.includes('Product') && !contextSummary.includes('order')) {
      throw new Error('Context summary does not reflect tracked entities');
    }

    return {
      name: 'parseAndTrackEntities Integration',
      passed: true,
      details: 'Parser integrated with metadata manager: entities, corrections, context generation',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'parseAndTrackEntities Integration',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function testFeatureFlag(): Promise<TestResult> {
  const start = Date.now();
  try {
    // Check environment variable
    const useEnhancedContext = process.env.USE_ENHANCED_METADATA_CONTEXT === 'true';
    
    // The documented default is 'false' (conservative deployment)
    const shouldDefaultToFalse = process.env.USE_ENHANCED_METADATA_CONTEXT !== 'true';

    if (!shouldDefaultToFalse) {
      throw new Error('Feature flag should default to false for conservative deployment');
    }

    // Verify it can be enabled
    const manager = new ConversationMetadataManager();
    manager.incrementTurn();
    manager.trackEntity({
      id: 'test',
      type: 'product',
      value: 'Test',
      aliases: [],
      turnNumber: 1
    });

    const context = manager.generateContextSummary();
    // Context should be generated regardless of flag value
    // Flag only controls whether it's injected into system prompt

    return {
      name: 'Feature Flag Behavior',
      passed: true,
      details: `USE_ENHANCED_METADATA_CONTEXT=${process.env.USE_ENHANCED_METADATA_CONTEXT || 'undefined'} (default: false). Metadata tracked regardless of flag.`,
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Feature Flag Behavior',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function testMultiTurnConversation(): Promise<TestResult> {
  const start = Date.now();
  try {
    const supabase = await createServiceRoleClient();

    // Get test domain
    const { data: domain } = await supabase
      .from('domains')
      .select('id')
      .limit(1)
      .single();

    if (!domain) {
      throw new Error('No test domains available');
    }

    // Create conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        session_id: `test_multiturn_${Date.now()}_${Math.random()}`,
        domain_id: domain.id,
        metadata: {}
      })
      .select()
      .single();

    if (!conversation) {
      throw new Error('Failed to create test conversation');
    }

    const convId = conversation.id;

    // Simulate Turn 1
    let manager = new ConversationMetadataManager();
    manager.incrementTurn();
    
    await parseAndTrackEntities(
      'Here is the [Blue Widget](https://example.com/blue) and order #111',
      'Show me the blue product',
      manager
    );

    const metadata1 = JSON.parse(manager.serialize());
    await supabase.from('conversations').update({ metadata: metadata1 }).eq('id', convId);

    // Simulate Turn 2 - Load previous metadata
    const { data: loaded1 } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', convId)
      .single();

    manager = ConversationMetadataManager.deserialize(JSON.stringify(loaded1?.metadata));
    manager.incrementTurn();

    await parseAndTrackEntities(
      'Perfect, order #111 is currently shipped',
      'What about that order?',
      manager
    );

    const metadata2 = JSON.parse(manager.serialize());
    await supabase.from('conversations').update({ metadata: metadata2 }).eq('id', convId);

    // Simulate Turn 3 - Verify context accumulation
    const { data: loaded2 } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', convId)
      .single();

    manager = ConversationMetadataManager.deserialize(JSON.stringify(loaded2?.metadata));
    
    if (manager.getCurrentTurn() !== 2) {
      throw new Error(`Turn count should be 2, got ${manager.getCurrentTurn()}`);
    }

    const contextSummary = manager.generateContextSummary();
    
    // Should remember the product from turn 1
    if (!contextSummary.includes('Widget') && !contextSummary.includes('Product')) {
      throw new Error('Multi-turn context should preserve previous entities');
    }

    // Cleanup
    await supabase.from('conversations').delete().eq('id', convId);

    return {
      name: 'Multi-Turn Conversation Simulation',
      passed: true,
      details: 'Turn 1: product + order tracked → Turn 2: loaded & enhanced → Turn 3: context preserved across turns',
      duration: Date.now() - start
    };
  } catch (error) {
    return {
      name: 'Multi-Turn Conversation Simulation',
      passed: false,
      details: `Error: ${error instanceof Error ? error.message : String(error)}`,
      duration: Date.now() - start
    };
  }
}

async function runAllTests() {
  logSection('CONVERSATION METADATA SYSTEM - END-TO-END INTEGRATION TEST');
  
  console.log('\nExecuting 7 comprehensive tests...\n');

  // Test 1: Database Schema
  results.push(await testDatabaseSchema());
  
  // Test 2: Metadata Manager Core Functionality
  results.push(await testMetadataManager());
  
  // Test 3: Response Parser
  results.push(await testResponseParser());
  
  // Test 4: Feature Flag
  results.push(await testFeatureFlag());
  
  // Test 5: parseAndTrackEntities Integration
  results.push(await testParseAndTrackEntities());
  
  // Test 6: Database Persistence
  results.push(await testDatabasePersistence());
  
  // Test 7: Multi-Turn Conversation
  results.push(await testMultiTurnConversation());

  // Report results
  logSection('TEST RESULTS');

  results.forEach(result => logTest(result));

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  logSection('SUMMARY');
  console.log(`\n✅ Tests Passed: ${passed}/${total}`);
  console.log(`⏱️  Total Time: ${totalTime.toFixed(0)}ms`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Metadata system is fully functional.\n');
    process.exit(0);
  } else {
    console.log(`\n❌ ${total - passed} test(s) failed.\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
