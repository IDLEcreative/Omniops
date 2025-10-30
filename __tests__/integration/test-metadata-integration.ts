/**
 * Quick test to verify metadata integration in chat route
 * Tests that ConversationMetadataManager is loaded, incremented, and saved
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

async function testMetadataIntegration() {
  console.log('🧪 Testing Metadata Integration in Chat Route\n');

  const supabase = await createServiceRoleClient();

  // Get a test domain
  const { data: domain } = await supabase
    .from('domains')
    .select('id')
    .limit(1)
    .single();

  if (!domain) {
    console.error('❌ No domains found in database');
    return;
  }

  // Create a test conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .insert({
      session_id: `test_metadata_${Date.now()}`,
      domain_id: domain.id,
      metadata: {}
    })
    .select()
    .single();

  if (convError || !conversation) {
    console.error('❌ Failed to create test conversation:', convError);
    return;
  }

  console.log('✅ Created test conversation:', conversation.id);

  // Simulate what the chat route does:
  // 1. Load metadata
  const { data: convMetadata } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversation.id)
    .single();

  console.log('✅ Loaded metadata:', convMetadata?.metadata);

  // 2. Test ConversationMetadataManager import
  try {
    const { ConversationMetadataManager } = await import('@/lib/chat/conversation-metadata');
    console.log('✅ ConversationMetadataManager imported successfully');

    // 3. Create manager
    const metadataManager = convMetadata?.metadata
      ? ConversationMetadataManager.deserialize(JSON.stringify(convMetadata.metadata))
      : new ConversationMetadataManager();

    console.log('✅ Created metadata manager, current turn:', metadataManager.getCurrentTurn());

    // 4. Increment turn
    metadataManager.incrementTurn();
    console.log('✅ Incremented turn, new turn:', metadataManager.getCurrentTurn());

    // 5. Generate context summary
    const enhancedContext = metadataManager.generateContextSummary();
    console.log('✅ Generated context summary:', enhancedContext.length, 'chars');

    // 6. Test entity tracking
    metadataManager.trackEntity({
      id: 'test_product_1',
      type: 'product',
      value: 'Test Product',
      aliases: ['it', 'that'],
      turnNumber: metadataManager.getCurrentTurn(),
      metadata: { url: 'https://example.com/product' }
    });
    console.log('✅ Tracked test entity');

    // 7. Test parseAndTrackEntities import
    const { parseAndTrackEntities } = await import('@/lib/chat/response-parser');
    console.log('✅ parseAndTrackEntities imported successfully');

    // 8. Test parsing
    await parseAndTrackEntities(
      'Here is the [Test Product](https://example.com/product) you requested.',
      'Show me products',
      metadataManager
    );
    console.log('✅ Parsed and tracked entities from response');

    // 9. Serialize and save
    const serialized = metadataManager.serialize();
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ metadata: JSON.parse(serialized) })
      .eq('id', conversation.id);

    if (updateError) {
      console.error('❌ Failed to save metadata:', updateError);
    } else {
      console.log('✅ Saved metadata to database');
    }

    // 10. Verify saved metadata
    const { data: verifyData } = await supabase
      .from('conversations')
      .select('metadata')
      .eq('id', conversation.id)
      .single();

    console.log('✅ Verified saved metadata:');
    console.log('   - Current turn:', verifyData?.metadata?.currentTurn);
    console.log('   - Entities:', verifyData?.metadata?.entities?.length || 0);
    console.log('   - Corrections:', verifyData?.metadata?.corrections?.length || 0);
    console.log('   - Lists:', verifyData?.metadata?.lists?.length || 0);

  } catch (error) {
    console.error('❌ Error during metadata operations:', error);
  }

  // Cleanup
  await supabase
    .from('conversations')
    .delete()
    .eq('id', conversation.id);

  console.log('\n✅ Test completed, cleaned up test data');
}

testMetadataIntegration().catch(console.error);
