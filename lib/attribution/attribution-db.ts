/**
 * Purchase Attribution Database Operations
 *
 * Database queries for purchase attribution and customer session tracking
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  PurchaseAttribution,
  CustomerSession,
  AttributionContext,
} from '@/types/purchase-attribution';

/**
 * Save a purchase attribution to the database
 */
export async function savePurchaseAttribution(params: {
  conversationId: string | null;
  customerEmail: string;
  orderId: string;
  orderNumber?: string;
  platform: 'woocommerce' | 'shopify';
  orderTotal: number;
  currency: string;
  attributionConfidence: number;
  attributionMethod: 'session_match' | 'email_match' | 'time_proximity' | 'no_match' | 'manual';
  attributionReasoning: string;
  orderMetadata?: Record<string, any>;
  orderCreatedAt?: Date;
}): Promise<PurchaseAttribution | null> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('purchase_attributions')
    .insert({
      conversation_id: params.conversationId,
      customer_email: params.customerEmail,
      order_id: params.orderId,
      order_number: params.orderNumber || null,
      platform: params.platform,
      order_total: params.orderTotal,
      currency: params.currency,
      attribution_confidence: params.attributionConfidence,
      attribution_method: params.attributionMethod,
      attribution_reasoning: params.attributionReasoning,
      order_metadata: params.orderMetadata || {},
      order_created_at: params.orderCreatedAt?.toISOString() || null,
    })
    .select()
    .single();

  if (error) {
    // Check if it's a duplicate
    if (error.code === '23505') { // Unique constraint violation
      console.log(`[Attribution DB] Purchase already attributed: ${params.platform}:${params.orderId}`);
      return null;
    }

    console.error('[Attribution DB] Error saving purchase attribution:', error);
    throw error;
  }

  return data as PurchaseAttribution;
}

/**
 * Get recent conversations by customer email
 */
export async function getRecentConversationsByEmail(
  email: string,
  domain: string,
  withinDays: number = 7
): Promise<Array<{
  id: string;
  session_id: string | null;
  domain_id: string;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
  lastMessageAt: string | null;
  messageCount: number;
}>> {
  const supabase = await createServiceRoleClient();

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - withinDays);

  // First, get the domain_id
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', domain)
    .single();

  if (!domainData) {
    return [];
  }

  const { data, error } = await supabase
    .from('conversations')
    .select(`
      id,
      session_id,
      domain_id,
      created_at,
      updated_at,
      metadata,
      messages!inner(created_at)
    `)
    .eq('domain_id', domainData.id)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Attribution DB] Error fetching conversations:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Process results to get last message time and count
  return data.map((conv: any) => {
    const messages = conv.messages || [];
    const lastMessage = messages.length > 0
      ? messages.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]
      : null;

    return {
      id: conv.id,
      session_id: conv.session_id,
      domain_id: conv.domain_id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      metadata: conv.metadata,
      lastMessageAt: lastMessage?.created_at || null,
      messageCount: messages.length,
    };
  });
}

/**
 * Get active session for customer email
 */
export async function getActiveSessionByEmail(
  email: string,
  domain: string,
  withinHours: number = 24
): Promise<{
  sessionId: string;
  conversationId: string;
  lastActivity: Date;
} | null> {
  const supabase = await createServiceRoleClient();

  const cutoffDate = new Date();
  cutoffDate.setHours(cutoffDate.getHours() - withinHours);

  // Look up in customer_sessions first
  const { data: sessionData } = await supabase
    .from('customer_sessions')
    .select('session_id')
    .eq('customer_email', email)
    .eq('domain', domain)
    .gte('last_seen_at', cutoffDate.toISOString())
    .order('last_seen_at', { ascending: false })
    .limit(1)
    .single();

  if (!sessionData) {
    return null;
  }

  // Get the most recent conversation for this session
  const { data: convData } = await supabase
    .from('conversations')
    .select('id, updated_at')
    .eq('session_id', sessionData.session_id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (!convData) {
    return null;
  }

  return {
    sessionId: sessionData.session_id,
    conversationId: convData.id,
    lastActivity: new Date(convData.updated_at),
  };
}

/**
 * Link customer email to session
 */
export async function linkEmailToSession(
  email: string,
  sessionId: string,
  domain: string
): Promise<void> {
  const supabase = await createServiceRoleClient();

  // Upsert customer session
  const { error } = await supabase
    .from('customer_sessions')
    .upsert(
      {
        customer_email: email,
        session_id: sessionId,
        domain,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'customer_email,session_id,domain',
        ignoreDuplicates: false,
      }
    );

  if (error) {
    console.error('[Attribution DB] Error linking email to session:', error);
    throw error;
  }
}

/**
 * Get customer metrics for returning customer detection
 */
export async function getCustomerMetrics(
  email: string,
  domain: string
): Promise<{
  isReturningCustomer: boolean;
  totalConversations: number;
  totalPurchases: number;
  lifetimeValue: number;
  firstSeenAt: Date | null;
  lastSeenAt: Date | null;
}> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('customer_sessions')
    .select('*')
    .eq('customer_email', email)
    .eq('domain', domain)
    .order('first_seen_at', { ascending: true });

  if (error || !data || data.length === 0) {
    return {
      isReturningCustomer: false,
      totalConversations: 0,
      totalPurchases: 0,
      lifetimeValue: 0,
      firstSeenAt: null,
      lastSeenAt: null,
    };
  }

  // Aggregate across all sessions
  const totalConversations = data.reduce((sum, s) => sum + (s.total_conversations || 0), 0);
  const totalPurchases = data.reduce((sum, s) => sum + (s.total_purchases || 0), 0);
  const lifetimeValue = data.reduce((sum, s) => sum + parseFloat(s.lifetime_value || '0'), 0);
  const firstSeenAt = new Date(data[0].first_seen_at);
  const lastSeenAt = new Date(data[data.length - 1].last_seen_at);

  return {
    isReturningCustomer: totalPurchases > 1,
    totalConversations,
    totalPurchases,
    lifetimeValue,
    firstSeenAt,
    lastSeenAt,
  };
}
