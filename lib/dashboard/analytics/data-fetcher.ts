/**
 * Data fetching utilities for analytics dashboard
 */

import type { SupabaseClient } from '@/lib/supabase/server';

export interface FetchMessagesOptions {
  startDate: Date;
  endDate?: Date;
  domains: string[];
}

/**
 * Fetch messages for analytics with domain filtering
 */
export async function fetchMessagesForAnalytics(
  supabase: SupabaseClient,
  options: FetchMessagesOptions
) {
  const { startDate, endDate, domains } = options;

  // Build query with domain filtering
  let query = supabase
    .from('messages')
    .select('content, role, created_at, metadata, conversations!inner(domain)')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  // Add end date filter if provided
  if (endDate) {
    query = query.lt('created_at', endDate.toISOString());
  }

  // Filter by allowed domains
  if (domains.length > 0) {
    query = query.in('conversations.domain', domains);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get user's organization membership
 */
export async function getUserOrganization(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('No organization found for user');
  }

  return data;
}

/**
 * Get organization's domains for multi-tenant filtering
 */
export async function getOrganizationDomains(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('customer_configs')
    .select('domain')
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error('Failed to fetch organization domains');
  }

  return data?.map(c => c.domain) || [];
}

/**
 * Calculate date ranges for comparison periods
 */
export function calculateComparisonDates(days: number, compare: boolean) {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  if (!compare) {
    return { startDate, previousStartDate: null, previousEndDate: null };
  }

  const previousEndDate = new Date(startDate);
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - days);

  return { startDate, previousStartDate, previousEndDate };
}