/**
 * Dashboard Overview API Handlers
 * Request handling and response building logic
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { analyseMessages } from '@/lib/dashboard/analytics';
import type { DashboardOverview } from './types';
import {
  fetchConversations,
  fetchMessages,
  fetchTelemetryRows,
  fetchLastTraining,
  buildRecentConversations,
  buildConversationTrend,
  calculateTelemetryStats
} from './services';
import { formatChange, toDateKey } from './utils';

export async function buildDashboardOverview(
  supabase: SupabaseClient,
  days: number
): Promise<DashboardOverview> {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);
  const previousEndDate = new Date(startDate);

  // Fetch all conversations
  const conversations = await fetchConversations(supabase, previousStartDate);
  const currentConversations = conversations.filter(
    (item) => new Date(item.created_at) >= startDate
  );
  const previousConversations = conversations.filter(
    (item) =>
      new Date(item.created_at) >= previousStartDate &&
      new Date(item.created_at) < previousEndDate
  );

  // Calculate conversation metrics
  const currentConversationCount = currentConversations.length;
  const previousConversationCount = previousConversations.length;
  const conversationChange = formatChange(currentConversationCount, previousConversationCount);

  // Calculate active users from unique session IDs
  const currentSessions = new Set<string>();
  const previousSessions = new Set<string>();

  currentConversations.forEach((conv) => {
    currentSessions.add(conv.session_id || conv.id);
  });
  previousConversations.forEach((conv) => {
    previousSessions.add(conv.session_id || conv.id);
  });

  const activeUsersChange = formatChange(currentSessions.size, previousSessions.size);

  // Fetch messages for analytics
  const [currentMessages, previousMessages] = await Promise.all([
    fetchMessages(supabase, startDate),
    fetchMessages(supabase, previousStartDate, previousEndDate)
  ]);

  const analyticsCurrent = analyseMessages(currentMessages, { days });
  const analyticsPrevious = analyseMessages(previousMessages, { days });

  const avgResponseChange = formatChange(
    analyticsCurrent.avgResponseTimeSeconds,
    analyticsPrevious.avgResponseTimeSeconds
  );
  const resolutionChange = formatChange(
    analyticsCurrent.resolutionRate,
    analyticsPrevious.resolutionRate
  );

  // Build trend data
  const satisfactionByDate = new Map<string, number>();
  analyticsCurrent.dailySentiment.forEach((item) => {
    satisfactionByDate.set(item.date, item.satisfactionScore);
  });

  const trend = buildConversationTrend(
    currentConversations,
    startDate,
    days,
    satisfactionByDate,
    analyticsCurrent.satisfactionScore
  );

  // Build recent conversations
  const recentIds = conversations.slice(0, 10).map((conv) => conv.id);
  const { data: recentMessagesRaw, error: recentMessagesError } = await supabase
    .from('messages')
    .select('conversation_id, role, content, created_at')
    .in('conversation_id', recentIds.length > 0 ? recentIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false });

  if (recentMessagesError) throw recentMessagesError;

  const recentConversations = buildRecentConversations(conversations, recentMessagesRaw || []);

  // Fetch and calculate telemetry stats
  const telemetryRows = await fetchTelemetryRows(supabase, startDate);
  const telemetryStats = calculateTelemetryStats(telemetryRows, now);
  const lastTrainingRow = await fetchLastTraining(supabase);

  // Build final overview
  const overview: DashboardOverview = {
    summary: {
      totalConversations: currentConversationCount,
      conversationChange: parseFloat(conversationChange.toFixed(2)),
      activeUsers: currentSessions.size,
      activeUsersChange: parseFloat(activeUsersChange.toFixed(2)),
      avgResponseTime: analyticsCurrent.avgResponseTimeSeconds,
      avgResponseTimeChange: parseFloat(avgResponseChange.toFixed(2)),
      resolutionRate: analyticsCurrent.resolutionRate,
      resolutionRateChange: parseFloat(resolutionChange.toFixed(2)),
      satisfactionScore: analyticsCurrent.satisfactionScore
    },
    trend,
    recentConversations,
    languageDistribution: analyticsCurrent.languageDistribution,
    quickStats: {
      satisfaction: analyticsCurrent.satisfactionScore,
      avgResponseTime: analyticsCurrent.avgResponseTimeSeconds,
      conversationsToday:
        trend.find(t => t.date === toDateKey(now.toISOString()))?.conversations || 0,
      successRate: parseFloat(telemetryStats.successRate.toFixed(2)),
      totalTokens: telemetryStats.totalTokens,
      totalCostUSD: parseFloat(telemetryStats.totalCostUSD.toFixed(4)),
      avgSearchesPerRequest: parseFloat(telemetryStats.avgSearchesPerRequest.toFixed(2))
    },
    telemetry: {
      totalRequests: telemetryStats.totalRequests,
      successfulRequests: telemetryStats.successfulRequests,
      successRate: parseFloat(telemetryStats.successRate.toFixed(2)),
      avgSearchesPerRequest: parseFloat(telemetryStats.avgSearchesPerRequest.toFixed(2)),
      totalTokens: telemetryStats.totalTokens,
      totalCostUSD: parseFloat(telemetryStats.totalCostUSD.toFixed(4))
    },
    botStatus: {
      online: telemetryStats.activeToday || telemetryStats.totalRequests > 0,
      uptimePercent: parseFloat(telemetryStats.successRate.toFixed(2)),
      primaryModel: telemetryStats.primaryModel,
      lastTrainingAt: lastTrainingRow?.created_at || null
    }
  };

  return overview;
}
