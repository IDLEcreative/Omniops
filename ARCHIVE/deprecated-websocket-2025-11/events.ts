/**
 * Analytics Event Emitter
 *
 * Emits real-time analytics events via WebSocket to connected dashboard clients.
 * Integrates with the WebSocket server to push updates when analytics data changes.
 *
 * @module lib/analytics/events
 */

import {
  getWebSocketServer,
  emitNewMessage,
  emitSentimentUpdate,
  emitMetricsUpdate,
} from '@/lib/websocket/server';

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
 * Called when a new chat message is created (user or assistant).
 * Triggers real-time updates on analytics dashboards.
 *
 * @param organizationId - Organization identifier (domain ID)
 * @param data - Message event data
 */
export async function emitMessageEvent(
  organizationId: string,
  data: MessageEventData
): Promise<void> {
  const ws = getWebSocketServer();
  if (!ws) {
    console.warn('[Analytics Events] WebSocket not initialized, skipping message event');
    return;
  }

  try {
    emitNewMessage(organizationId, {
      conversationId: data.conversationId,
      messageId: data.messageId,
      role: data.role,
      content: data.content.substring(0, 200), // Truncate for efficiency
      responseTime: data.responseTime,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error('[Analytics Events] Failed to emit message event:', error);
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
  const ws = getWebSocketServer();
  if (!ws) {
    console.warn('[Analytics Events] WebSocket not initialized, skipping sentiment event');
    return;
  }

  try {
    emitSentimentUpdate(organizationId, {
      conversationId: data.conversationId,
      messageId: data.messageId,
      score: data.score,
      confidence: data.confidence,
      sentiment: data.sentiment,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error('[Analytics Events] Failed to emit sentiment event:', error);
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
  const ws = getWebSocketServer();
  if (!ws) {
    console.warn('[Analytics Events] WebSocket not initialized, skipping metrics event');
    return;
  }

  try {
    emitMetricsUpdate(organizationId, {
      totalMessages: data.totalMessages,
      avgResponseTime: data.avgResponseTime,
      satisfactionScore: data.satisfactionScore,
      resolutionRate: data.resolutionRate,
      timestamp: data.timestamp,
    });
  } catch (error) {
    console.error('[Analytics Events] Failed to emit metrics event:', error);
  }
}

/**
 * Batch emit multiple events
 *
 * Efficiently emits multiple analytics events in a single batch.
 * Useful for bulk operations or initial dashboard load.
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
  const ws = getWebSocketServer();
  if (!ws) {
    console.warn('[Analytics Events] WebSocket not initialized, skipping batch events');
    return;
  }

  try {
    for (const event of events) {
      switch (event.type) {
        case 'message':
          await emitMessageEvent(organizationId, event.data as MessageEventData);
          break;
        case 'sentiment':
          await emitSentimentEvent(organizationId, event.data as SentimentEventData);
          break;
        case 'metrics':
          await emitMetricsEvent(organizationId, event.data as MetricsEventData);
          break;
      }
    }
  } catch (error) {
    console.error('[Analytics Events] Failed to emit batch events:', error);
  }
}

/**
 * Check if WebSocket is available for emitting events
 *
 * @returns True if WebSocket server is initialized
 */
export function isWebSocketAvailable(): boolean {
  return getWebSocketServer() !== null;
}
