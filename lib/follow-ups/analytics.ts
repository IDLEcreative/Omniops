/**
 * Follow-up Analytics
 *
 * Track and analyze the effectiveness of automated follow-ups
 * Metrics: Response rate, conversion rate, ROI
 */

import type { SupabaseClient } from '@/lib/supabase/server';
import type { FollowUpReason } from './detector';

export interface FollowUpMetrics {
  total_sent: number;
  response_rate: number; // Percentage of follow-ups that got a response
  avg_response_time_hours: number; // How fast users respond
  conversion_rate: number; // For cart abandonments, how many converted
  effectiveness_score: number; // Overall score 0-100
}

export interface FollowUpAnalytics {
  overall: FollowUpMetrics;
  by_reason: Record<FollowUpReason, FollowUpMetrics>;
  by_channel: Record<'email' | 'in_app', FollowUpMetrics>;
  trend: Array<{
    date: string;
    sent: number;
    responded: number;
  }>;
}

/**
 * Get comprehensive follow-up analytics
 */
export async function getFollowUpAnalytics(
  supabase: SupabaseClient,
  options: { days?: number; organizationId?: string } = {}
): Promise<FollowUpAnalytics> {
  const { days = 30 } = options;

  // Get effectiveness from database function
  const { data: effectiveness } = await supabase
    .rpc('get_follow_up_effectiveness', { p_days: days });

  const byReason: Record<string, FollowUpMetrics> = {};
  const byChannel: Record<string, FollowUpMetrics> = {};

  if (effectiveness) {
    for (const row of effectiveness) {
      byReason[row.reason] = {
        total_sent: row.total_sent,
        response_rate: row.response_rate,
        avg_response_time_hours: row.avg_response_time_hours,
        conversion_rate: 0, // TODO: Calculate from purchases
        effectiveness_score: calculateEffectivenessScore(row),
      };
    }
  }

  // Get overall metrics
  const overall = calculateOverallMetrics(byReason);

  // Get metrics by channel
  const { data: channelData } = await supabase
    .from('follow_up_messages')
    .select('channel, status, sent_at')
    .eq('status', 'sent')
    .gte('sent_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

  if (channelData) {
    const emailSent = channelData.filter(m => m.channel === 'email').length;
    const inAppSent = channelData.filter(m => m.channel === 'in_app').length;

    byChannel.email = {
      total_sent: emailSent,
      response_rate: 0, // TODO: Calculate
      avg_response_time_hours: 0,
      conversion_rate: 0,
      effectiveness_score: 0,
    };

    byChannel.in_app = {
      total_sent: inAppSent,
      response_rate: 0,
      avg_response_time_hours: 0,
      conversion_rate: 0,
      effectiveness_score: 0,
    };
  }

  // Get trend data (daily sent count)
  const trend = await getTrendData(supabase, days);

  return {
    overall,
    by_reason: byReason as Record<FollowUpReason, FollowUpMetrics>,
    by_channel: byChannel as Record<'email' | 'in_app', FollowUpMetrics>,
    trend,
  };
}

/**
 * Calculate overall metrics from individual reason metrics
 */
function calculateOverallMetrics(
  byReason: Record<string, FollowUpMetrics>
): FollowUpMetrics {
  const reasons = Object.values(byReason);

  if (reasons.length === 0) {
    return {
      total_sent: 0,
      response_rate: 0,
      avg_response_time_hours: 0,
      conversion_rate: 0,
      effectiveness_score: 0,
    };
  }

  const totalSent = reasons.reduce((sum, r) => sum + r.total_sent, 0);
  const weightedResponseRate = reasons.reduce(
    (sum, r) => sum + r.response_rate * r.total_sent,
    0
  ) / totalSent;

  const weightedAvgResponseTime = reasons.reduce(
    (sum, r) => sum + r.avg_response_time_hours * r.total_sent,
    0
  ) / totalSent;

  return {
    total_sent: totalSent,
    response_rate: weightedResponseRate,
    avg_response_time_hours: weightedAvgResponseTime,
    conversion_rate: reasons.reduce((sum, r) => sum + r.conversion_rate, 0) / reasons.length,
    effectiveness_score: reasons.reduce((sum, r) => sum + r.effectiveness_score, 0) / reasons.length,
  };
}

/**
 * Calculate effectiveness score (0-100)
 * Based on response rate, response time, and conversion rate
 */
function calculateEffectivenessScore(metrics: {
  response_rate: number;
  avg_response_time_hours: number;
}): number {
  // Response rate is most important (60% weight)
  const responseScore = metrics.response_rate * 0.6;

  // Fast response times are good (40% weight)
  // 24 hours = 100%, 48 hours = 50%, >72 hours = 0%
  const timeScore = Math.max(0, 100 - (metrics.avg_response_time_hours / 72) * 100) * 0.4;

  return Math.round(responseScore + timeScore);
}

/**
 * Get trend data for follow-ups over time
 */
async function getTrendData(
  supabase: SupabaseClient,
  days: number
): Promise<Array<{ date: string; sent: number; responded: number }>> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('follow_up_messages')
    .select('sent_at, conversation_id')
    .eq('status', 'sent')
    .gte('sent_at', startDate.toISOString())
    .order('sent_at', { ascending: true });

  if (!data) return [];

  // Group by date
  const byDate: Record<string, { sent: number; responded: number }> = {};

  for (const message of data) {
    const date = message.sent_at.split('T')[0];

    if (!byDate[date]) {
      byDate[date] = { sent: 0, responded: 0 };
    }

    byDate[date].sent++;
    // TODO: Check if conversation has responses after sent_at
  }

  return Object.entries(byDate).map(([date, metrics]) => ({
    date,
    ...metrics,
  }));
}

/**
 * Track when a user responds to a follow-up
 * Should be called when a message is received after a follow-up was sent
 */
export async function trackFollowUpResponse(
  supabase: SupabaseClient,
  conversationId: string,
  messageTimestamp: string
): Promise<void> {
  // Find the most recent sent follow-up for this conversation
  const { data: followUp } = await supabase
    .from('follow_up_messages')
    .select('id, sent_at')
    .eq('conversation_id', conversationId)
    .eq('status', 'sent')
    .lt('sent_at', messageTimestamp)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (followUp) {
    // Update metadata to mark as responded
    await supabase
      .from('follow_up_messages')
      .update({
        metadata: {
          responded: true,
          response_at: messageTimestamp,
          response_time_hours: (
            (new Date(messageTimestamp).getTime() - new Date(followUp.sent_at).getTime()) /
            (1000 * 60 * 60)
          ).toFixed(2),
        },
      })
      .eq('id', followUp.id);
  }
}

/**
 * Get follow-up performance summary
 */
export interface FollowUpSummary {
  total_sent_today: number;
  total_sent_this_week: number;
  total_sent_this_month: number;
  avg_response_rate: number;
  most_effective_reason: string;
  least_effective_reason: string;
  pending_count: number;
}

export async function getFollowUpSummary(
  supabase: SupabaseClient
): Promise<FollowUpSummary> {
  const now = new Date();

  // Sent today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const { count: sentToday } = await supabase
    .from('follow_up_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', todayStart.toISOString());

  // Sent this week
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  const { count: sentWeek } = await supabase
    .from('follow_up_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', weekStart.toISOString());

  // Sent this month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const { count: sentMonth } = await supabase
    .from('follow_up_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')
    .gte('sent_at', monthStart.toISOString());

  // Pending count
  const { count: pending } = await supabase
    .from('follow_up_messages')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get effectiveness data
  const { data: effectiveness } = await supabase
    .rpc('get_follow_up_effectiveness', { p_days: 30 });

  let avgResponseRate = 0;
  let mostEffective = 'N/A';
  let leastEffective = 'N/A';

  if (effectiveness && effectiveness.length > 0) {
    avgResponseRate =
      effectiveness.reduce((sum: number, r: any) => sum + r.response_rate, 0) /
      effectiveness.length;

    const sorted = [...effectiveness].sort((a, b) => b.response_rate - a.response_rate);
    mostEffective = sorted[0].reason;
    leastEffective = sorted[sorted.length - 1].reason;
  }

  return {
    total_sent_today: sentToday || 0,
    total_sent_this_week: sentWeek || 0,
    total_sent_this_month: sentMonth || 0,
    avg_response_rate: avgResponseRate,
    most_effective_reason: mostEffective,
    least_effective_reason: leastEffective,
    pending_count: pending || 0,
  };
}
