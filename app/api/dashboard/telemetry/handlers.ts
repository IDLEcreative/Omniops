/**
 * Request handlers for telemetry API
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { telemetryManager } from '@/lib/chat-telemetry';
import type { TelemetryResponse, LiveSessionMetric } from './types';
import { validateQuery } from './validators';
import {
  fetchBaseRollups,
  fetchDomainRollups,
  fetchModelRollups,
  fetchTelemetryData,
  getTrendFromRaw,
} from './services';
import {
  aggregateRollups,
  summarizeDomainRollups,
  summarizeModelRollups,
  summarizeDomainBreakdownFromRaw,
  summarizeModelUsageFromRaw,
} from './aggregators';
import {
  numberFromValue,
  calculateTrend,
  calculateCostProjections,
  calculateRollupFreshness,
} from './utils';

export async function handleGetTelemetry(searchParams: URLSearchParams): Promise<TelemetryResponse> {
  const { days, domain } = validateQuery(searchParams);

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

  // Fetch base rollups if applicable
  const baseRollups = canUseRollups
    ? await fetchBaseRollups(supabase, rollupGranularity, startDate, endDate)
    : [];

  const rollupAggregate = baseRollups.length > 0 ? aggregateRollups(baseRollups) : null;

  // Fetch raw telemetry data
  const telemetryRows = await fetchTelemetryData(supabase, startDate, domain);

  // Fetch domain and model rollups in parallel
  const [domainRollups, modelRollups] = await Promise.all([
    fetchDomainRollups(supabase, rollupGranularity, startDate, endDate, domain),
    fetchModelRollups(supabase, rollupGranularity, startDate, endDate, domain),
  ]);

  // Calculate overview metrics
  const totalRequests = rollupAggregate?.totalRequests ?? telemetryRows.length;
  const successfulRequests = rollupAggregate?.successfulRequests ?? telemetryRows.filter((t) => t.success).length;
  const failedRequests = rollupAggregate?.failedRequests ?? telemetryRows.filter((t) => !t.success).length;

  // Calculate token metrics
  const totalInputTokens = rollupAggregate?.totalInputTokens ?? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.input_tokens), 0);
  const totalOutputTokens = rollupAggregate?.totalOutputTokens ?? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.output_tokens), 0);
  const totalTokens = rollupAggregate
    ? rollupAggregate.totalInputTokens + rollupAggregate.totalOutputTokens
    : telemetryRows.reduce((sum, t) => sum + numberFromValue(t.total_tokens), 0);

  // Calculate cost metrics
  const totalCost = rollupAggregate?.totalCost ?? telemetryRows.reduce((sum, t) => sum + numberFromValue(t.cost_usd), 0);
  const avgCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

  // Calculate performance metrics
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

  // Get hourly trend
  const rollupTrend = rollupAggregate?.trendPoints ?? [];
  const hourlyTrend = rollupTrend.length > 0
    ? rollupTrend
    : await getTrendFromRaw(supabase, startDate, domain);

  // Calculate rollup freshness
  const { freshnessMinutes, rollupSource, rollupStale } = calculateRollupFreshness(
    baseRollups,
    domainRollups,
    modelRollups
  );

  // Format metrics
  const totalSearchesCount = Math.round(totalSearches);
  const avgSearchesPerRequest = Number.isFinite(avgSearchesPerRequestNumber)
    ? avgSearchesPerRequestNumber.toFixed(1)
    : '0';
  const avgIterationsDisplay = Number.isFinite(avgIterationsNumber)
    ? avgIterationsNumber.toFixed(1)
    : '0';

  // Model usage breakdown (prefer rollups, fallback to raw telemetry)
  let modelUsageMap = modelRollups.length > 0
    ? summarizeModelRollups(modelRollups)
    : summarizeModelUsageFromRaw(telemetryRows);

  // Domain breakdown (prefer rollups, fallback to raw telemetry)
  let domainBreakdownMap = domainRollups.length > 0
    ? summarizeDomainRollups(domainRollups)
    : summarizeDomainBreakdownFromRaw(telemetryRows, domain);

  // Get live session metrics
  const liveMetrics = telemetryManager.getAllMetrics();
  const activeSessions = liveMetrics.sessions.length;
  const liveTotalCost = liveMetrics.summary.totalCostUSD;

  // Calculate cost projections
  const { costPerHour, projectedDailyCost, projectedMonthlyCost } = calculateCostProjections(
    totalCost,
    startDate,
    endDate
  );

  // Error rate calculation
  const errorRate = totalRequests > 0
    ? Math.round((failedRequests / totalRequests) * 100)
    : 0;

  return {
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
  };
}

export function getDefaultTelemetryResponse(): TelemetryResponse {
  return {
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
  };
}
