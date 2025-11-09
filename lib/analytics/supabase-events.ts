/**
 * Analytics Event Emitter (Supabase Realtime)
 *
 * Emits real-time analytics events via Supabase Broadcast channels.
 * This replaces the WebSocket server implementation with Supabase Realtime,
 * which works with serverless platforms like Vercel.
 *
 * @module lib/analytics/supabase-events
 */

import { createClient } from '@/lib/supabase/server';

interface MessageEventData {
  conversationId: string;
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  responseTime?: number;
  timestamp: Date;
}

interface SentimentEventData {
  conversationId: string;
  messageId: string;
  score: number;
  confidence?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
}

interface MetricsEventData {
  totalMessages?: number;
  avgResponseTime?: number;
  satisfactionScore?: number;
  resolutionRate?: number;
  timestamp: Date;
}

/**
 * Emit new message event to analytics dashboards
 *
 * Uses Supabase Broadcast to send real-time events to subscribed clients.
 * Channel: analytics:{organizationId}
 *
 * @param organizationId - Organization identifier (domain ID)
 * @param data - Message event data
 */
export async function emitMessageEvent(
  organizationId: string,
  data: MessageEventData
): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error('[Supabase Analytics] Failed to initialize Supabase');
      return;
    }
    const channel = supabase.channel(`analytics:${organizationId}`);

    await channel.send({
      type: 'broadcast',
      event: 'analytics:new-message',
      payload: {
        conversationId: data.conversationId,
        messageId: data.messageId,
        role: data.role,
        content: data.content.substring(0, 200), // Truncate for efficiency
        responseTime: data.responseTime,
        timestamp: data.timestamp.toISOString(),
      },
    });

    // Unsubscribe after sending (broadcast channels are ephemeral)
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error('[Supabase Analytics] Failed to emit message event:', error);
  }
}

/**
 * Emit sentiment analysis update
 *
 * Called when sentiment analysis is performed on a message.
 * Updates real-time sentiment charts and metrics.
 *
 * @param organizationId - Organization identifier (domain ID)
 * @param data - Sentiment event data
 */
export async function emitSentimentEvent(
  organizationId: string,
  data: SentimentEventData
): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error('[Supabase Analytics] Failed to initialize Supabase');
      return;
    }
    const channel = supabase.channel(`analytics:${organizationId}`);

    await channel.send({
      type: 'broadcast',
      event: 'analytics:sentiment-update',
      payload: {
        conversationId: data.conversationId,
        messageId: data.messageId,
        score: data.score,
        confidence: data.confidence,
        sentiment: data.sentiment,
        timestamp: data.timestamp.toISOString(),
      },
    });

    await supabase.removeChannel(channel);
  } catch (error) {
    console.error('[Supabase Analytics] Failed to emit sentiment event:', error);
  }
}

/**
 * Emit aggregated metrics update
 *
 * Called when overall analytics metrics are recalculated.
 * Triggers dashboard-wide metric updates.
 *
 * @param organizationId - Organization identifier (domain ID)
 * @param data - Metrics event data
 */
export async function emitMetricsEvent(
  organizationId: string,
  data: MetricsEventData
): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error('[Supabase Analytics] Failed to initialize Supabase');
      return;
    }
    const channel = supabase.channel(`analytics:${organizationId}`);

    await channel.send({
      type: 'broadcast',
      event: 'analytics:metrics-update',
      payload: {
        totalMessages: data.totalMessages,
        avgResponseTime: data.avgResponseTime,
        satisfactionScore: data.satisfactionScore,
        resolutionRate: data.resolutionRate,
        timestamp: data.timestamp.toISOString(),
      },
    });

    await supabase.removeChannel(channel);
  } catch (error) {
    console.error('[Supabase Analytics] Failed to emit metrics event:', error);
  }
}

/**
 * Batch emit multiple events
 *
 * Efficiently emits multiple analytics events using a single channel.
 *
 * @param organizationId - Organization identifier
 * @param events - Array of events to emit
 */
export async function emitBatchEvents(
  organizationId: string,
  events: Array<{
    type: 'message' | 'sentiment' | 'metrics';
    data: MessageEventData | SentimentEventData | MetricsEventData;
  }>
): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error('[Supabase Analytics] Failed to initialize Supabase');
      return;
    }
    const channel = supabase.channel(`analytics:${organizationId}`);

    for (const event of events) {
      let eventName: string;
      let payload: any;

      switch (event.type) {
        case 'message':
          eventName = 'analytics:new-message';
          payload = event.data;
          break;
        case 'sentiment':
          eventName = 'analytics:sentiment-update';
          payload = event.data;
          break;
        case 'metrics':
          eventName = 'analytics:metrics-update';
          payload = event.data;
          break;
        default:
          continue;
      }

      await channel.send({
        type: 'broadcast',
        event: eventName,
        payload: {
          ...payload,
          timestamp: payload.timestamp?.toISOString?.() || new Date().toISOString(),
        },
      });
    }

    await supabase.removeChannel(channel);
  } catch (error) {
    console.error('[Supabase Analytics] Failed to emit batch events:', error);
  }
}

/**
 * Check if Supabase Realtime is available
 *
 * @returns Always true (Supabase is always available)
 */
export function isRealtimeAvailable(): boolean {
  return true; // Supabase Realtime is always available
}
