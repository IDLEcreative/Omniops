/**
 * Daily Metrics Calculator
 *
 * Calculates daily user metrics including new vs returning users
 */

import { DailyUserMetric } from '../user-analytics';

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

export function calculateDailyMetrics(
  conversations: ConversationWithMetadata[],
  days: number
): DailyUserMetric[] {
  const dailyData = new Map<string, {
    users: Set<string>;
    new_users: Set<string>;
    sessions: number;
    total_duration: number;
    page_views: number;
  }>();

  // Track all-time users to determine if user is new
  const allTimeUsers = new Set<string>();

  // Group by date
  conversations.forEach(conv => {
    const dateKey = new Date(conv.created_at).toISOString().split('T')[0];
    const sessionId = conv.session_id;

    if (!sessionId) return;

    if (!dailyData.has(dateKey!)) {
      dailyData.set(dateKey!, {
        users: new Set(),
        new_users: new Set(),
        sessions: 0,
        total_duration: 0,
        page_views: 0,
      });
    }

    const dayData = dailyData.get(dateKey!)!;

    // Add user
    dayData.users.add(sessionId);

    // Check if new user
    if (!allTimeUsers.has(sessionId)) {
      dayData.new_users.add(sessionId);
      allTimeUsers.add(sessionId);
    }

    // Add session data
    dayData.sessions++;

    const sessionMetadata = conv.metadata?.session_metadata;
    if (sessionMetadata) {
      dayData.total_duration += sessionMetadata.duration_seconds || 0;
      dayData.page_views += sessionMetadata.page_views?.length || 0;
    }
  });

  // Convert to array and sort by date
  const metrics: DailyUserMetric[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];

    const dayData = dailyData.get(dateKey!);

    metrics.push({
      date: dateKey!,
      unique_users: dayData?.users.size || 0,
      new_users: dayData?.new_users.size || 0,
      returning_users: (dayData?.users.size || 0) - (dayData?.new_users.size || 0),
      total_sessions: dayData?.sessions || 0,
      avg_session_duration: dayData?.sessions
        ? Math.round(dayData.total_duration / dayData.sessions)
        : 0,
      total_page_views: dayData?.page_views || 0,
    });
  }

  return metrics;
}
