/**
 * Database queries for Business Intelligence Analytics
 * Handles all data fetching from Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@/types/supabase';
import type { TimeRange, ConversationData, MessageData } from './business-intelligence-types';
import { fetchFromHourlyUsageView } from './usage-view-helper';

/**
 * Fetch conversations with messages for journey analysis
 * ✅ Optimized: Uses pagination to handle large datasets
 * ✅ Optimized: Explicitly selects only needed columns
 */
export async function fetchConversationsWithMessages(
  domain: string,
  timeRange: TimeRange,
  supabase?: SupabaseClient
): Promise<ConversationData[]> {
  const client = supabase || await createServiceRoleClient();

  if (!client) {
    throw new Error('Database client unavailable');
  }

  // Use pagination to prevent OOM on large conversation datasets
  const allConversations: ConversationData[] = [];
  let offset = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = client
      .from('conversations')
      .select(`
        id,
        session_id,
        created_at,
        metadata,
        messages (
          id,
          content,
          role,
          created_at
        )
      `)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
      .range(offset, offset + batchSize - 1);

    if (domain !== 'all') {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch conversations with messages', error);
      throw error;
    }

    if (data && data.length > 0) {
      allConversations.push(...(data as ConversationData[]));
      offset += batchSize;

      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allConversations;
}

/**
 * Fetch messages for content gap analysis
 */
export async function fetchUserMessages(
  domain: string,
  timeRange: TimeRange,
  limit: number = 1000,
  supabase?: SupabaseClient
): Promise<MessageData[]> {
  const client = supabase || await createServiceRoleClient();

  if (!client) {
    throw new Error('Database client unavailable');
  }

  let query = client
    .from('messages')
    .select(`
      content,
      metadata,
      created_at
    `)
    .eq('role', 'user')
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString())
    .order('created_at', { ascending: false })
    .limit(limit);

  if (domain !== 'all') {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch user messages', error);
    throw error;
  }

  return (data as MessageData[]) || [];
}

/**
 * Fetch messages for peak usage analysis
 * ✅ OPTIMIZED: Uses materialized view for date ranges > 7 days (70-80% faster)
 * ✅ OPTIMIZED: Falls back to raw query for recent data or if view unavailable
 * ✅ OPTIMIZED: Uses pagination to handle large message datasets
 */
export async function fetchMessagesForUsageAnalysis(
  domain: string,
  timeRange: TimeRange,
  supabase?: SupabaseClient
): Promise<MessageData[]> {
  const client = supabase || await createServiceRoleClient();

  if (!client) {
    throw new Error('Database client unavailable');
  }

  // Calculate date range in days
  const rangeDays = Math.ceil((timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24));

  // For date ranges > 7 days, try to use materialized view for better performance
  if (rangeDays > 7) {
    try {
      const viewData = await fetchFromHourlyUsageView(domain, timeRange, client);
      if (viewData.length > 0) {
        logger.info(`Using materialized view for usage analysis (${rangeDays} days)`);
        return viewData;
      }
    } catch (error) {
      logger.warn('Materialized view unavailable, falling back to raw query', error as Record<string, any>);
      // Fall through to raw query
    }
  }

  // Fallback: Use pagination to prevent OOM on large message datasets
  const allMessages: MessageData[] = [];
  let offset = 0;
  const batchSize = 5000;
  let hasMore = true;

  while (hasMore) {
    let query = client
      .from('messages')
      .select(`
        created_at,
        metadata
      `)
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
      .order('created_at', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (domain !== 'all') {
      query = query.eq('domain', domain);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Failed to fetch messages for usage analysis', error);
      throw error;
    }

    if (data && data.length > 0) {
      allMessages.push(...(data as MessageData[]));
      offset += batchSize;

      if (data.length < batchSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allMessages;
}

/**
 * Fetch daily analytics summary from materialized view
 * ⚡ Optimized: Pre-aggregated daily stats for fast dashboard loading
 * Use this for date ranges > 7 days instead of raw queries
 */
export async function fetchDailyAnalyticsSummary(
  domain: string,
  timeRange: TimeRange,
  supabase?: SupabaseClient
): Promise<any[]> {
  const client = supabase || await createServiceRoleClient();

  if (!client) {
    throw new Error('Database client unavailable');
  }

  // Query materialized view
  let query = client
    .from('daily_analytics_summary' as any)
    .select('*')
    .gte('date', timeRange.start.toISOString().split('T')[0])
    .lte('date', timeRange.end.toISOString().split('T')[0])
    .order('date', { ascending: false });

  if (domain !== 'all') {
    // Get domain_id from domain name
    const { data: domainData } = await client
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (domainData) {
      query = query.eq('domain_id', domainData.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch daily analytics summary', error);
    throw error;
  }

  return data || [];
}

/**
 * Fetch weekly analytics summary from materialized view
 * ⚡ Optimized: Pre-aggregated weekly stats for trend analysis
 * Use this for date ranges > 30 days instead of daily queries
 */
export async function fetchWeeklyAnalyticsSummary(
  domain: string,
  timeRange: TimeRange,
  supabase?: SupabaseClient
): Promise<any[]> {
  const client = supabase || await createServiceRoleClient();

  if (!client) {
    throw new Error('Database client unavailable');
  }

  // Query materialized view
  let query = client
    .from('weekly_analytics_summary' as any)
    .select('*')
    .gte('week_start_date', timeRange.start.toISOString().split('T')[0])
    .lte('week_start_date', timeRange.end.toISOString().split('T')[0])
    .order('week_start_date', { ascending: false });

  if (domain !== 'all') {
    // Get domain_id from domain name
    const { data: domainData } = await client
      .from('domains')
      .select('id')
      .eq('domain', domain)
      .single();

    if (domainData) {
      query = query.eq('domain_id', domainData.id);
    }
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch weekly analytics summary', error);
    throw error;
  }

  return data || [];
}
