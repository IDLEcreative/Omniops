/**
 * Conversation Manager
 *
 * Main orchestrator for conversation and message operations
 */

import { recordChatFunnelStage } from './conversation-funnel-tracking';

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Re-export domain operations
export { lookupDomain } from './conversation-domain-operations';

// Re-export widget config + customer profile helpers
export { loadWidgetConfig, loadCustomerProfile } from './conversation-widget-config';
export type { WidgetConfig, CustomerProfile } from './conversation-widget-config';

/**
 * Get existing conversation or create a new one
 * Returns conversation ID
 */
export async function getOrCreateConversation(
  conversationId: string | undefined,
  sessionId: string,
  domainId: string | null,
  supabase: any,
  sessionMetadata?: any
): Promise<string> {
  // Create new conversation if no ID provided
  if (!conversationId) {
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        domain_id: domainId,
        metadata: sessionMetadata ? { session_metadata: sessionMetadata } : {}
      })
      .select()
      .single();

    if (convError) throw convError;

    // Record chat stage in funnel (non-blocking)
    await recordChatFunnelStage(newConversation.id, sessionId, domainId, supabase);

    return newConversation.id;
  }

  // Check if conversation exists
  const { data: existingConv } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .single();

  // Create conversation with specified ID if it doesn't exist
  if (!existingConv) {
    const { error: createError } = await supabase
      .from('conversations')
      .insert({
        id: conversationId,
        session_id: sessionId,
        domain_id: domainId,
        metadata: sessionMetadata ? { session_metadata: sessionMetadata } : {}
      });

    if (createError) {
      console.error('[ConversationManager] Failed to create conversation:', createError);
    }

    // Record chat stage in funnel (non-blocking)
    if (!createError) {
      await recordChatFunnelStage(conversationId, sessionId, domainId, supabase);
    }
  }

  return conversationId;
}

/**
 * Update conversation metadata with session tracking data
 * Used to save page views, session duration, and user journey
 */
export async function updateConversationMetadata(
  conversationId: string,
  sessionMetadata: any,
  supabase: any
): Promise<void> {
  if (!sessionMetadata) return;

  // Get existing metadata first
  const { data: existing } = await supabase
    .from('conversations')
    .select('metadata')
    .eq('id', conversationId)
    .single();

  const currentMetadata = existing?.metadata || {};

  // Merge session metadata (new data takes precedence)
  const updatedMetadata = {
    ...currentMetadata,
    session_metadata: sessionMetadata
  };

  const { error } = await supabase
    .from('conversations')
    .update({ metadata: updatedMetadata })
    .eq('id', conversationId);

  if (error) {
    console.error('[ConversationManager] Failed to update session metadata:', error);
  }
}

/**
 * Save a user message to the database
 */
export async function saveUserMessage(
  conversationId: string,
  message: string,
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: message,
    });

  if (error) {
    console.error('[ConversationManager] Failed to save user message:', error);
  }
}

/**
 * Save an assistant message to the database
 */
export async function saveAssistantMessage(
  conversationId: string,
  response: string,
  supabase: any,
  metadata?: any
): Promise<string | null> {
  const insertData: any = {
    conversation_id: conversationId,
    role: 'assistant',
    content: response,
  };

  // Add metadata if provided
  if (metadata) {
    insertData.metadata = metadata;
  }

  console.log('[ConversationManager] 💾 Saving assistant message with metadata:', {
    conversationId,
    hasMetadata: !!metadata,
    metadataKeys: metadata ? Object.keys(metadata) : [],
    shoppingProducts: metadata?.shoppingProducts?.length || 0,
    fullMetadata: metadata
  });

  const { data, error } = await supabase
    .from('messages')
    .insert(insertData)
    .select('id, metadata')
    .single();

  if (error) {
    console.error('[ConversationManager] Failed to save assistant message:', error);
    return null;
  }

  console.log('[ConversationManager] ✅ Message saved to DB:', {
    messageId: data?.id,
    savedMetadata: data?.metadata,
    metadataMatch: JSON.stringify(data?.metadata) === JSON.stringify(metadata)
  });

  return data?.id || null;
}

/**
 * Get conversation history from the database
 * Returns array of messages in chronological order
 */
export async function getConversationHistory(
  conversationId: string,
  limit: number = 20,
  supabase: any
): Promise<ConversationMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('[ConversationManager] Failed to fetch history:', error);
    console.warn(`[ConversationManager] Conversation ${conversationId} has NO history due to error`);
    return [];
  }

  const historyLength = data?.length || 0;
  console.log(`[ConversationManager] Loaded ${historyLength}/${limit} messages for conversation ${conversationId}`);

  if (historyLength === 0) {
    console.warn(`[ConversationManager] Conversation ${conversationId} has ZERO history messages`);
  }

  return data || [];
}
