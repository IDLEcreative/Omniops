/**
 * Data aggregation functions for telemetry processing
 */

import type {
  RollupRow,
  HourlyTrendPoint,
  DomainRollupRow,
  ModelRollupRow,
  ModelUsageTotals,
  DomainBreakdownMetrics,
  RollupAggregate,
} from './types';
import { numberFromValue } from './utils';

export function aggregateRollups(rows: RollupRow[]): RollupAggregate {
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

export function summarizeDomainRollups(rows: DomainRollupRow[]): Record<string, DomainBreakdownMetrics> {
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

export function summarizeModelRollups(rows: ModelRollupRow[]): Record<string, ModelUsageTotals> {
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

export function summarizeDomainBreakdownFromRaw(
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

export function summarizeModelUsageFromRaw(
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
