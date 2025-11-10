/**
 * Analytics API Response Tests
 * Tests complete analytics API response structure
 */

import { createAnalyticsResponse } from '__tests__/utils/metadata';

describe('Analytics API Response', () => {
  it('should return complete user analytics data', () => {
    const analyticsResponse = createAnalyticsResponse();

    expect(analyticsResponse.userMetrics).toBeDefined();
    expect(analyticsResponse.sessionMetrics).toBeDefined();
    expect(analyticsResponse.pageViews).toBeDefined();
    expect(analyticsResponse.shoppingBehavior).toBeDefined();
    expect(analyticsResponse.dailyUsers).toBeDefined();
  });

  it('should have valid user metrics', () => {
    const analyticsResponse = createAnalyticsResponse();

    expect(analyticsResponse.userMetrics.dailyActiveUsers).toBeGreaterThan(0);
    expect(analyticsResponse.userMetrics.totalUniqueUsers).toBeGreaterThan(0);
    expect(analyticsResponse.userMetrics.growthRate).toBeGreaterThan(0);
  });

  it('should have valid session metrics', () => {
    const analyticsResponse = createAnalyticsResponse();

    expect(analyticsResponse.sessionMetrics.avgDuration).toBeGreaterThan(0);
    expect(analyticsResponse.sessionMetrics.totalSessions).toBeGreaterThan(0);
    expect(analyticsResponse.sessionMetrics.bounceRate).toBeGreaterThanOrEqual(0);
  });

  it('should have valid page view metrics', () => {
    const analyticsResponse = createAnalyticsResponse();

    expect(analyticsResponse.pageViews.total).toBeGreaterThan(0);
    expect(analyticsResponse.pageViews.uniquePages).toBeGreaterThan(0);
    expect(analyticsResponse.pageViews.topPages.length).toBeGreaterThan(0);
  });

  it('should have valid shopping behavior metrics', () => {
    const analyticsResponse = createAnalyticsResponse();
    const shopping = analyticsResponse.shoppingBehavior;

    expect(shopping.conversionRate).toBeGreaterThan(0);
    expect(shopping.conversionRate).toBeLessThanOrEqual(100);
    expect(shopping.productViews).toBeGreaterThanOrEqual(0);
    expect(shopping.cartViews).toBeGreaterThanOrEqual(0);
  });
});
