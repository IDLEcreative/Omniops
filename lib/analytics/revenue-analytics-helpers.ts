/**
 * Revenue Analytics Helper Functions
 *
 * Shared utilities and empty state generators for revenue analytics
 */

import type {
  RevenueMetrics,
  CustomerLTVMetrics,
  AttributionBreakdown,
} from '@/types/purchase-attribution';

/**
 * Empty state for revenue metrics
 */
export function getEmptyRevenueMetrics(): RevenueMetrics {
  return {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    chatAttributedRevenue: 0,
    chatAttributedOrders: 0,
    conversionRate: 0,
    revenueByPlatform: { woocommerce: 0, shopify: 0 },
    revenueByConfidence: { high: 0, medium: 0, low: 0 },
  };
}

/**
 * Empty state for LTV metrics
 */
export function getEmptyLTVMetrics(): CustomerLTVMetrics {
  return {
    totalCustomers: 0,
    returningCustomers: 0,
    returningCustomerRate: 0,
    averageLTV: 0,
    medianLTV: 0,
    topCustomers: [],
  };
}

/**
 * Empty state for attribution breakdown
 */
export function getEmptyAttributionBreakdown(): AttributionBreakdown {
  return {
    byMethod: {
      session_match: { count: 0, revenue: 0, avgConfidence: 0 },
      email_match: { count: 0, revenue: 0, avgConfidence: 0 },
      time_proximity: { count: 0, revenue: 0, avgConfidence: 0 },
      no_match: { count: 0, revenue: 0, avgConfidence: 0 },
    },
    byConfidence: {
      high: { count: 0, revenue: 0, avgConfidence: 0 },
      medium: { count: 0, revenue: 0, avgConfidence: 0 },
      low: { count: 0, revenue: 0, avgConfidence: 0 },
    },
    timeToConversion: {
      avgSeconds: 0,
      medianSeconds: 0,
      distribution: [],
    },
  };
}

/**
 * Round to 2 decimal places
 */
export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Calculate conversion rate percentage
 */
export function calculateConversionRate(
  attributedOrders: number,
  totalConversations: number
): number {
  if (totalConversations === 0) return 0;
  return roundToTwoDecimals((attributedOrders / totalConversations) * 100);
}
