/**
 * Analytics Comparison Helper Functions
 *
 * Provides utilities for calculating period-over-period comparisons
 * for analytics metrics.
 */

import type { ComparisonMetric, MetricComparison } from '@/types/dashboard';

/**
 * Calculate comparison metrics between current and previous values
 */
export function calculateComparison(
  current: number,
  previous: number
): ComparisonMetric {
  const change = current - previous;
  const percentChange = previous > 0 ? (change / previous) * 100 : 0;

  let trend: 'up' | 'down' | 'neutral';
  if (change > 0) {
    trend = 'up';
  } else if (change < 0) {
    trend = 'down';
  } else {
    trend = 'neutral';
  }

  return {
    change,
    percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal
    trend,
  };
}

/**
 * Create a metric comparison object
 */
export function createMetricComparison(
  current: number,
  previous: number
): MetricComparison {
  return {
    current,
    previous,
    comparison: calculateComparison(current, previous),
  };
}

/**
 * Format change value with + or - prefix
 */
export function formatChange(change: number, decimals: number = 1): string {
  const formatted = Math.abs(change).toFixed(decimals);
  return change > 0 ? `+${formatted}` : change < 0 ? `-${formatted}` : '0';
}

/**
 * Format percent change with + or - prefix and % suffix
 */
export function formatPercentChange(percentChange: number): string {
  const formatted = Math.abs(percentChange).toFixed(1);
  const prefix = percentChange > 0 ? '+' : percentChange < 0 ? '-' : '';
  return `${prefix}${formatted}%`;
}

/**
 * Get color class based on trend and whether increase is good
 */
export function getTrendColor(
  trend: 'up' | 'down' | 'neutral',
  increaseIsGood: boolean = true
): string {
  if (trend === 'neutral') return 'text-gray-500';

  const isPositive = (trend === 'up' && increaseIsGood) || (trend === 'down' && !increaseIsGood);
  return isPositive ? 'text-green-600' : 'text-red-600';
}

/**
 * Get arrow icon based on trend
 */
export function getTrendIcon(trend: 'up' | 'down' | 'neutral'): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '−';
  }
}
