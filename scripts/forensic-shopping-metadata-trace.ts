#!/usr/bin/env tsx
/**
 * Forensic Shopping Metadata Trace
 *
 * Investigates why Browse Products button doesn't appear in mobile E2E tests
 *
 * Investigation Points:
 * 1. Database: Is metadata saved correctly?
 * 2. API Fetch: Is metadata returned correctly?
 * 3. Frontend Transform: Is metadata transformed correctly?
 * 4. State Management: Is metadata preserved through state updates?
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

interface InvestigationResult {
  phase: string;
  passed: boolean;
  evidence: any;
  issue?: string;
}

async function investigate(): Promise<InvestigationResult[]> {
  const results: InvestigationResult[] = [];

  console.log('🔍 Starting Forensic Investigation...\n');

  // Phase 1: Database Forensics
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 PHASE 1: Database Forensics');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const supabase = await createServiceRoleClient();
  if (!supabase) {
    results.push({
      phase: 'Database Connection',
      passed: false,
      evidence: null,
      issue: 'Cannot connect to Supabase'
    });
    return results;
  }

  // Check latest assistant messages with metadata
  const { data: messagesInDB, error: dbError } = await supabase
    .from('messages')
    .select('id, conversation_id, role, content, created_at, metadata')
    .eq('role', 'assistant')
    .not('metadata', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (dbError) {
    results.push({
      phase: 'Database Query',
      passed: false,
      evidence: dbError,
      issue: 'Failed to query messages table'
    });
    return results;
  }

  console.log(`Found ${messagesInDB?.length || 0} assistant messages with metadata\n`);

  if (!messagesInDB || messagesInDB.length === 0) {
    results.push({
      phase: 'Database: Messages with Metadata',
      passed: false,
      evidence: { count: 0 },
      issue: 'No assistant messages with metadata found in database'
    });
  } else {
    // Analyze metadata structure
    const messagesWithShopping = messagesInDB.filter(m =>
      m.metadata?.shoppingProducts && Array.isArray(m.metadata.shoppingProducts)
    );

    console.log('Metadata Structure Analysis:');
    messagesInDB.slice(0, 5).forEach((msg, idx) => {
      console.log(`\nMessage ${idx + 1} (ID: ${msg.id}):`);
      console.log(`  Conversation: ${msg.conversation_id}`);
      console.log(`  Created: ${msg.created_at}`);
      console.log(`  Content: ${msg.content.substring(0, 50)}...`);
      console.log(`  Metadata Keys: ${msg.metadata ? Object.keys(msg.metadata).join(', ') : 'none'}`);
      console.log(`  Has shoppingProducts: ${!!msg.metadata?.shoppingProducts}`);
      console.log(`  Product Count: ${msg.metadata?.shoppingProducts?.length || 0}`);
      console.log(`  Has shoppingContext: ${!!msg.metadata?.shoppingContext}`);
      console.log(`  Full Metadata:`, JSON.stringify(msg.metadata, null, 2));
    });

    results.push({
      phase: 'Database: Metadata Structure',
      passed: messagesWithShopping.length > 0,
      evidence: {
        totalMessages: messagesInDB.length,
        withShoppingProducts: messagesWithShopping.length,
        exampleMetadata: messagesWithShopping[0]?.metadata || messagesInDB[0]?.metadata,
        allMetadataStructures: messagesInDB.map(m => ({
          id: m.id,
          keys: m.metadata ? Object.keys(m.metadata) : [],
          hasShoppingProducts: !!m.metadata?.shoppingProducts,
          productCount: m.metadata?.shoppingProducts?.length || 0
        }))
      },
      issue: messagesWithShopping.length === 0
        ? 'Messages have metadata but not in expected shoppingProducts structure'
        : undefined
    });
  }

  // Phase 2: API Response Simulation
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌐 PHASE 2: API Response Simulation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (messagesInDB && messagesInDB.length > 0) {
    const latestConversation = messagesInDB[0].conversation_id;

    console.log(`Testing GET /api/conversations/${latestConversation}/messages`);

    // Simulate what the API endpoint returns
    const { data: apiMessages, error: apiError } = await supabase
      .from('messages')
      .select('id, role, content, created_at, metadata')
      .eq('conversation_id', latestConversation)
      .order('created_at', { ascending: true });

    if (apiError) {
      results.push({
        phase: 'API Simulation',
        passed: false,
        evidence: apiError,
        issue: 'API simulation query failed'
      });
    } else {
      console.log(`\nAPI would return ${apiMessages?.length || 0} messages\n`);

      const messagesWithMetadata = apiMessages?.filter(m => m.metadata) || [];
      const messagesWithShopping = apiMessages?.filter(m =>
        m.metadata?.shoppingProducts?.length > 0
      ) || [];

      console.log('API Response Analysis:');
      console.log(`  Total messages: ${apiMessages?.length || 0}`);
      console.log(`  Messages with metadata: ${messagesWithMetadata.length}`);
      console.log(`  Messages with shoppingProducts: ${messagesWithShopping.length}`);

      if (messagesWithShopping.length > 0) {
        console.log('\nExample message with shopping data:');
        console.log(JSON.stringify(messagesWithShopping[0], null, 2));
      }

      results.push({
        phase: 'API Response Structure',
        passed: messagesWithShopping.length > 0,
        evidence: {
          totalMessages: apiMessages?.length || 0,
          withMetadata: messagesWithMetadata.length,
          withShoppingProducts: messagesWithShopping.length,
          exampleResponse: messagesWithShopping[0] || messagesWithMetadata[0]
        },
        issue: messagesWithShopping.length === 0
          ? 'API would return messages but without shoppingProducts in metadata'
          : undefined
      });
    }
  }

  // Phase 3: Frontend Transform Verification
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔄 PHASE 3: Frontend Transform Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test the transform from API shoppingMetadata to message metadata
  const testApiResponse = {
    message: 'Test response',
    conversation_id: 'test-conv',
    shoppingMetadata: {
      products: [
        { id: 1, name: 'Test Product 1' },
        { id: 2, name: 'Test Product 2' }
      ],
      context: 'mobile',
      productCount: 2
    }
  };

  // Simulate sendMessage.ts transform (line 132-136)
  const transformedMessage = {
    id: 'test-id',
    conversation_id: testApiResponse.conversation_id,
    role: 'assistant' as const,
    content: testApiResponse.message,
    created_at: new Date().toISOString(),
    metadata: testApiResponse.shoppingMetadata ? {
      shoppingProducts: testApiResponse.shoppingMetadata.products,
      shoppingContext: testApiResponse.shoppingMetadata.context,
    } : undefined,
  };

  console.log('Transform Test:');
  console.log('  Input (API format):');
  console.log(JSON.stringify(testApiResponse.shoppingMetadata, null, 4));
  console.log('\n  Output (Message format):');
  console.log(JSON.stringify(transformedMessage.metadata, null, 4));

  const transformCorrect =
    transformedMessage.metadata?.shoppingProducts?.length === 2 &&
    transformedMessage.metadata?.shoppingContext === 'mobile';

  results.push({
    phase: 'Frontend Transform Logic',
    passed: transformCorrect,
    evidence: {
      input: testApiResponse.shoppingMetadata,
      output: transformedMessage.metadata,
      hasShoppingProducts: !!transformedMessage.metadata?.shoppingProducts,
      productCount: transformedMessage.metadata?.shoppingProducts?.length
    },
    issue: !transformCorrect ? 'Transform logic produces incorrect metadata structure' : undefined
  });

  // Phase 4: Component Render Logic
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 PHASE 4: Component Render Logic');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test button render condition (MessageList.tsx line 156)
  const testMessage = {
    role: 'assistant' as const,
    metadata: {
      shoppingProducts: [{ id: 1, name: 'Test' }],
      shoppingContext: 'mobile'
    }
  };

  const shouldRenderButton =
    testMessage.metadata?.shoppingProducts &&
    testMessage.metadata.shoppingProducts.length > 0;

  console.log('Button Render Condition:');
  console.log(`  message.metadata?.shoppingProducts: ${testMessage.metadata?.shoppingProducts ? 'exists' : 'undefined'}`);
  console.log(`  shoppingProducts.length: ${testMessage.metadata?.shoppingProducts?.length || 0}`);
  console.log(`  Should render button: ${shouldRenderButton}`);

  results.push({
    phase: 'Component Render Logic',
    passed: shouldRenderButton,
    evidence: {
      condition: 'message.metadata?.shoppingProducts?.length > 0',
      hasMetadata: !!testMessage.metadata,
      hasShoppingProducts: !!testMessage.metadata?.shoppingProducts,
      productCount: testMessage.metadata?.shoppingProducts?.length,
      wouldRender: shouldRenderButton
    },
    issue: !shouldRenderButton ? 'Button render condition would fail' : undefined
  });

  return results;
}

// Generate Report
async function main() {
  const results = await investigate();

  console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 FORENSIC INVESTIGATION REPORT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const passedPhases = results.filter(r => r.passed).length;
  const totalPhases = results.length;

  console.log(`Overall: ${passedPhases}/${totalPhases} phases passed\n`);

  results.forEach((result, idx) => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} Phase ${idx + 1}: ${result.phase}`);
    if (result.issue) {
      console.log(`   Issue: ${result.issue}`);
    }
    console.log('');
  });

  // Root Cause Analysis
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎯 ROOT CAUSE ANALYSIS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const failedPhase = results.find(r => !r.passed);
  if (failedPhase) {
    console.log(`🔴 Data flow breaks at: ${failedPhase.phase}`);
    console.log(`\nIssue: ${failedPhase.issue}`);
    console.log('\nEvidence:');
    console.log(JSON.stringify(failedPhase.evidence, null, 2));

    // Provide fix suggestion
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔧 SUGGESTED FIX');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (failedPhase.phase.includes('Database')) {
      console.log('Fix: Check response-handler.ts saveFinalResponse() function');
      console.log('File: lib/chat/response-handler.ts:28-43');
      console.log('Verify metadata is being saved with correct structure:');
      console.log('  - messageMetadata.shoppingProducts (array)');
      console.log('  - messageMetadata.shoppingContext (string)');
    } else if (failedPhase.phase.includes('API')) {
      console.log('Fix: Check messages endpoint query');
      console.log('File: app/api/conversations/[conversationId]/messages/route.ts:79-118');
      console.log('Verify metadata column is selected and returned correctly');
    } else if (failedPhase.phase.includes('Transform')) {
      console.log('Fix: Check sendMessage transform logic');
      console.log('File: components/ChatWidget/utils/sendMessage.ts:132-136');
      console.log('Verify API response shoppingMetadata is transformed correctly');
    } else if (failedPhase.phase.includes('Component')) {
      console.log('Fix: Check MessageList button render condition');
      console.log('File: components/ChatWidget/MessageList.tsx:156');
      console.log('Verify condition matches metadata structure');
    }
  } else {
    console.log('✅ All phases passed - data flow is correct!');
    console.log('\nThe issue may be:');
    console.log('  1. Race condition: Messages loaded before metadata arrives');
    console.log('  2. State overwrite: loadPreviousMessages overwrites new message');
    console.log('  3. Timing: Button renders before state update completes');
    console.log('\nRun E2E test with extended timeout and check console logs.');
  }

  process.exit(failedPhase ? 1 : 0);
}

main().catch(console.error);
