/**
 * Dashboard Analytics Types
 */

import type { AnomalySeverity } from '@/lib/analytics/anomaly-types';

export interface DashboardAnalyticsTopQuery {
  query: string;
  count: number;
  percentage: number;
}

export interface DashboardAnomaly {
  metric: string;
  severity: AnomalySeverity;
  message: string;
  currentValue: number;
  expectedValue: number;
  percentChange: number;
  detectedAt: string;
  recommendation?: string;
}

export interface ComparisonMetric {
  change: number;
  percentChange: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface MetricComparison {
  current: number;
  previous: number;
  comparison: ComparisonMetric;
}

export interface DashboardAnalyticsComparison {
  metrics: {
    responseTime: MetricComparison;
    satisfactionScore: MetricComparison;
    resolutionRate: MetricComparison;
    totalMessages: MetricComparison;
  };
  userMetrics: {
    dailyActiveUsers: MetricComparison;
    totalUniqueUsers: MetricComparison;
    avgSessionDuration: MetricComparison;
    bounceRate: MetricComparison;
  };
  shoppingBehavior: {
    productViews: MetricComparison;
    cartViews: MetricComparison;
    checkoutViews: MetricComparison;
    conversionRate: MetricComparison;
  };
}

export interface DashboardUserMetrics {
  dailyActiveUsers: number;
  totalUniqueUsers: number;
  growthRate: number;
  growthAbsolute: number;
}

export interface DashboardSessionMetrics {
  avgDuration: number;
  medianDuration: number;
  totalSessions: number;
  bounceRate: number;
}

export interface DashboardPageViews {
  total: number;
  uniquePages: number;
  avgPerSession: number;
  topPages: Array<{
    page: string;
    views: number;
    percentage: number;
  }>;
}

export interface DashboardShoppingBehavior {
  productViews: number;
  uniqueProducts: number;
  cartViews: number;
  checkoutViews: number;
  conversionRate: number;
  avgProductsPerSession: number;
}

export interface DashboardUserAnalytics {
  userMetrics: DashboardUserMetrics;
  sessionMetrics: DashboardSessionMetrics;
  pageViews: DashboardPageViews;
  shoppingBehavior: DashboardShoppingBehavior;
  dailyUsers: Array<{
    date: string;
    users: number;
  }>;
}

export interface DashboardAnalytics {
  responseTime: number;
  satisfactionScore: number;
  resolutionRate: number;
  topQueries: DashboardAnalyticsTopQuery[];
  failedSearches: string[];
  languageDistribution: Array<{
    language: string;
    percentage: number;
    count: number;
  }>;
  dailySentiment: Array<{
    date: string;
    positive: number;
    negative: number;
    neutral: number;
  }>;
  metrics: {
    totalMessages: number;
    userMessages: number;
    avgMessagesPerDay: number;
    positiveMessages: number;
    negativeMessages: number;
  };
  comparison?: {
    totalMessages?: MetricComparison;
    responseTime?: MetricComparison;
    satisfactionScore?: MetricComparison;
    resolutionRate?: MetricComparison;
    positiveMessages?: MetricComparison;
    negativeMessages?: MetricComparison;
  };
  anomalies?: DashboardAnomaly[];
}