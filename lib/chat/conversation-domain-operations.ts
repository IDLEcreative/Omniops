/**
 * Conversation Domain Operations
 *
 * Handles domain lookup and normalization for conversations
 */

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
 * Get domain string from domain ID
 * Used for funnel tracking and analytics
 */
export async function getDomainString(
  domainId: string,
  supabase: any
): Promise<string | null> {
  try {
    const { data: domainData } = await supabase
      .from('domains')
      .select('domain')
      .eq('id', domainId)
      .single();

    return domainData?.domain || null;
  } catch (error) {
    console.error('[ConversationManager] Get domain string error:', error);
    return null;
  }
}

/**
 * Get customer email from session
 * Used for funnel tracking
 */
export async function getCustomerEmailFromSession(
  sessionId: string,
  supabase: any
): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase
      .from('customer_sessions')
      .select('customer_email')
      .eq('session_id', sessionId)
      .single();

    return sessionData?.customer_email || null;
  } catch (error) {
    console.error('[ConversationManager] Get customer email error:', error);
    return null;
  }
}
