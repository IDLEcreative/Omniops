/**
 * Utility functions for telemetry processing
 */

import type { HourlyTrendPoint } from './types';

export function numberFromValue(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function calculateTrend(trend: Array<{ cost: number }> = []): string {
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

export function calculateCostProjections(
  totalCost: number,
  startDate: Date,
  endDate: Date
) {
  const hoursElapsed = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  const costPerHour = hoursElapsed > 0 ? totalCost / hoursElapsed : 0;
  const projectedDailyCost = costPerHour * 24;
  const projectedMonthlyCost = projectedDailyCost * 30;

  return {
    costPerHour,
    projectedDailyCost,
    projectedMonthlyCost,
  };
}

export function calculateRollupFreshness(
  baseRollups: Array<{ bucket_end?: string; bucket_start: string }>,
  domainRollups: Array<{ bucket_end?: string; bucket_start: string }>,
  modelRollups: Array<{ bucket_end?: string; bucket_start: string }>
) {
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

  return {
    freshnessMinutes,
    rollupSource,
    rollupStale,
  };
}
