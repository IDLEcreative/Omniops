/**
 * Analytics E2E Test Helpers
 *
 * Reusable utilities for analytics dashboard testing
 */

import { Page } from '@playwright/test';

export interface AnalyticsData {
  userMetrics: {
    dailyActiveUsers: number;
    totalUniqueUsers: number;
    growthRate: number;
    growthAbsolute: number;
  };
  sessionMetrics: {
    avgDuration: number;
    medianDuration: number;
    totalSessions: number;
    bounceRate: number;
  };
  shoppingBehavior: {
    productViews: number;
    uniqueProducts: number;
    cartViews: number;
    checkoutViews: number;
    conversionRate: number;
    avgProductsPerSession: number;
  };
  pageViews: {
    total: number;
    uniquePages: number;
    avgPerSession: number;
    topPages: Array<{ url: string; views: number }>;
  };
  dailyUsers: Array<{ date: string; users: number }>;
}

/**
 * Mock analytics API with default data
 */
export async function mockAnalyticsAPI(page: Page, customData?: Partial<AnalyticsData>) {
  const defaultData: AnalyticsData = {
    userMetrics: {
      dailyActiveUsers: 5,
      totalUniqueUsers: 10,
      growthRate: 15,
      growthAbsolute: 2
    },
    sessionMetrics: {
      avgDuration: 180,
      medianDuration: 150,
      totalSessions: 25,
      bounceRate: 20
    },
    shoppingBehavior: {
      productViews: 15,
      uniqueProducts: 5,
      cartViews: 3,
      checkoutViews: 2,
      conversionRate: 8.5,
      avgProductsPerSession: 1.5
    },
    pageViews: {
      total: 100,
      uniquePages: 20,
      avgPerSession: 4,
      topPages: []
    },
    dailyUsers: []
  };

  const data = { ...defaultData, ...customData };

  await page.route('**/api/dashboard/analytics**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data)
    });
  });
}
