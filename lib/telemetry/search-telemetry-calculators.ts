/**
 * Search Telemetry Statistics Calculators
 * Pure calculation functions for telemetry data aggregation
 */

import type { TelemetryStats } from './search-telemetry';

export function calculateProviderHealth(data: any[]): TelemetryStats['providerHealth'] {
  const platformMap = new Map<string, { total: number; success: number; duration: number }>();

  data.forEach((row) => {
    const platform = row.platform || 'unknown';
    const current = platformMap.get(platform) || { total: 0, success: 0, duration: 0 };

    current.total++;
    if (row.success) current.success++;
    current.duration += row.duration_ms || 0;

    platformMap.set(platform, current);
  });

  return Array.from(platformMap.entries()).map(([platform, stats]) => ({
    platform,
    successRate: stats.total > 0 ? stats.success / stats.total : 0,
    avgDuration: stats.total > 0 ? stats.duration / stats.total : 0,
    totalAttempts: stats.total,
  }));
}

export function calculateRetryPatterns(data: any[]): TelemetryStats['retryPatterns'] {
  if (data.length === 0) {
    return {
      avgRetries: 0,
      successRate: 0,
      p50Duration: 0,
      p95Duration: 0,
      p99Duration: 0,
    };
  }

  const retries = data.map((d) => d.retry_count || 0);
  const successes = data.filter((d) => d.final_success).length;
  const durations = data.map((d) => d.total_duration_ms || 0).sort((a, b) => a - b);

  const avgRetries = retries.reduce((a, b) => a + b, 0) / retries.length;
  const successRate = successes / data.length;

  return {
    avgRetries,
    successRate,
    p50Duration: percentile(durations, 0.5),
    p95Duration: percentile(durations, 0.95),
    p99Duration: percentile(durations, 0.99),
  };
}

export function calculateDomainLookupStats(data: any[]): TelemetryStats['domainLookup'] {
  if (data.length === 0) {
    return {
      methodDistribution: {},
      avgDuration: 0,
      successRate: 0,
    };
  }

  const methodDistribution: Record<string, number> = {};
  let totalDuration = 0;
  let successes = 0;

  data.forEach((row) => {
    const method = row.method || 'unknown';
    methodDistribution[method] = (methodDistribution[method] || 0) + 1;
    totalDuration += row.duration_ms || 0;
    if (row.success) successes++;
  });

  return {
    methodDistribution,
    avgDuration: totalDuration / data.length,
    successRate: successes / data.length,
  };
}

export function calculateCircuitBreakerStats(data: any[]): TelemetryStats['circuitBreaker'] {
  const openEvents = data.filter((d) => d.new_state === 'open').length;
  const halfOpenEvents = data.filter((d) => d.new_state === 'half-open').length;
  const failureCounts = data
    .filter((d) => d.new_state === 'open')
    .map((d) => d.failure_count || 0);

  const avgFailuresBeforeOpen =
    failureCounts.length > 0
      ? failureCounts.reduce((a, b) => a + b, 0) / failureCounts.length
      : 0;

  return {
    openEvents,
    halfOpenEvents,
    avgFailuresBeforeOpen,
  };
}

function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0;
  const index = Math.ceil(sortedArray.length * p) - 1;
  return sortedArray[Math.max(0, index)] || 0;
}
