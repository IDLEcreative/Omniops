/**
 * Conversation Manager
 *
 * Handles all database operations related to conversations and messages,
 * including domain lookups, conversation creation, and message persistence.
 */

export type ConversationMessage = {
  role: 'user' | 'assistant';
  content: string;
};

/**
 * Look up domain ID from domain string
 * Returns null if domain not found or on error
 */
export async function lookupDomain(
  domain: string | undefined,
  supabase: any
): Promise<string | null> {
  if (!domain) {
    return null;
  }

  try {
    const normalizedDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', normalizedDomain)
      .single();

    return domainData?.id || null;
  } catch (error) {
    console.error('[ConversationManager] Domain lookup error:', error);
    return null;
  }
}

/**
 * Get existing conversation or create a new one
 * Returns conversation ID
 */
export async function getOrCreateConversation(
  conversationId: string | undefined,
  sessionId: string,
  domainId: string | null,
  supabase: any
): Promise<string> {
  // Create new conversation if no ID provided
  if (!conversationId) {
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        session_id: sessionId,
        domain_id: domainId
      })
      .select()
      .single();

    if (convError) throw convError;
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
        domain_id: domainId
      });

    if (createError) {
      console.error('[ConversationManager] Failed to create conversation:', createError);
    }
  }

  return conversationId;
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
  supabase: any
): Promise<void> {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: response,
    });

  if (error) {
    console.error('[ConversationManager] Failed to save assistant message:', error);
  }
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
    return [];
  }

  return data || [];
}
