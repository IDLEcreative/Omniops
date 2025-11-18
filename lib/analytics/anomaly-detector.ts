/**
 * Anomaly Detection Library
 *
 * Detects unusual patterns in analytics metrics using statistical methods
 */

import {
  calculateMean,
  calculateStdDev,
  calculateMedian
} from './anomaly-statistics';

import {
  type AnomalyMetric,
  type AnomalySeverity,
  type Anomaly,
  type HistoricalDataPoint,
  type DetectionConfig
} from './anomaly-types';

import {
  determineSeverity,
  generateRecommendation,
  createAnomalyMessage
} from './anomaly-helpers';

// Re-export types for backward compatibility
export type {
  AnomalyMetric,
  AnomalySeverity,
  Anomaly,
  HistoricalDataPoint,
  DetectionConfig
} from './anomaly-types';

/**
 * Detect anomalies in current metrics compared to historical data
 */
export function detectAnomalies(
  currentMetrics: Partial<Record<AnomalyMetric, number>>,
  historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>>,
  config: DetectionConfig = {}
): Anomaly[] {
  const {
    stdDevThreshold = 2,
    percentChangeThreshold = 40,
    minDataPoints = 7
  } = config;

  const anomalies: Anomaly[] = [];

  // Process each metric
  (Object.keys(currentMetrics) as AnomalyMetric[]).forEach(metric => {
    const currentValue = currentMetrics[metric];
    const historicalPoints = historicalData[metric];

    if (
      currentValue === undefined ||
      !historicalPoints ||
      historicalPoints.length < minDataPoints
    ) {
      return; // Skip metrics without enough data
    }

    // Extract values from historical points
    const historicalValues = historicalPoints.map(point => point.value);

    // Calculate statistics
    const mean = calculateMean(historicalValues);
    const stdDev = calculateStdDev(historicalValues, mean);
    const median = calculateMedian(historicalValues);

    // Use median for expected value (more robust to outliers)
    const expectedValue = median || mean;

    // Skip if no variation in historical data
    if (stdDev === 0 && currentValue === expectedValue) {
      return;
    }

    // Calculate deviations
    const stdDeviation = stdDev > 0 ? Math.abs(currentValue - mean) / stdDev : 0;
    const percentChange = expectedValue !== 0
      ? ((currentValue - expectedValue) / expectedValue) * 100
      : 0;

    // Check if anomaly based on thresholds
    const isStatisticalAnomaly = stdDeviation > stdDevThreshold;
    const isPercentAnomaly = Math.abs(percentChange) > percentChangeThreshold;

    if (isStatisticalAnomaly || isPercentAnomaly) {
      const severity = determineSeverity(percentChange, metric);
      const recommendation = generateRecommendation(metric, severity, percentChange);

      anomalies.push({
        metric,
        severity,
        message: createAnomalyMessage(metric, percentChange, severity),
        currentValue,
        expectedValue,
        percentChange,
        detectedAt: new Date().toISOString(),
        recommendation
      });
    }
  });

  // Sort by severity (critical first)
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  anomalies.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return anomalies;
}

/**
 * Detect threshold-based anomalies using statistical analysis
 */
export function detectThresholdAnomaly(
  currentValue: number,
  historicalValues: number[],
  metric: AnomalyMetric,
  config: DetectionConfig = {}
): Anomaly | null {
  const {
    stdDevThreshold = 2,
    minDataPoints = 7
  } = config;

  // Check if we have enough data
  if (historicalValues.length < minDataPoints) {
    return null;
  }

  // Calculate statistics
  const mean = calculateMean(historicalValues);
  const stdDev = calculateStdDev(historicalValues, mean);
  const median = calculateMedian(historicalValues);

  // Use median as expected value (more robust to outliers)
  const expectedValue = median || mean;

  // Calculate percent change
  const percentChange = expectedValue !== 0
    ? ((currentValue - expectedValue) / expectedValue) * 100
    : (currentValue > 0 ? 100 : 0);

  // For zero standard deviation, use percent change only
  if (stdDev === 0) {
    if (currentValue === expectedValue) {
      return null;
    }
    const severity = determineSeverity(percentChange, metric);
    const recommendation = generateRecommendation(metric, severity, percentChange);

    return {
      metric,
      severity,
      message: createAnomalyMessage(metric, percentChange, severity),
      currentValue,
      expectedValue,
      percentChange,
      detectedAt: new Date().toISOString(),
      recommendation
    };
  }

  // Calculate standard deviation from mean
  const stdDeviation = Math.abs(currentValue - mean) / stdDev;

  // Check if anomaly
  if (stdDeviation > stdDevThreshold) {
    const severity = determineSeverity(percentChange, metric);
    const recommendation = generateRecommendation(metric, severity, percentChange);

    return {
      metric,
      severity,
      message: createAnomalyMessage(metric, percentChange, severity),
      currentValue,
      expectedValue,
      percentChange,
      detectedAt: new Date().toISOString(),
      recommendation
    };
  }

  return null;
}

/**
 * Detect percentage-based anomalies
 */
export function detectPercentageAnomaly(
  currentValue: number,
  baselineValue: number,
  metric: AnomalyMetric,
  config: DetectionConfig = {}
): Anomaly | null {
  const {
    percentChangeThreshold = 50
  } = config;

  // Handle baseline of zero
  const percentChange = baselineValue !== 0
    ? ((currentValue - baselineValue) / baselineValue) * 100
    : (currentValue > 0 ? 100 : 0);

  // Check if change exceeds threshold
  if (Math.abs(percentChange) < percentChangeThreshold) {
    return null;
  }

  const severity = determineSeverity(percentChange, metric);
  const recommendation = generateRecommendation(metric, severity, percentChange);

  return {
    metric,
    severity,
    message: createAnomalyMessage(metric, percentChange, severity),
    currentValue,
    expectedValue: baselineValue,
    percentChange,
    detectedAt: new Date().toISOString(),
    recommendation
  };
}

/**
 * Detect pattern-based anomalies (spikes and drops)
 */
export function detectPatternAnomaly(
  recentValues: number[],
  metric: AnomalyMetric,
  config: DetectionConfig = {}
): Anomaly | null {
  const {
    minDataPoints = 5
  } = config;

  // Need at least 5 points to detect patterns
  if (recentValues.length < minDataPoints) {
    return null;
  }

  // Get last value and previous values
  const lastValue = recentValues[recentValues.length - 1];
  const previousValues = recentValues.slice(0, -1);

  // Check if this is a gradual trend (not a spike/drop)
  // Calculate differences between consecutive values
  const differences: number[] = [];
  for (let i = 1; i < recentValues.length; i++) {
    differences.push(recentValues[i] - recentValues[i - 1]);
  }

  // If all differences have the same sign and similar magnitude, it's a trend
  const allPositive = differences.every(d => d >= 0);
  const allNegative = differences.every(d => d <= 0);
  const isConsistentTrend = allPositive || allNegative;

  if (isConsistentTrend) {
    // Check if differences are similar (not a sudden spike at the end)
    const avgDiff = calculateMean(differences.map(Math.abs));
    const lastDiff = Math.abs(differences[differences.length - 1]);

    // If last difference is within 2x the average, it's gradual
    if (lastDiff <= avgDiff * 2) {
      return null;
    }
  }

  // Calculate mean of previous values
  const previousMean = calculateMean(previousValues);
  const previousStdDev = calculateStdDev(previousValues, previousMean);

  // Calculate how many standard deviations away the last value is
  if (previousStdDev === 0) {
    // If no variation, check for any change
    if (lastValue === previousMean) {
      return null;
    }
  } else {
    const stdDeviations = Math.abs(lastValue - previousMean) / previousStdDev;

    // If less than 2 standard deviations, not a spike/drop
    if (stdDeviations < 2) {
      return null;
    }
  }

  // Calculate percent change
  const percentChange = previousMean !== 0
    ? ((lastValue - previousMean) / previousMean) * 100
    : (lastValue > 0 ? 100 : 0);

  const severity = determineSeverity(percentChange, metric);
  const isSpike = lastValue > previousMean;
  const patternType = isSpike ? 'spike' : 'drop';

  return {
    metric,
    severity,
    message: createAnomalyMessage(metric, percentChange, severity).replace(
      lastValue > previousMean ? 'increased' : 'decreased',
      patternType
    ),
    currentValue: lastValue,
    expectedValue: previousMean,
    percentChange,
    detectedAt: new Date().toISOString(),
    recommendation: generateRecommendation(metric, severity, percentChange)
  };
}

/**
 * Calculate baseline statistics for historical data
 */
export function calculateBaselines(
  historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>>
): Partial<Record<AnomalyMetric, { mean: number; median: number; stdDev: number }>> {
  const baselines: Partial<Record<AnomalyMetric, { mean: number; median: number; stdDev: number }>> = {};

  (Object.keys(historicalData) as AnomalyMetric[]).forEach(metric => {
    const points = historicalData[metric];
    if (!points || points.length === 0) {
      return;
    }

    const values = points.map(p => p.value);
    const mean = calculateMean(values);
    const median = calculateMedian(values);
    const stdDev = calculateStdDev(values, mean);

    baselines[metric] = { mean, median, stdDev };
  });

  return baselines;
}