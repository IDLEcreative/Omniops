/**
 * Data fetching services for telemetry
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  RollupRow,
  HourlyTrendPoint,
  DomainRollupRow,
  ModelRollupRow,
} from './types';

type SupabaseClient = Awaited<ReturnType<typeof createServiceRoleClient>>;

export async function fetchBaseRollups(
  supabase: SupabaseClient,
  granularity: string,
  startDate: Date,
  endDate: Date
): Promise<RollupRow[]> {
  if (!supabase) return [];
  const { data: rollups, error } = await supabase
    .from('chat_telemetry_rollups')
    .select('bucket_start, bucket_end, total_requests, success_count, failure_count, total_input_tokens, total_output_tokens, total_cost_usd, avg_duration_ms, avg_searches, avg_iterations')
    .eq('granularity', granularity)
    .gte('bucket_start', startDate.toISOString())
    .lt('bucket_start', endDate.toISOString())
    .order('bucket_start', { ascending: true });
  if (error) {
    console.warn('[Dashboard] Error fetching telemetry rollups:', error);
    return [];
  }
  return (rollups as RollupRow[]) || [];
}

export async function fetchDomainRollups(
  supabase: SupabaseClient,
  granularity: string,
  startDate: Date,
  endDate: Date,
  domain?: string
): Promise<DomainRollupRow[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('chat_telemetry_domain_rollups')
      .select('bucket_start, bucket_end, domain, total_requests, success_count, failure_count, total_input_tokens, total_output_tokens, total_cost_usd, avg_duration_ms, avg_searches, avg_iterations')
      .eq('granularity', granularity)
      .gte('bucket_start', startDate.toISOString())
      .lt('bucket_start', endDate.toISOString())
      .order('bucket_start', { ascending: true });
    if (domain) {
      query = query.eq('domain', domain);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Dashboard] Failed to load domain rollups:', error);
      return [];
    }
    return (data ?? []) as DomainRollupRow[];
  } catch (err) {
    console.error('[Dashboard] Exception loading domain rollups:', err);
    return [];
  }
}

export async function fetchModelRollups(
  supabase: SupabaseClient,
  granularity: string,
  startDate: Date,
  endDate: Date,
  domain?: string
): Promise<ModelRollupRow[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('chat_telemetry_model_rollups')
      .select('bucket_start, bucket_end, domain, model, total_requests, success_count, failure_count, total_input_tokens, total_output_tokens, total_cost_usd, avg_duration_ms, avg_searches, avg_iterations')
      .eq('granularity', granularity)
      .gte('bucket_start', startDate.toISOString())
      .lt('bucket_start', endDate.toISOString())
      .order('bucket_start', { ascending: true });
    if (domain) {
      query = query.eq('domain', domain);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Dashboard] Failed to load model rollups:', error);
      return [];
    }
    return (data ?? []) as ModelRollupRow[];
  } catch (err) {
    console.error('[Dashboard] Exception loading model rollups:', err);
    return [];
  }
}

export async function fetchTelemetryData(
  supabase: SupabaseClient,
  startDate: Date,
  domain?: string
) {
  if (!supabase) return [];
  let query = supabase
    .from('chat_telemetry')
    .select('created_at, success, cost_usd, input_tokens, output_tokens, total_tokens, duration_ms, iterations, search_count, model, domain')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });
  if (domain) {
    query = query.eq('domain', domain);
  }
  const { data, error } = await query;
  if (error) {
    console.error('[Dashboard] Error fetching telemetry:', error);
    throw error;
  }
  return data ?? [];
}

export async function getTrendFromRaw(
  supabase: SupabaseClient,
  startDate: Date,
  domain?: string
): Promise<HourlyTrendPoint[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from('chat_telemetry')
      .select('created_at, cost_usd')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });
    if (domain) {
      query = query.eq('domain', domain);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('Could not fetch hourly trend:', error);
      return [];
    }
    const hourlyData: Record<string, HourlyTrendPoint> = {};
    const rows = (data ?? []) as Array<{ created_at: string; cost_usd: number | string | null }>;
    rows.forEach((row) => {
      const hour = new Date(row.created_at);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();
      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          cost: 0,
          requests: 0
        };
      }
      hourlyData[hourKey].cost += Number(row.cost_usd || 0);
      hourlyData[hourKey].requests++;
    });
    return Object.values(hourlyData)
      .sort((a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime())
      .map((point) => ({
        hour: point.hour,
        cost: point.cost,
        requests: point.requests
      }));
  } catch (error) {
    console.error('Error calculating hourly trend from raw data:', error);
    return [];
  }
}
