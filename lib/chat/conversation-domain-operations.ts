/**
 * Conversation Domain Operations
 *
 * Handles domain lookup and normalization for conversations
 * with two-tier caching (Redis + Database)
 */

import { TwoTierCache } from '@/lib/cache/two-tier-cache';
import { CACHE_TTL } from '@/lib/cache/cache-config';

// Cache instance for domain lookups
const domainLookupCache = new TwoTierCache<string | null>({
  ttl: CACHE_TTL.DOMAIN_LOOKUP,
  prefix: 'domain-lookup',
});

/**
 * Look up domain ID from domain string with caching
 * Returns null if domain not found or on error
 *
 * Cache: L1 (Redis 15min) → L2 (Database)
 */
export async function lookupDomain(
  domain: string | undefined,
  supabase: any
): Promise<string | null> {
  if (!domain) {
    return null;
  }

  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');

  try {
    return await domainLookupCache.get(
      normalizedDomain,
      async () => {
        const { data: domainData } = await supabase
          .from('domains')
          .select('id')
          .eq('domain', normalizedDomain)
          .single();

        return domainData?.id || null;
      }
    );
  } catch (error) {
    console.error('[ConversationManager] Domain lookup error:', error);
    return null;
  }
}

/**
 * Invalidate domain lookup cache
 * Call this after adding/updating/deleting domains
 */
export async function invalidateDomainLookup(domain: string): Promise<void> {
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace('www.', '');
  await domainLookupCache.invalidate(normalizedDomain);
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
