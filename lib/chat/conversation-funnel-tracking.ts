/**
 * Conversation Funnel Tracking
 *
 * Handles recording of chat stages in conversion funnel
 */

import { recordChatStage } from '@/lib/analytics/funnel-analytics';
import { getDomainString, getCustomerEmailFromSession } from './conversation-domain-operations';

/**
 * Record chat initiation in funnel (non-blocking)
 * Logs errors but doesn't fail conversation creation
 */
export async function recordChatFunnelStage(
  conversationId: string,
  sessionId: string,
  domainId: string | null,
  supabase: any
): Promise<void> {
  if (!domainId) {
    return;
  }

  try {
    // Get domain string for funnel tracking
    const domainString = await getDomainString(domainId, supabase);

    if (!domainString) {
      return;
    }

    // Try to get customer email from customer_sessions
    const customerEmail = await getCustomerEmailFromSession(sessionId, supabase);

    if (!customerEmail) {
      return;
    }

    // Record chat initiation in funnel
    await recordChatStage(
      conversationId,
      customerEmail,
      domainString
    );
  } catch (error) {
    // Log but don't block conversation creation
    console.error('[ConversationManager] Failed to record chat funnel stage:', error);
  }
}
