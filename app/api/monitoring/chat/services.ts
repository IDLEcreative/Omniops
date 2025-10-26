import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Calculate period start date based on period type
 */
export function getPeriodStartDate(period: 'hour' | 'day' | 'week' | 'month'): Date {
  const now = new Date();
  const millisecondsMap = {
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  return new Date(now.getTime() - millisecondsMap[period]);
}

/**
 * Calculate aggregated telemetry metrics
 */
export function calculateMetrics(
  telemetryData: any[],
  period: string,
  startDate: Date,
  now: Date,
  params: { domain?: string }
) {
  const totalRequests = telemetryData.length;
  const successfulRequests = telemetryData.filter(t => t.success).length;

  return {
    period,
    periodStart: startDate.toISOString(),
    periodEnd: now.toISOString(),

    totalRequests,
    successfulRequests,
    failedRequests: totalRequests - successfulRequests,
    successRate: totalRequests
      ? ((successfulRequests / totalRequests) * 100).toFixed(2)
      : 0,

    tokenUsage: calculateTokenUsage(telemetryData),
    cost: calculateCostMetrics(telemetryData, startDate, now),
    performance: calculatePerformanceMetrics(telemetryData),
    modelBreakdown: calculateModelBreakdown(telemetryData),
    domainBreakdown: !params.domain ? calculateDomainBreakdown(telemetryData) : undefined,
  };
}

function calculateTokenUsage(telemetryData: any[]) {
  const totalInput = telemetryData.reduce((sum, t) => sum + (t.input_tokens || 0), 0);
  const totalOutput = telemetryData.reduce((sum, t) => sum + (t.output_tokens || 0), 0);

  return {
    totalInput,
    totalOutput,
    totalTokens: telemetryData.reduce((sum, t) => sum + (t.total_tokens || 0), 0),
    avgInputPerRequest: telemetryData.length
      ? Math.round(totalInput / telemetryData.length)
      : 0,
    avgOutputPerRequest: telemetryData.length
      ? Math.round(totalOutput / telemetryData.length)
      : 0,
  };
}

function calculateCostMetrics(telemetryData: any[], startDate: Date, now: Date) {
  const totalCost = telemetryData.reduce((sum, t) => sum + (t.cost_usd || 0), 0);
  const costs = telemetryData.filter(t => t.cost_usd > 0).map(t => t.cost_usd);
  const periodHours = (now.getTime() - startDate.getTime()) / (60 * 60 * 1000);
  const periodDays = periodHours / 24;

  return {
    totalCostUSD: totalCost.toFixed(4),
    avgCostPerRequest: telemetryData.length
      ? (totalCost / telemetryData.length).toFixed(6)
      : '0.000000',
    maxRequestCost: costs.length ? Math.max(...costs).toFixed(6) : '0.000000',
    minRequestCost: costs.length ? Math.min(...costs).toFixed(6) : '0.000000',
    costPerHour: (totalCost / periodHours).toFixed(4),
    projectedDailyCost: (totalCost / periodDays).toFixed(2),
    projectedMonthlyCost: (totalCost / periodDays * 30).toFixed(2),
  };
}

function calculatePerformanceMetrics(telemetryData: any[]) {
  const durations = telemetryData.map(t => t.duration_ms || 0).sort((a, b) => a - b);

  return {
    avgDurationMs: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0,
    medianDurationMs: durations.length
      ? durations[Math.floor(durations.length / 2)]
      : 0,
    p95DurationMs: durations.length
      ? durations[Math.floor(durations.length * 0.95)]
      : 0,
    avgIterations: telemetryData.length
      ? (telemetryData.reduce((sum, t) => sum + (t.iterations || 0), 0) / telemetryData.length).toFixed(2)
      : '0',
    avgSearches: telemetryData.length
      ? (telemetryData.reduce((sum, t) => sum + (t.search_count || 0), 0) / telemetryData.length).toFixed(2)
      : '0',
  };
}

function calculateModelBreakdown(telemetryData: any[]) {
  const breakdown = telemetryData.reduce((acc, t) => {
    const model = t.model || 'unknown';
    if (!acc[model]) {
      acc[model] = {
        requests: 0,
        tokens: 0,
        cost: 0,
        durations: [],
      };
    }
    acc[model].requests++;
    acc[model].tokens += t.total_tokens || 0;
    acc[model].cost += t.cost_usd || 0;
    acc[model].durations.push(t.duration_ms || 0);
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages and format
  Object.keys(breakdown).forEach(model => {
    const data = breakdown[model];
    data.avgDuration = data.durations.length
      ? Math.round(data.durations.reduce((a: number, b: number) => a + b, 0) / data.durations.length)
      : 0;
    data.cost = data.cost.toFixed(6);
    delete data.durations;
  });

  return breakdown;
}

function calculateDomainBreakdown(telemetryData: any[]) {
  const breakdown = telemetryData.reduce((acc, t) => {
    const domain = t.domain || 'unknown';
    if (!acc[domain]) {
      acc[domain] = {
        requests: 0,
        cost: 0,
        tokens: 0,
      };
    }
    acc[domain].requests++;
    acc[domain].cost += t.cost_usd || 0;
    acc[domain].tokens += t.total_tokens || 0;
    return acc;
  }, {} as Record<string, any>);

  // Format costs
  Object.keys(breakdown).forEach(domain => {
    breakdown[domain].cost = breakdown[domain].cost.toFixed(6);
  });

  return breakdown;
}

/**
 * Get hourly trend data
 */
export async function getHourlyTrend(
  supabase: SupabaseClient,
  startDate: Date,
  domain?: string
) {
  if (domain) {
    const { data } = await supabase
      .from('chat_telemetry')
      .select('created_at, cost_usd, input_tokens, output_tokens')
      .eq('domain', domain)
      .gte('created_at', startDate.toISOString());

    const hourlyData: Record<string, any> = {};
    data?.forEach((row: any) => {
      const hour = new Date(row.created_at);
      hour.setMinutes(0, 0, 0);
      const hourKey = hour.toISOString();

      if (!hourlyData[hourKey]) {
        hourlyData[hourKey] = {
          hour: hourKey,
          requests: 0,
          cost: 0,
          input_tokens: 0,
          output_tokens: 0,
        };
      }

      hourlyData[hourKey].requests++;
      hourlyData[hourKey].cost += row.cost_usd || 0;
      hourlyData[hourKey].input_tokens += row.input_tokens || 0;
      hourlyData[hourKey].output_tokens += row.output_tokens || 0;
    });

    return Object.values(hourlyData).map(h => ({
      ...h,
      cost: h.cost.toFixed(6),
    }));
  }

  const { data } = await supabase
    .from('chat_telemetry_hourly_costs')
    .select('*')
    .gte('hour', startDate.toISOString())
    .order('hour', { ascending: false });

  return data || [];
}

/**
 * Check cost alerts
 */
export async function checkCostAlerts(supabase: SupabaseClient, domain?: string) {
  const { data } = await supabase.rpc('check_cost_thresholds');

  if (domain) {
    return data?.filter((a: any) => !a.domain || a.domain === domain) || [];
  }

  return data || [];
}

/**
 * Set cost alert
 */
export async function setCoastAlert(supabase: SupabaseClient, params: any) {
  const { domain, alert_type, threshold_usd } = params;

  const { data, error } = await supabase
    .from('chat_cost_alerts')
    .upsert({
      domain,
      alert_type,
      threshold_usd,
      enabled: true,
    }, {
      onConflict: 'domain,alert_type'
    });

  if (error) {
    throw new Error(`Failed to set cost alert: ${error.message}`);
  }

  return data;
}

/**
 * Get cost summary
 */
export async function getCostSummary(
  supabase: SupabaseClient,
  domain: string | undefined,
  days: number
) {
  const { data, error } = await supabase
    .rpc('get_chat_cost_summary', {
      p_domain: domain || null,
      p_days: days
    });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Cleanup old telemetry data
 */
export async function cleanupOldTelemetry(supabase: SupabaseClient) {
  const { data, error } = await supabase.rpc('cleanup_old_telemetry');

  if (error) {
    throw error;
  }

  return {
    deletedCount: data,
    message: `Cleaned up ${data} old telemetry records`,
  };
}
