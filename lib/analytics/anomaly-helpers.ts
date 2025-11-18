/**
 * Anomaly Detection Helper Functions
 *
 * Internal utilities for anomaly detection
 */

import {
  type AnomalyMetric,
  type AnomalySeverity,
  CRITICAL_THRESHOLDS,
  WARNING_THRESHOLDS
} from './anomaly-types';

/**
 * Determine severity based on deviation magnitude
 */
export function determineSeverity(
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
export function generateRecommendation(
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
 * Create human-readable anomaly message
 */
export function createAnomalyMessage(
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
