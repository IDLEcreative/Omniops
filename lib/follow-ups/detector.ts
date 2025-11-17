/**
 * Follow-up Detector
 *
 * Analyzes conversations to detect when automated follow-ups are needed
 * Triggers: abandoned conversations, unresolved issues, low satisfaction
 */

import type { SupabaseClient } from '@/lib/supabase/server';

export type FollowUpReason =
  | 'abandoned_conversation'
  | 'unresolved_issue'
  | 'low_satisfaction'
  | 'cart_abandonment'
  | 'unanswered_question'
  | 'product_inquiry';

export interface FollowUpCandidate {
  conversation_id: string;
  session_id: string;
  reason: FollowUpReason;
  priority: 'low' | 'medium' | 'high';
  metadata: {
    last_message_at: string;
    message_count: number;
    sentiment_score?: number;
    has_product_inquiry?: boolean;
    has_cart_activity?: boolean;
    customer_email?: string;
  };
}

export interface DetectionOptions {
  abandonmentThresholdMinutes?: number; // Default: 30 minutes
  lowSatisfactionThreshold?: number; // Default: 40 out of 100
  minMessagesForFollowUp?: number; // Default: 2
  maxFollowUpAttempts?: number; // Default: 2
}

/**
 * Detect conversations that need automated follow-ups
 */
export async function detectFollowUpCandidates(
  supabase: SupabaseClient,
  domainIds: string[],
  options: DetectionOptions = {}
): Promise<FollowUpCandidate[]> {
  const {
    abandonmentThresholdMinutes = 30,
    lowSatisfactionThreshold = 40,
    minMessagesForFollowUp = 2,
    maxFollowUpAttempts = 2,
  } = options;

  const candidates: FollowUpCandidate[] = [];

  // Calculate time threshold for abandonment
  const abandonmentThreshold = new Date();
  abandonmentThreshold.setMinutes(abandonmentThreshold.getMinutes() - abandonmentThresholdMinutes);

  // 1. Find abandoned conversations (user asked question, no recent activity)
  const { data: abandonedConvos } = await supabase
    .from('conversations')
    .select(`
      id,
      session_id,
      created_at,
      metadata,
      messages!inner(id, role, created_at, content, metadata)
    `)
    .in('domain_id', domainIds)
    .lt('messages.created_at', abandonmentThreshold.toISOString())
    .order('messages.created_at', { ascending: false })
    .limit(100);

  if (abandonedConvos) {
    for (const convo of abandonedConvos) {
      const messages = convo.messages || [];

      // Skip if too few messages
      if (messages.length < minMessagesForFollowUp) continue;

      // Check if last message was from user (indicates they're waiting)
      const lastMessage = messages[0];
      if (lastMessage?.role === 'user') {
        // Check if we haven't already sent too many follow-ups
        const existingFollowUps = await countExistingFollowUps(supabase, convo.id);
        if (existingFollowUps >= maxFollowUpAttempts) continue;

        candidates.push({
          conversation_id: convo.id,
          session_id: convo.session_id,
          reason: 'abandoned_conversation',
          priority: 'medium',
          metadata: {
            last_message_at: lastMessage.created_at,
            message_count: messages.length,
            customer_email: extractEmail(convo.metadata),
          },
        });
      }
    }
  }

  // 2. Find conversations with low satisfaction indicators
  const { data: lowSatisfactionConvos } = await supabase
    .from('conversations')
    .select(`
      id,
      session_id,
      created_at,
      metadata,
      messages!inner(id, role, content, metadata, created_at)
    `)
    .in('domain_id', domainIds)
    .gte('created_at', abandonmentThreshold.toISOString())
    .limit(100);

  if (lowSatisfactionConvos) {
    for (const convo of lowSatisfactionConvos) {
      const messages = convo.messages || [];
      if (messages.length < minMessagesForFollowUp) continue;

      // Analyze sentiment from messages
      const sentimentScore = analyzeSentiment(messages);
      if (sentimentScore < lowSatisfactionThreshold) {
        const existingFollowUps = await countExistingFollowUps(supabase, convo.id);
        if (existingFollowUps >= maxFollowUpAttempts) continue;

        candidates.push({
          conversation_id: convo.id,
          session_id: convo.session_id,
          reason: 'low_satisfaction',
          priority: 'high', // High priority for unhappy customers
          metadata: {
            last_message_at: messages[0]?.created_at,
            message_count: messages.length,
            sentiment_score: sentimentScore,
            customer_email: extractEmail(convo.metadata),
          },
        });
      }
    }
  }

  // 3. Find cart abandonments (if session metadata shows cart activity)
  const { data: cartAbandoned } = await supabase
    .from('conversations')
    .select(`
      id,
      session_id,
      created_at,
      metadata,
      messages!inner(id, created_at)
    `)
    .in('domain_id', domainIds)
    .lt('created_at', abandonmentThreshold.toISOString())
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .limit(100);

  if (cartAbandoned) {
    for (const convo of cartAbandoned) {
      const sessionMetadata = convo.metadata?.session_metadata;

      // Check if session shows cart activity but no checkout
      if (sessionMetadata?.page_views) {
        const hasCartActivity = sessionMetadata.page_views.some((pv: any) =>
          pv.url?.includes('/cart') || pv.url?.includes('/basket')
        );
        const hasCheckout = sessionMetadata.page_views.some((pv: any) =>
          pv.url?.includes('/checkout') || pv.url?.includes('/order-confirmation')
        );

        if (hasCartActivity && !hasCheckout) {
          const existingFollowUps = await countExistingFollowUps(supabase, convo.id);
          if (existingFollowUps >= maxFollowUpAttempts) continue;

          candidates.push({
            conversation_id: convo.id,
            session_id: convo.session_id,
            reason: 'cart_abandonment',
            priority: 'high', // High priority for potential sales
            metadata: {
              last_message_at: convo.messages?.[0]?.created_at,
              message_count: convo.messages?.length || 0,
              has_cart_activity: true,
              customer_email: extractEmail(convo.metadata),
            },
          });
        }
      }
    }
  }

  return candidates;
}

/**
 * Count how many follow-ups have already been sent for a conversation
 */
async function countExistingFollowUps(
  supabase: SupabaseClient,
  conversationId: string
): Promise<number> {
  const { count } = await supabase
    .from('follow_up_logs')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  return count || 0;
}

/**
 * Analyze sentiment from messages (simple keyword-based)
 */
function analyzeSentiment(messages: any[]): number {
  const negativeKeywords = [
    'not working', 'broken', 'frustrated', 'terrible', 'awful',
    'disappointed', 'angry', 'unacceptable', 'poor', 'bad',
    'useless', 'waste', 'horrible', 'worst', 'never again',
  ];

  const positiveKeywords = [
    'thank', 'great', 'excellent', 'perfect', 'amazing',
    'love', 'helpful', 'good', 'appreciate', 'wonderful',
  ];

  let score = 50; // Neutral baseline

  for (const message of messages) {
    if (message.role !== 'user') continue;

    const content = message.content?.toLowerCase() || '';

    // Decrease score for negative keywords
    for (const keyword of negativeKeywords) {
      if (content.includes(keyword)) {
        score -= 10;
      }
    }

    // Increase score for positive keywords
    for (const keyword of positiveKeywords) {
      if (content.includes(keyword)) {
        score += 10;
      }
    }
  }

  // Clamp between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Extract customer email from conversation metadata
 */
function extractEmail(metadata: any): string | undefined {
  return metadata?.customer_email || metadata?.session_metadata?.customer_email;
}

/**
 * Prioritize follow-up candidates (high priority first)
 */
export function prioritizeFollowUps(candidates: FollowUpCandidate[]): FollowUpCandidate[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return candidates.sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
