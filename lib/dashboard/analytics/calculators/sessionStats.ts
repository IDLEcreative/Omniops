/**
 * Session Stats Calculator
 *
 * Calculates session duration and bounce rate metrics
 */

import { SessionDurationMetrics } from '../user-analytics';

interface ConversationWithMetadata {
  session_id: string | null;
  created_at: string;
  metadata?: {
    session_metadata?: {
      duration_seconds?: number;
      page_views?: any[];
    };
  } | null;
}

export function calculateSessionStats(
  conversations: ConversationWithMetadata[]
): SessionDurationMetrics {
  const durations: number[] = [];
  let bounceSessions = 0;
  let totalSessions = 0;

  conversations.forEach(conv => {
    const sessionMetadata = conv.metadata?.session_metadata;
    if (sessionMetadata) {
      totalSessions++;

      if (sessionMetadata.duration_seconds) {
        durations.push(sessionMetadata.duration_seconds);
      }

      // Bounce if only 1 page view
      if (sessionMetadata.page_views && sessionMetadata.page_views.length === 1) {
        bounceSessions++;
      }
    }
  });

  const avgDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length
    : 0;

  const medianDuration = durations.length > 0
    ? durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)] || 0
    : 0;

  const bounceRate = totalSessions > 0
    ? Math.round((bounceSessions / totalSessions) * 100)
    : 0;

  return {
    avg_duration_seconds: Math.round(avgDuration),
    median_duration_seconds: medianDuration,
    total_sessions: totalSessions,
    bounce_rate: bounceRate,
  };
}
