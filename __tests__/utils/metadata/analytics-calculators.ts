/**
 * Analytics Calculators for Metadata Tests
 * Provides calculation functions for metrics and funnel analysis
 */

import { PageView } from '@/types/analytics';

export interface UserMetrics {
  dailyActiveUsers: number;
  totalUniqueUsers: number;
  growthRate: number;
  growthAbsolute: number;
}

export interface SessionMetrics {
  avgDuration: number;
  medianDuration: number;
  totalSessions: number;
  bounceRate: number;
}

export interface ShoppingBehavior {
  productViews: number;
  uniqueProducts: number;
  cartViews: number;
  checkoutViews: number;
  conversionRate: number;
  avgProductsPerSession: number;
}

export function calculatePageMetrics(pageViews: PageView[]) {
  const totalPageViews = pageViews.length;
  const productPageViews = pageViews.filter(
    (p) => p.url.includes('/products/') || p.url.includes('/p/')
  ).length;
  const cartPageViews = pageViews.filter(
    (p) => p.url.includes('/cart') || p.url.includes('/basket')
  ).length;

  return { totalPageViews, productPageViews, cartPageViews };
}

export function calculateSessionDuration(startTime: Date, endTime: Date): number {
  return Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
}

export function detectShoppingFunnelProgression(pageViews: PageView[]) {
  return {
    hasBrowsed: pageViews.length > 0,
    hasViewedProduct: pageViews.some(
      (p) => p.url.includes('/product') || p.url.includes('/p/')
    ),
    hasViewedCart: pageViews.some((p) => p.url.includes('/cart')),
    hasViewedCheckout: pageViews.some((p) => p.url.includes('/checkout')),
  };
}

export function calculateNewVsReturningUsers(sessions: Array<{ session_id: string; created_at: string }>) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const todaySessions = sessions.filter((s) => s.created_at.startsWith(today));
  const yesterdaySessions = sessions.filter((s) => s.created_at.startsWith(yesterday));

  const todayUniqueUsers = new Set(todaySessions.map((s) => s.session_id)).size;
  const yesterdayUniqueUsers = new Set(yesterdaySessions.map((s) => s.session_id)).size;

  const returningToday = todaySessions.filter((s) =>
    yesterdaySessions.some((ys) => ys.session_id === s.session_id)
  ).length;

  const newUsersToday = todayUniqueUsers - returningToday;

  return {
    todayUniqueUsers,
    yesterdayUniqueUsers,
    returningToday,
    newUsersToday,
  };
}

export function createAnalyticsResponse() {
  return {
    userMetrics: {
      dailyActiveUsers: 25,
      totalUniqueUsers: 150,
      growthRate: 15.5,
      growthAbsolute: 4,
    },
    sessionMetrics: {
      avgDuration: 95,
      medianDuration: 78,
      totalSessions: 32,
      bounceRate: 12.5,
    },
    pageViews: {
      total: 245,
      uniquePages: 45,
      avgPerSession: 7.7,
      topPages: [
        { url: '/products/widget', views: 45 },
        { url: '/cart', views: 28 },
        { url: '/checkout', views: 18 },
      ],
    },
    shoppingBehavior: {
      productViews: 87,
      uniqueProducts: 23,
      cartViews: 28,
      checkoutViews: 18,
      conversionRate: 64.3,
      avgProductsPerSession: 2.7,
    },
    dailyUsers: [
      {
        date: '2025-11-09',
        users: 25,
        newUsers: 4,
        returningUsers: 21,
        sessions: 32,
        avgSessionDuration: 95,
        pageViews: 245,
      },
    ],
  };
}
