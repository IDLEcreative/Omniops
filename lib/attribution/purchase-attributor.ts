/**
 * Purchase Attribution Logic
 *
 * Intelligently links purchases to conversations using multiple matching strategies
 */

import type { AttributionContext, AttributionResult } from '@/types/purchase-attribution';
import {
  getActiveSessionByEmail,
  getRecentConversationsByEmail,
  savePurchaseAttribution,
  linkEmailToSession,
} from './attribution-db';

/**
 * Attribute a purchase to a conversation
 *
 * Uses multiple strategies with confidence scoring:
 * 1. Session Match (0.95): Active session within 24h
 * 2. Email + Time Proximity (0.70-0.90): Recent conversation with email
 * 3. Email Only (0.50-0.65): Any recent conversation
 * 4. No Match (0.0): Create unattributed record
 *
 * @param context - Attribution context with order details
 * @returns Attribution result with conversation ID and confidence
 */
export async function attributePurchaseToConversation(
  context: AttributionContext
): Promise<AttributionResult> {
  const {
    customerEmail,
    orderId,
    orderNumber,
    orderTotal,
    orderTimestamp,
    platform,
    domain,
    orderMetadata,
  } = context;


  // Strategy 1: Session Match (High Confidence: 0.95)
  const sessionMatch = await trySessionMatch(customerEmail, domain, orderTimestamp);
  if (sessionMatch) {
    await savePurchaseAttribution({
      conversationId: sessionMatch.conversationId,
      customerEmail,
      orderId,
      orderNumber,
      platform,
      orderTotal,
      currency: context.orderMetadata?.currency || 'USD',
      attributionConfidence: sessionMatch.confidence,
      attributionMethod: 'session_match',
      attributionReasoning: sessionMatch.reasoning,
      orderMetadata,
      orderCreatedAt: orderTimestamp,
    });

    return sessionMatch;
  }

  // Strategy 2: Email + Time Proximity (Medium-High Confidence: 0.70-0.90)
  const timeProximityMatch = await tryTimeProximityMatch(
    customerEmail,
    domain,
    orderTimestamp
  );
  if (timeProximityMatch) {
    await savePurchaseAttribution({
      conversationId: timeProximityMatch.conversationId,
      customerEmail,
      orderId,
      orderNumber,
      platform,
      orderTotal,
      currency: context.orderMetadata?.currency || 'USD',
      attributionConfidence: timeProximityMatch.confidence,
      attributionMethod: 'time_proximity',
      attributionReasoning: timeProximityMatch.reasoning,
      orderMetadata,
      orderCreatedAt: orderTimestamp,
    });

    return timeProximityMatch;
  }

  // Strategy 3: Email Only (Lower Confidence: 0.50-0.65)
  const emailMatch = await tryEmailOnlyMatch(customerEmail, domain);
  if (emailMatch) {
    await savePurchaseAttribution({
      conversationId: emailMatch.conversationId,
      customerEmail,
      orderId,
      orderNumber,
      platform,
      orderTotal,
      currency: context.orderMetadata?.currency || 'USD',
      attributionConfidence: emailMatch.confidence,
      attributionMethod: 'email_match',
      attributionReasoning: emailMatch.reasoning,
      orderMetadata,
      orderCreatedAt: orderTimestamp,
    });

    return emailMatch;
  }

  // Strategy 4: No Match - Still record the purchase for analytics
  await savePurchaseAttribution({
    conversationId: null,
    customerEmail,
    orderId,
    orderNumber,
    platform,
    orderTotal,
    currency: context.orderMetadata?.currency || 'USD',
    attributionConfidence: 0.0,
    attributionMethod: 'no_match',
    attributionReasoning: 'No matching conversation found within 7 days',
    orderMetadata,
    orderCreatedAt: orderTimestamp,
  });

  return {
    conversationId: null,
    confidence: 0.0,
    method: 'no_match',
    reasoning: 'No matching conversation found within 7 days',
  };
}

/**
 * Strategy 1: Session Match
 * Look for active session within last 24 hours
 */
async function trySessionMatch(
  email: string,
  domain: string,
  orderTimestamp: Date
): Promise<AttributionResult | null> {
  const activeSession = await getActiveSessionByEmail(email, domain, 24);

  if (!activeSession) {
    return null;
  }

  // Check if order happened within reasonable time after last activity
  const timeSinceActivity =
    orderTimestamp.getTime() - activeSession.lastActivity.getTime();
  const hoursGap = timeSinceActivity / (1000 * 60 * 60);

  if (hoursGap > 24 || hoursGap < 0) {
    return null;
  }

  // High confidence - active session very recently
  const confidence = hoursGap < 1 ? 0.95 : 0.90;

  return {
    conversationId: activeSession.conversationId,
    confidence,
    method: 'session_match',
    reasoning: `Active session found, ${hoursGap.toFixed(1)}h between chat and purchase`,
  };
}

/**
 * Strategy 2: Time Proximity Match
 * Find recent conversations within 24 hours of purchase
 */
async function tryTimeProximityMatch(
  email: string,
  domain: string,
  orderTimestamp: Date
): Promise<AttributionResult | null> {
  const conversations = await getRecentConversationsByEmail(email, domain, 7);

  if (conversations.length === 0) {
    return null;
  }

  // Score conversations by time proximity and engagement
  const scoredConversations = conversations
    .map(conv => {
      if (!conv.lastMessageAt) {
        return null;
      }

      const lastMessageTime = new Date(conv.lastMessageAt);
      const timeDiff = orderTimestamp.getTime() - lastMessageTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Only consider conversations within 24 hours before purchase
      if (hoursDiff < 0 || hoursDiff > 24) {
        return null;
      }

      // Score based on time proximity
      let score = 0.90; // Base score

      // Decay score based on time
      if (hoursDiff < 1) {
        score = 0.90; // Very recent
      } else if (hoursDiff < 6) {
        score = 0.85; // Recent
      } else if (hoursDiff < 12) {
        score = 0.80; // Moderately recent
      } else {
        score = 0.70; // Within 24h
      }

      // Boost score if conversation had multiple messages (more engaged)
      if (conv.messageCount >= 5) {
        score += 0.05;
      }

      // Check metadata for product/purchase intent
      if (conv.metadata) {
        if (conv.metadata.product_inquiry) score += 0.03;
        if (conv.metadata.price_check) score += 0.02;
      }

      return {
        ...conv,
        score: Math.min(score, 0.95), // Cap at 0.95
        hoursDiff,
      };
    })
    .filter(Boolean) as Array<any>;

  if (scoredConversations.length === 0) {
    return null;
  }

  // Pick highest scored conversation
  const best = scoredConversations.sort((a, b) => b.score - a.score)[0];

  return {
    conversationId: best.id,
    confidence: best.score,
    method: 'time_proximity',
    reasoning: `Conversation ${best.hoursDiff.toFixed(1)}h before purchase, ${best.messageCount} messages`,
    matchedConversations: scoredConversations.slice(0, 3).map(c => ({
      id: c.id,
      sessionId: c.session_id || '',
      lastMessageAt: c.lastMessageAt!,
      score: c.score,
    })),
  };
}

/**
 * Strategy 3: Email Only Match
 * Find any recent conversation (within 7 days)
 */
async function tryEmailOnlyMatch(
  email: string,
  domain: string
): Promise<AttributionResult | null> {
  const conversations = await getRecentConversationsByEmail(email, domain, 7);

  if (conversations.length === 0) {
    return null;
  }

  // Pick most recent conversation
  const mostRecent = conversations.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  // Lower confidence due to time gap
  let confidence = 0.65;

  // Reduce confidence based on age
  const daysSince = (Date.now() - new Date(mostRecent.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince > 3) {
    confidence = 0.55;
  }
  if (daysSince > 5) {
    confidence = 0.50;
  }

  return {
    conversationId: mostRecent.id,
    confidence,
    method: 'email_match',
    reasoning: `Email match to conversation ${daysSince.toFixed(1)} days ago`,
  };
}
