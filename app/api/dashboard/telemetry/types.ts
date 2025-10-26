/**
 * Type definitions for telemetry API
 */

export type RollupRow = {
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

export type HourlyTrendPoint = {
  hour: string;
  cost: number;
  requests: number;
};

export type LiveSessionMetric = {
  sessionId: string;
  uptime: number;
  estimatedCost?: number;
  model: string;
};

export type DomainRollupRow = {
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

export type ModelRollupRow = {
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

export interface ModelUsageTotals {
  count: number;
  cost: number;
  tokens: number;
}

export interface DomainBreakdownMetrics {
  requests: number;
  cost: number;
}

export interface RollupAggregate {
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

export interface TelemetryResponse {
  overview: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    successRate: number;
    errorRate: number;
    activeSessions: number;
    timeRange: string;
  };
  cost: {
    total: string;
    average: string;
    projectedDaily: string;
    projectedMonthly: string;
    perHour: string;
    trend: string;
  };
  tokens: {
    totalInput: number;
    totalOutput: number;
    total: number;
    avgPerRequest: number;
  };
  performance: {
    avgResponseTime: number;
    totalSearches: number;
    avgSearchesPerRequest: string;
    avgIterations: string;
  };
  modelUsage: Array<{
    model: string;
    count: number;
    cost: string;
    tokens: number;
    percentage: number;
  }>;
  domainBreakdown: Array<{
    domain: string;
    requests: number;
    cost: string;
  }>;
  hourlyTrend: Array<{
    hour: string;
    cost: number;
    requests: number;
  }>;
  live: {
    activeSessions: number;
    currentCost: string;
    sessionsData: Array<{
      id: string;
      uptime: number;
      cost: string;
      model: string;
    }>;
  };
  health: {
    rollupFreshnessMinutes: number | null;
    rollupSource: 'rollup' | 'raw';
    stale: boolean;
  };
}
