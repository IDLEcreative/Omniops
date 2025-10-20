import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { telemetryManager } from '@/lib/chat-telemetry';

type RollupRow = {
  bucket_start: string;
  bucket_end: string;
  granularity?: string;
  total_requests: number | null;
  success_count: number | null;
  failure_count: number | null;
  total_input_tokens: number | null;
  total_output_tokens: number | null;
  total_cost_usd: string | number | null;
  avg_duration_ms: number | null;
  avg_searches: string | number | null;
  avg_iterations: string | number | null;
};

type HourlyTrendPoint = {
  hour: string;
  cost: number;
  requests: number;
};

type LiveSessionMetric = {
  sessionId: string;
  uptime: number;
  estimatedCost?: number;
  model: string;
};

type DomainRollupRow = {
  bucket_start: string;
  bucket_end: string;
  granularity?: string;
  domain: string;
  total_requests: number | null;
  success_count: number | null;
  failure_count: number | null;
  total_input_tokens: number | string | null;
  total_output_tokens: number | string | null;
  total_cost_usd: number | string | null;
  avg_duration_ms: number | null;
  avg_searches: number | string | null;
  avg_iterations: number | string | null;
};

type ModelRollupRow = {
  bucket_start: string;
  bucket_end: string;
  granularity?: string;
  domain: string | null;
  model: string;
  total_requests: number | null;
  success_count: number | null;
  failure_count: number | null;
  total_input_tokens: number | string | null;
  total_output_tokens: number | string | null;
  total_cost_usd: number | string | null;
  avg_duration_ms: number | null;
  avg_searches: number | string | null;
  avg_iterations: number | string | null;
};

interface ModelUsageTotals {
  count: number;
  cost: number;
  tokens: number;
}

interface DomainBreakdownMetrics {
  requests: number;
  cost: number;
}

interface RollupAggregate {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  avgDuration: number;
  totalSearches: number;
  avgSearchesPerRequest: number;
  avgIterations: number;
  trendPoints: HourlyTrendPoint[];
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '7');
    const domain = searchParams.get('domain') || undefined;
    
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }
    
    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const rollupGranularity = days <= 2 ? 'hour' : 'day';
    const canUseRollups = !domain;
    let rollupAggregate: RollupAggregate | null = null;
    let baseRollups: RollupRow[] = [];

    if (canUseRollups) {
      const { data: rollups, error: rollupError } = await supabase
        .from('chat_telemetry_rollups')
        .select('bucket_start, bucket_end, total_requests, success_count, failure_count, total_input_tokens, total_output_tokens, total_cost_usd, avg_duration_ms, avg_searches, avg_iterations')
        .eq('granularity', rollupGranularity)
        .gte('bucket_start', startDate.toISOString())
        .lt('bucket_start', endDate.toISOString())
        .order('bucket_start', { ascending: true });

      if (rollupError) {
        console.warn('[Dashboard] Error fetching telemetry rollups:', rollupError);
      } else if (rollups && rollups.length > 0) {
        baseRollups = rollups as RollupRow[];
        rollupAggregate = aggregateRollups(baseRollups);
      }
    }

    let query = supabase
      .from('chat_telemetry')
      .select('created_at, success, cost_usd, input_tokens, output_tokens, total_tokens, duration_ms, iterations, search_count, model, domain')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (domain) {
      query = query.eq('domain', domain);
    }
    
    const { data: telemetryData, error } = await query;
    
    if (error) {
      console.error('[Dashboard] Error fetching telemetry:', error);
      throw error;
    }
    
    const telemetryRows = telemetryData ?? [];
    
    const totalRequests = rollupAggregate?.totalRequests ?? telemetryRows.length;
    const successfulRequests = rollupAggregate?.successfulRequests ?? telemetryRows.filter((t) => t.success).length;
    const failedRequests = rollupAggregate?.failedRequests ?? telemetryRows.filter((t) => !t.success).length;
    
    const totalInputTokens = rollupAggregate?.totalInputTokens ?? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.input_tokens), 0);
    const totalOutputTokens = rollupAggregate?.totalOutputTokens ?? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.output_tokens), 0);
    const totalTokens = rollupAggregate
      ? rollupAggregate.totalInputTokens + rollupAggregate.totalOutputTokens
      : telemetryRows.reduce((sum, t) => sum + numberFromValue(t.total_tokens), 0);
    
    const totalCost = rollupAggregate?.totalCost ?? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.cost_usd), 0);
    const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;
    
    const avgDuration = rollupAggregate?.avgDuration ?? (
      totalRequests > 0
        ? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.duration_ms), 0) / totalRequests
        : 0
    );

    const totalSearchesRaw = telemetryRows.reduce((sum, t) => sum + numberFromValue(t.search_count), 0);
    const totalSearches = rollupAggregate?.totalSearches ?? totalSearchesRaw;
    const avgSearchesPerRequestNumber = totalRequests > 0
      ? (rollupAggregate ? rollupAggregate.avgSearchesPerRequest : totalSearches / totalRequests)
      : 0;
    const avgIterationsNumber = rollupAggregate?.avgIterations ?? (
      telemetryRows.length
        ? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.iterations), 0) / telemetryRows.length
        : 0
    );

    const rollupTrend = rollupAggregate?.trendPoints ?? [];
    const hourlyTrend: HourlyTrendPoint[] = rollupTrend.length > 0
      ? rollupTrend
      : await getTrendFromRaw(supabase, startDate, domain);

    const [domainRollups, modelRollups] = await Promise.all([
      fetchDomainRollups(supabase, rollupGranularity, startDate, endDate, domain),
      fetchModelRollups(supabase, rollupGranularity, startDate, endDate, domain),
    ]);
    
    const rollupTimestamps: number[] = [];
    const collectBucketTime = (value?: string) => {
      if (!value) return;
      const timestamp = Date.parse(value);
      if (!Number.isNaN(timestamp)) {
        rollupTimestamps.push(timestamp);
      }
    };
    baseRollups.forEach((row) => collectBucketTime(row.bucket_end || row.bucket_start));
    domainRollups.forEach((row) => collectBucketTime(row.bucket_end || row.bucket_start));
    modelRollups.forEach((row) => collectBucketTime(row.bucket_end || row.bucket_start));
    
    const latestRollupMs = rollupTimestamps.length > 0 ? Math.max(...rollupTimestamps) : null;
    const freshnessMinutes = latestRollupMs !== null
      ? Math.max(0, (Date.now() - latestRollupMs) / 60000)
      : null;
    const rollupDataAvailable = baseRollups.length > 0 || domainRollups.length > 0 || modelRollups.length > 0;
    const rollupSource: 'rollup' | 'raw' = rollupDataAvailable ? 'rollup' : 'raw';
    const staleThresholdMinutes = 60;
    const rollupStale = rollupDataAvailable
      ? freshnessMinutes === null || freshnessMinutes > staleThresholdMinutes
      : true;
    
    const totalSearchesCount = Math.round(totalSearches);
    const avgSearchesPerRequest = Number.isFinite(avgSearchesPerRequestNumber)
      ? avgSearchesPerRequestNumber.toFixed(1)
      : '0';
    const avgIterationsDisplay = Number.isFinite(avgIterationsNumber)
      ? avgIterationsNumber.toFixed(1)
      : '0';
    
    // Model usage breakdown (prefer rollups, fallback to raw telemetry)
    let modelUsageMap: Record<string, ModelUsageTotals> = {};
    if (modelRollups.length > 0) {
      modelUsageMap = summarizeModelRollups(modelRollups);
    }
    if (Object.keys(modelUsageMap).length === 0) {
      modelUsageMap = summarizeModelUsageFromRaw(telemetryRows);
    }
    
    // Domain breakdown (prefer rollups, fallback to raw telemetry)
    let domainBreakdownMap: Record<string, DomainBreakdownMetrics> = {};
    if (domainRollups.length > 0) {
      domainBreakdownMap = summarizeDomainRollups(domainRollups);
    }
    if (Object.keys(domainBreakdownMap).length === 0) {
      domainBreakdownMap = summarizeDomainBreakdownFromRaw(telemetryRows, domain);
    }
    
    // Get live session metrics
    const liveMetrics = telemetryManager.getAllMetrics();
    const activeSessions = liveMetrics.sessions.length;
    const liveTotalCost = liveMetrics.summary.totalCostUSD;
    
    // Calculate cost projections
    const hoursElapsed = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const costPerHour = hoursElapsed > 0 ? totalCost / hoursElapsed : 0;
    const projectedDailyCost = costPerHour * 24;
    const projectedMonthlyCost = projectedDailyCost * 30;
    
    // Error rate calculation
    const errorRate = totalRequests > 0
      ? Math.round((failedRequests / totalRequests) * 100)
      : 0;
    
    return NextResponse.json({
      // Overview metrics
      overview: {
        totalRequests,
        successfulRequests,
        failedRequests,
        successRate: totalRequests > 0 
          ? Math.round((successfulRequests / totalRequests) * 100)
          : 100,
        errorRate,
        activeSessions,
        timeRange: `Last ${days} days`
      },
      
      // Cost metrics
      cost: {
        total: totalCost.toFixed(4),
        average: avgCostPerRequest.toFixed(6),
        projectedDaily: projectedDailyCost.toFixed(2),
        projectedMonthly: projectedMonthlyCost.toFixed(2),
        perHour: costPerHour.toFixed(4),
        trend: calculateTrend(hourlyTrend)
      },
      
      // Token usage
      tokens: {
        totalInput: totalInputTokens,
        totalOutput: totalOutputTokens,
        total: totalTokens,
        avgPerRequest: totalRequests > 0 
          ? Math.round(totalTokens / totalRequests)
          : 0
      },
      
      // Performance
      performance: {
        avgResponseTime: Math.round(avgDuration),
        totalSearches: totalSearchesCount,
        avgSearchesPerRequest,
        avgIterations: avgIterationsDisplay
      },
      
      // Breakdowns
      modelUsage: Object.entries(modelUsageMap).map(([modelName, usage]) => ({
        model: modelName,
        count: usage.count,
        cost: usage.cost.toFixed(4),
        tokens: usage.tokens,
        percentage: totalRequests > 0
          ? Math.round((usage.count / totalRequests) * 100)
          : 0
      })),
      
      domainBreakdown: Object.entries(domainBreakdownMap).map(([domainName, metrics]) => ({
        domain: domainName,
        requests: metrics.requests,
        cost: metrics.cost.toFixed(4)
      })),
      
      // Hourly trend for charts
      hourlyTrend: hourlyTrend.map((point) => ({
        hour: point.hour,
        cost: Number(point.cost.toFixed(6)),
        requests: point.requests
      })),
      
      // Live session info
      live: {
        activeSessions,
        currentCost: liveTotalCost.toFixed(6),
        sessionsData: (liveMetrics.sessions as LiveSessionMetric[]).slice(0, 5).map((session) => ({
          id: session.sessionId,
          uptime: Math.round(session.uptime / 1000), // Convert to seconds
          cost: session.estimatedCost?.toFixed(6) || '0',
          model: session.model
        }))
      },

      health: {
        rollupFreshnessMinutes: freshnessMinutes !== null ? Number(freshnessMinutes.toFixed(2)) : null,
        rollupSource,
        stale: rollupStale
      }
    });
    
  } catch (error) {
    console.error('[Dashboard] Error fetching telemetry data:', error);
    
    // Return default values on error
    return NextResponse.json(
      {
        overview: {
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRate: 100,
          errorRate: 0,
          activeSessions: 0,
          timeRange: 'Last 7 days'
        },
        cost: {
          total: '0.0000',
          average: '0.000000',
          projectedDaily: '0.00',
          projectedMonthly: '0.00',
          perHour: '0.0000',
          trend: 'stable'
        },
        tokens: {
          totalInput: 0,
          totalOutput: 0,
          total: 0,
          avgPerRequest: 0
        },
        performance: {
          avgResponseTime: 0,
          totalSearches: 0,
          avgSearchesPerRequest: '0',
          avgIterations: '0'
        },
        modelUsage: [],
        domainBreakdown: [],
        hourlyTrend: [],
        live: {
          activeSessions: 0,
          currentCost: '0.000000',
          sessionsData: []
        },
        health: {
          rollupFreshnessMinutes: null,
          rollupSource: 'raw',
          stale: true
        }
      },
      { status: 200 }
    );
  }
}

// Helper to build trend data directly from telemetry rows when rollups are unavailable
async function getTrendFromRaw(
  supabase: ReturnType<typeof createServiceRoleClient> extends Promise<infer T> ? T : never,
  startDate: Date,
  domain?: string
): Promise<HourlyTrendPoint[]> {
  if (!supabase) {
    return [];
  }
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
    
    // Group by hour
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

function aggregateRollups(rows: RollupRow[]): RollupAggregate {
  const accumulator = rows.reduce(
    (acc, row) => {
      const requests = row.total_requests ?? 0;
      const successes = row.success_count ?? 0;
      const failures = row.failure_count ?? 0;
      const inputTokens = numberFromValue(row.total_input_tokens);
      const outputTokens = numberFromValue(row.total_output_tokens);
      const cost = numberFromValue(row.total_cost_usd);
      const avgDuration = numberFromValue(row.avg_duration_ms);
      const avgSearches = numberFromValue(row.avg_searches);
      const avgIterations = numberFromValue(row.avg_iterations);

      acc.totalRequests += requests;
      acc.successfulRequests += successes;
      acc.failedRequests += failures;
      acc.totalInputTokens += inputTokens;
      acc.totalOutputTokens += outputTokens;
      acc.totalCost += cost;
      acc.durationWeightedSum += avgDuration * requests;
      acc.searchesWeightedSum += avgSearches * requests;
      acc.iterationsWeightedSum += avgIterations * requests;
      acc.points.push({
        hour: row.bucket_start,
        cost,
        requests
      });
      return acc;
    },
    {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      durationWeightedSum: 0,
      searchesWeightedSum: 0,
      iterationsWeightedSum: 0,
      points: [] as HourlyTrendPoint[]
    }
  );

  const totalRequests = accumulator.totalRequests;
  const avgDuration = totalRequests > 0 ? accumulator.durationWeightedSum / totalRequests : 0;
  const totalSearches = accumulator.searchesWeightedSum;
  const avgSearchesPerRequest = totalRequests > 0 ? totalSearches / totalRequests : 0;
  const avgIterations = totalRequests > 0 ? accumulator.iterationsWeightedSum / totalRequests : 0;

  const trendPoints = accumulator.points.sort(
    (a, b) => new Date(a.hour).getTime() - new Date(b.hour).getTime()
  );

  return {
    totalRequests,
    successfulRequests: accumulator.successfulRequests,
    failedRequests: accumulator.failedRequests,
    totalInputTokens: accumulator.totalInputTokens,
    totalOutputTokens: accumulator.totalOutputTokens,
    totalCost: accumulator.totalCost,
    avgDuration,
    totalSearches,
    avgSearchesPerRequest,
    avgIterations,
    trendPoints
  };
}

async function fetchDomainRollups(
  supabase: ReturnType<typeof createServiceRoleClient> extends Promise<infer T> ? T : never,
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

async function fetchModelRollups(
  supabase: ReturnType<typeof createServiceRoleClient> extends Promise<infer T> ? T : never,
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

function summarizeDomainRollups(rows: DomainRollupRow[]): Record<string, DomainBreakdownMetrics> {
  return rows.reduce<Record<string, DomainBreakdownMetrics>>((acc, row) => {
    const domainKey = row.domain || 'unknown';
    if (!acc[domainKey]) {
      acc[domainKey] = { requests: 0, cost: 0 };
    }
    acc[domainKey].requests += row.total_requests ?? 0;
    acc[domainKey].cost += numberFromValue(row.total_cost_usd);
    return acc;
  }, {});
}

function summarizeModelRollups(rows: ModelRollupRow[]): Record<string, ModelUsageTotals> {
  return rows.reduce<Record<string, ModelUsageTotals>>((acc, row) => {
    const modelKey = row.model || 'unknown';
    if (!acc[modelKey]) {
      acc[modelKey] = { count: 0, cost: 0, tokens: 0 };
    }
    acc[modelKey].count += row.total_requests ?? 0;
    acc[modelKey].cost += numberFromValue(row.total_cost_usd);
    acc[modelKey].tokens += numberFromValue(row.total_input_tokens) + numberFromValue(row.total_output_tokens);
    return acc;
  }, {});
}

function summarizeDomainBreakdownFromRaw(
  rows: Array<{ domain?: string | null; cost_usd?: number | string | null }>,
  domainFilter?: string
): Record<string, DomainBreakdownMetrics> {
  return rows.reduce<Record<string, DomainBreakdownMetrics>>((acc, row) => {
    const domainValue = (typeof row.domain === 'string' && row.domain.trim().length > 0)
      ? row.domain.trim()
      : 'unknown';
    if (domainFilter && domainValue !== domainFilter) {
      return acc;
    }
    if (!acc[domainValue]) {
      acc[domainValue] = { requests: 0, cost: 0 };
    }
    acc[domainValue].requests += 1;
    acc[domainValue].cost += numberFromValue(row.cost_usd);
    return acc;
  }, {});
}

function summarizeModelUsageFromRaw(
  rows: Array<{ model?: string | null; cost_usd?: number | string | null; total_tokens?: number | string | null }>
): Record<string, ModelUsageTotals> {
  return rows.reduce<Record<string, ModelUsageTotals>>((acc, row) => {
    const modelValue = (typeof row.model === 'string' && row.model.trim().length > 0)
      ? row.model.trim()
      : 'unknown';
    if (!acc[modelValue]) {
      acc[modelValue] = { count: 0, cost: 0, tokens: 0 };
    }
    acc[modelValue].count += 1;
    acc[modelValue].cost += numberFromValue(row.cost_usd);
    acc[modelValue].tokens += numberFromValue(row.total_tokens);
    return acc;
  }, {});
}

function numberFromValue(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

// Helper function to calculate trend direction
function calculateTrend(trend: Array<{ cost: number }> = []): string {
  if (!trend || trend.length < 2) return 'stable';

  const recent = trend.slice(-6);
  if (recent.length < 2) return 'stable';

  const midpoint = Math.floor(recent.length / 2);
  const firstHalf = recent.slice(0, midpoint);
  const secondHalf = recent.slice(midpoint);

  const firstAverage = averageCost(firstHalf);
  const secondAverage = averageCost(secondHalf);

  const changePercent = firstAverage > 0
    ? ((secondAverage - firstAverage) / firstAverage) * 100
    : 0;

  if (changePercent > 20) return 'increasing';
  if (changePercent < -20) return 'decreasing';
  return 'stable';
}

function averageCost(points: Array<{ cost: number }>): number {
  if (!points.length) return 0;
  const sum = points.reduce((acc, point) => acc + Number(point.cost ?? 0), 0);
  return sum / points.length;
}
