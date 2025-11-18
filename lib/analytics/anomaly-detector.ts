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
  type DetectionConfig,
  CRITICAL_THRESHOLDS,
  WARNING_THRESHOLDS
} from './anomaly-types';

// Re-export types for backward compatibility
export type {
  AnomalyMetric,
  AnomalySeverity,
  Anomaly,
  HistoricalDataPoint,
  DetectionConfig
} from './anomaly-types';

/**
 * Determine severity based on deviation magnitude
 */
function determineSeverity(
  percentChange: number,
  metric: AnomalyMetric
): AnomalySeverity {
  const absChange = Math.abs(percentChange);

  if (absChange >= CRITICAL_THRESHOLDS[metric]) {
    return 'critical';
  }
  if (absChange >= WARNING_THRESHOLDS[metric]) {
    return 'warning';
  }
  return 'info';
}

/**
 * Generate recommendation based on anomaly type
 */
function generateRecommendation(
  metric: AnomalyMetric,
  severity: AnomalySeverity,
  percentChange: number
): string | undefined {
  if (severity === 'info') return undefined;

  const isIncrease = percentChange > 0;

  const recommendations: Record<AnomalyMetric, { increase: string; decrease: string }> = {
    responseTime: {
      increase: 'Check server load and optimize database queries. Consider scaling resources.',
      decrease: 'Performance improvement detected. Document what changed for future reference.'
    },
    errorRate: {
      increase: 'Investigate error logs immediately. Check recent deployments and external dependencies.',
      decrease: 'Error rate improvement detected. Verify fixes are working as expected.'
    },
    bounceRate: {
      increase: 'Review landing page performance and user experience. Check page load times.',
      decrease: 'Bounce rate improvement detected. Analyze what content/UX changes worked.'
    },
    conversionRate: {
      increase: 'Positive trend! Analyze successful changes and consider A/B testing further improvements.',
      decrease: 'Review checkout flow for issues. Check for technical problems or UX friction.'
    },
    satisfactionScore: {
      increase: 'Great improvement! Document successful changes for best practices.',
      decrease: 'Review recent customer feedback. Check for service quality issues.'
    },
    resolutionRate: {
      increase: 'Support efficiency improving. Share successful practices with team.',
      decrease: 'Review support processes. Check if complexity of issues has increased.'
    },
    trafficVolume: {
      increase: 'Traffic spike detected. Ensure infrastructure can handle load. Check for campaigns or external events.',
      decrease: 'Traffic drop detected. Check for technical issues, SEO changes, or marketing gaps.'
    }
  };

  const recommendation = recommendations[metric];
  return isIncrease ? recommendation.increase : recommendation.decrease;
}

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
 * Create human-readable anomaly message
 */
function createAnomalyMessage(
  metric: AnomalyMetric,
  percentChange: number,
  severity: AnomalySeverity
): string {
  const metricNames: Record<AnomalyMetric, string> = {
    responseTime: 'Response time',
    errorRate: 'Error rate',
    bounceRate: 'Bounce rate',
    conversionRate: 'Conversion rate',
    satisfactionScore: 'Satisfaction score',
    resolutionRate: 'Resolution rate',
    trafficVolume: 'Traffic volume'
  };

  const metricName = metricNames[metric];
  const direction = percentChange > 0 ? 'increased' : 'decreased';
  const absChange = Math.abs(percentChange).toFixed(1);

  const severityText = severity === 'critical' ? 'significantly ' :
                       severity === 'warning' ? 'notably ' : '';

  return `${metricName} has ${severityText}${direction} by ${absChange}%`;
}

/**
 * Calculate statistical baselines for historical data
 * Useful for understanding normal ranges before detecting anomalies
 */
export function calculateBaselines(
  historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>>
): Partial<Record<AnomalyMetric, { mean: number; median: number; stdDev: number }>> {
  const baselines: Partial<Record<AnomalyMetric, { mean: number; median: number; stdDev: number }>> = {};

  (Object.keys(historicalData) as AnomalyMetric[]).forEach(metric => {
    const points = historicalData[metric];
    if (!points || points.length === 0) return;

    const values = points.map(p => p.value);
    const mean = calculateMean(values);
    const median = calculateMedian(values);
    const stdDev = calculateStdDev(values, mean);

    baselines[metric] = { mean, median, stdDev };
  });

  return baselines;
}