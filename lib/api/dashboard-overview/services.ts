/**
 * Dashboard Overview API Services
 * Business logic for fetching and processing dashboard data
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { ConversationRecord, TelemetryRow, RecentConversationEntry } from './types';
import { toDateKey, parseConversationMetadata } from './utils';

export async function fetchConversations(
  supabase: SupabaseClient,
  startDate: Date
): Promise<ConversationRecord[]> {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, session_id, customer_id, metadata, created_at, ended_at')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as ConversationRecord[]) || [];
}

export async function fetchMessages(
  supabase: SupabaseClient,
  startDate: Date,
  endDate?: Date
) {
  let query = supabase
    .from('messages')
    .select('conversation_id, role, content, created_at, metadata')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true });

  if (endDate) {
    query = query.lt('created_at', endDate.toISOString());
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function fetchTelemetryRows(
  supabase: SupabaseClient,
  startDate: Date
): Promise<TelemetryRow[]> {
  const { data, error } = await supabase
    .from('chat_telemetry')
    .select('success, cost_usd, search_count, total_tokens, model, created_at')
    .gte('created_at', startDate.toISOString());

  if (error) throw error;
  return (data as TelemetryRow[]) || [];
}

export async function fetchLastTraining(supabase: SupabaseClient) {
  const { data } = await supabase
    .from('training_data')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
}

export function buildRecentConversations(
  conversationsList: ConversationRecord[],
  recentMessages: Array<{ conversation_id: string; role: string; content: string; created_at: string }>
): RecentConversationEntry[] {
  const recentConversationsRaw = conversationsList.slice(0, 10);
  const recentMessagesByConversation = new Map<string, { content: string; created_at: string }>();

  recentMessages.forEach((message) => {
    if (message.role === 'user' && !recentMessagesByConversation.has(message.conversation_id)) {
      recentMessagesByConversation.set(message.conversation_id, {
        content: message.content,
        created_at: message.created_at
      });
    }
  });

  return recentConversationsRaw.map((conv) => {
    const metadata = parseConversationMetadata(conv.metadata);
    const userMessage = recentMessagesByConversation.get(conv.id);
    const statusFromMetadata = typeof metadata.status === 'string' ? metadata.status : undefined;
    let status: 'active' | 'waiting' | 'resolved' = 'active';

    if (statusFromMetadata === 'waiting') {
      status = 'waiting';
    } else if (conv.ended_at) {
      status = 'resolved';
    }

    return {
      id: conv.id,
      createdAt: conv.created_at,
      status,
      lastMessagePreview: userMessage?.content?.slice(0, 140) || 'Conversation started',
      lastMessageAt: userMessage?.created_at || conv.created_at,
      customerName:
        (metadata.customer?.name as string | undefined) ??
        (metadata.customer_name as string | undefined) ??
        null
    };
  });
}

export function buildConversationTrend(
  conversations: ConversationRecord[],
  startDate: Date,
  days: number,
  satisfactionByDate: Map<string, number>,
  defaultSatisfaction: number
): Array<{ date: string; conversations: number; satisfactionScore: number }> {
  const conversationCountByDate = new Map<string, number>();
  conversations.forEach((conv) => {
    const key = toDateKey(conv.created_at);
    conversationCountByDate.set(key, (conversationCountByDate.get(key) || 0) + 1);
  });

  const trend: Array<{ date: string; conversations: number; satisfactionScore: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(startDate);
    day.setDate(day.getDate() + i);
    const dateKey = day.toISOString().slice(0, 10);

    trend.push({
      date: dateKey,
      conversations: conversationCountByDate.get(dateKey) || 0,
      satisfactionScore: satisfactionByDate.get(dateKey) ?? defaultSatisfaction
    });
  }

  return trend;
}

export function calculateTelemetryStats(telemetryRows: TelemetryRow[], now: Date) {
  const totalRequests = telemetryRows.length;
  const successfulRequests = telemetryRows.filter((row) => row.success).length;
  const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 100;
  const totalSearches = telemetryRows.reduce((sum, row) => sum + (row.search_count || 0), 0);
  const avgSearchesPerRequest = totalRequests > 0 ? totalSearches / totalRequests : 0;
  const totalCostUSD = telemetryRows.reduce((sum, row) => sum + (row.cost_usd || 0), 0);
  const totalTokens = telemetryRows.reduce((sum, row) => sum + (row.total_tokens || 0), 0);

  const activeToday = telemetryRows.some((row) => {
    const created = new Date(row.created_at);
    return now.getTime() - created.getTime() < 60 * 60 * 1000; // last hour
  });

  const primaryModel =
    telemetryRows.length > 0 && telemetryRows[0]?.model
      ? telemetryRows[0].model
      : 'gpt-5-mini';

  return {
    totalRequests,
    successfulRequests,
    successRate,
    totalSearches,
    avgSearchesPerRequest,
    totalCostUSD,
    totalTokens,
    activeToday,
    primaryModel
  };
}
