/**
 * Anomaly Detection Type Definitions
 */

export type AnomalyMetric =
  | 'responseTime'
  | 'conversionRate'
  | 'trafficVolume'
  | 'bounceRate'
  | 'satisfactionScore'
  | 'resolutionRate'
  | 'errorRate';

export type AnomalySeverity = 'critical' | 'warning' | 'info';

export interface Anomaly {
  metric: AnomalyMetric;
  severity: AnomalySeverity;
  message: string;
  currentValue: number;
  expectedValue: number;
  percentChange: number;
  detectedAt: string;
  recommendation?: string;
}

export interface HistoricalDataPoint {
  value: number;
  timestamp: string;
}

export interface DetectionConfig {
  stdDevThreshold?: number; // Default: 2
  percentChangeThreshold?: number; // Default: 40
  minDataPoints?: number; // Default: 7
}

export interface MetricThresholds {
  critical: number;
  warning: number;
}

export const CRITICAL_THRESHOLDS: Record<AnomalyMetric, number> = {
  responseTime: 100, // 100% slower = critical
  errorRate: 50, // 50% more errors = critical
  bounceRate: 60, // 60% higher bounce = critical
  conversionRate: 40, // 40% drop = critical
  satisfactionScore: 30, // 30% drop = critical
  resolutionRate: 40, // 40% drop = critical
  trafficVolume: 80, // 80% change = critical
};

export const WARNING_THRESHOLDS: Record<AnomalyMetric, number> = {
  responseTime: 50,
  errorRate: 25,
  bounceRate: 30,
  conversionRate: 20,
  satisfactionScore: 15,
  resolutionRate: 20,
  trafficVolume: 40,
};