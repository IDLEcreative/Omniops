/**
 * Database queries for Business Intelligence Analytics
 * Handles all data fetching from Supabase
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { TimeRange, ConversationData, MessageData } from './business-intelligence-types';

/**
 * Fetch conversations with messages for journey analysis
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
    .lte('created_at', timeRange.end.toISOString());

  if (domain !== 'all') {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch conversations with messages', error);
    throw error;
  }

  return (data as ConversationData[]) || [];
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

  let query = client
    .from('messages')
    .select(`
      created_at,
      metadata
    `)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString())
    .order('created_at', { ascending: true });

  if (domain !== 'all') {
    query = query.eq('domain', domain);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to fetch messages for usage analysis', error);
    throw error;
  }

  return (data as MessageData[]) || [];
}
