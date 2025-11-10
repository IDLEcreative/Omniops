/**
 * User Analytics Calculation Tests
 * Tests metric calculations from session metadata
 */

import {
  calculatePageMetrics,
  calculateSessionDuration,
  detectShoppingFunnelProgression,
  calculateNewVsReturningUsers,
} from '__tests__/utils/metadata';
import { createSessionMetadata, createPageViews, createPageView } from '__tests__/utils/metadata';

describe('User Analytics Calculation', () => {
  it('should calculate user metrics from session metadata', () => {
    const pageViews = [
      createPageView({ url: 'https://example.com/', duration_seconds: 30 }),
      createPageView({ url: 'https://example.com/products/item', duration_seconds: 45 }),
      createPageView({ url: 'https://example.com/cart', duration_seconds: 20 }),
    ];

    const { totalPageViews, productPageViews, cartPageViews } = calculatePageMetrics(pageViews);

    expect(totalPageViews).toBe(3);
    expect(productPageViews).toBe(1);
    expect(cartPageViews).toBe(1);
  });

  it('should calculate session duration metrics', () => {
    const sessionStart = new Date(Date.now() - 120000);
    const sessionEnd = new Date();
    const durationSeconds = calculateSessionDuration(sessionStart, sessionEnd);

    expect(durationSeconds).toBeGreaterThan(100);
    expect(durationSeconds).toBeLessThan(130);
  });

  it('should detect shopping funnel progression', () => {
    const pageViews = [
      createPageView({ url: 'https://example.com/' }),
      createPageView({ url: 'https://example.com/products/widget' }),
      createPageView({ url: 'https://example.com/cart' }),
      createPageView({ url: 'https://example.com/checkout' }),
    ];

    const funnel = detectShoppingFunnelProgression(pageViews);

    expect(funnel.hasBrowsed).toBe(true);
    expect(funnel.hasViewedProduct).toBe(true);
    expect(funnel.hasViewedCart).toBe(true);
    expect(funnel.hasViewedCheckout).toBe(true);
  });

  it('should calculate new vs returning users', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const sessions = [
      { session_id: 'session-1', created_at: `${today}T10:00:00Z` },
      { session_id: 'session-2', created_at: `${today}T14:00:00Z` },
      { session_id: 'session-1', created_at: `${yesterday}T10:00:00Z` },
    ];

    const result = calculateNewVsReturningUsers(sessions);

    expect(result.todayUniqueUsers).toBe(2);
    expect(result.newUsersToday).toBe(1);
    expect(result.returningToday).toBe(1);
  });
});
