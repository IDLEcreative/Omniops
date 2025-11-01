import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@/types/supabase';
import { telemetryManager } from '@/lib/chat-telemetry';
import { z } from 'zod';
import {
  getPeriodStartDate,
  calculateMetrics,
  getHourlyTrend,
  checkCostAlerts,
  setCoastAlert,
  getCostSummary,
  cleanupOldTelemetry,
} from './services';

// Query parameter schema
export const QuerySchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']).optional().default('day'),
  domain: z.string().optional(),
  model: z.string().optional(),
  includeDetails: z.boolean().optional().default(false),
  includeLive: z.boolean().optional().default(true),
});

export type QueryParams = z.infer<typeof QuerySchema>;

/**
 * Handle GET request for telemetry data
 */
export async function handleGetTelemetry(
  request: NextRequest,
  supabase: SupabaseClient
) {
  const { searchParams } = new URL(request.url);
  const params = QuerySchema.parse({
    period: searchParams.get('period') || 'day',
    domain: searchParams.get('domain') || undefined,
    model: searchParams.get('model') || undefined,
    includeDetails: searchParams.get('details') === 'true',
    includeLive: searchParams.get('live') !== 'false',
  });

  const now = new Date();
  const startDate = getPeriodStartDate(params.period);

  // Build query
  let query = supabase
    .from('chat_telemetry')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false });

  if (params.domain) {
    query = query.eq('domain', params.domain);
  }

  if (params.model) {
    query = query.eq('model', params.model);
  }

  const { data: telemetryData, error } = await query;

  if (error) {
    console.error('Error fetching telemetry:', error);
    throw new Error('Failed to fetch telemetry data');
  }

  // Calculate metrics
  const metrics = calculateMetrics(
    telemetryData || [],
    params.period,
    startDate,
    now,
    params
  );

  // Include live session data if requested
  let liveMetrics = {};
  if (params.includeLive) {
    const hoursMap = {
      hour: 1,
      day: 24,
      week: 168,
      month: 720,
    };
    const liveAnalytics = telemetryManager.getCostAnalytics(hoursMap[params.period]);
    liveMetrics = {
      activeSessions: telemetryManager.getAllMetrics().sessions.length,
      liveAnalytics,
    };
  }

  // Get hourly trend data
  const hourlyTrend = await getHourlyTrend(supabase, startDate, params.domain);

  // Check for cost alerts
  const costAlerts = await checkCostAlerts(supabase, params.domain);

  return {
    success: true,
    metrics,
    hourlyTrend,
    costAlerts: costAlerts.filter((a: any) => a.exceeded),
    liveMetrics,
    details: params.includeDetails ? telemetryData?.slice(0, 100) : undefined,
    timestamp: now.toISOString(),
  };
}

/**
 * Handle POST request for monitoring actions
 */
export async function handleMonitoringAction(
  request: NextRequest,
  supabase: SupabaseClient
) {
  const body = await request.json();
  const { action, ...params } = body;

  switch (action) {
    case 'set-alert': {
      const alert = await setCoastAlert(supabase, params);
      return { success: true, alert };
    }

    case 'check-alerts': {
      const alerts = await checkCostAlerts(supabase, params.domain);
      return { success: true, alerts };
    }

    case 'get-summary': {
      const summary = await getCostSummary(supabase, params.domain, params.days || 7);
      return { success: true, summary };
    }

    case 'cleanup-old-data': {
      const cleanupResult = await cleanupOldTelemetry(supabase);
      return { success: true, ...cleanupResult };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}
