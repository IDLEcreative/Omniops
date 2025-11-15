/**
 * Shared Test Helpers for Analytics Export API
 *
 * Common mock setup and utilities for testing analytics export.
 */

import { jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Helper to create mock Supabase client
export const createMockSupabase = () => {
  const fromMock = jest.fn();
  const selectMock = jest.fn().mockReturnThis();
  const eqMock = jest.fn().mockReturnThis();
  const inMock = jest.fn().mockReturnThis();
  const gteMock = jest.fn().mockReturnThis();
  const orderMock = jest.fn().mockReturnThis();
  const singleMock = jest.fn().mockResolvedValue({ data: null, error: null });

  fromMock.mockImplementation((table: string) => ({
    select: selectMock,
    eq: eqMock,
    in: inMock,
    gte: gteMock,
    order: orderMock,
    single: singleMock,
  }));

  return {
    from: fromMock,
    select: selectMock,
    eq: eqMock,
    in: inMock,
    gte: gteMock,
    order: orderMock,
    single: singleMock,
  };
};

// Helper to create request
export const createRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/analytics/export');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url);
};

// Mock analytics data
export const mockAnalyticsData = () => ({
  totalMessages: 100,
  userMessages: 60,
  avgResponseTimeSeconds: 2.5,
  satisfactionScore: 85,
  resolutionRate: 0.75,
  positiveMessages: 70,
  negativeMessages: 10,
  avgMessagesPerDay: 14.3,
  topQueries: [],
  languageDistribution: [],
});

// Mock user analytics data
export const mockUserAnalyticsData = () => ({
  total_unique_users: 500,
  avg_daily_users: 71.4,
  growth: { growth_rate: 0.15, growth_absolute: 65 },
  session_stats: {
    total_sessions: 1200,
    avg_duration_seconds: 180,
    median_duration_seconds: 150,
    bounce_rate: 0.35,
  },
  page_view_stats: {
    total_views: 5000,
    unique_pages: 50,
    avg_views_per_session: 4.2,
  },
  shopping_behavior: {
    product_page_views: 800,
    unique_products_viewed: 120,
    cart_page_views: 200,
    checkout_page_views: 100,
    conversion_rate: 0.08,
    avg_products_per_session: 2.5,
  },
  daily_metrics: [],
});

// Setup default organization mocks
export const setupOrganizationMocks = (mockSupabase: any) => {
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'organization_members') {
      return {
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: { organization_id: 'org-123', role: 'admin' },
          error: null,
        }),
      };
    }
    if (table === 'organizations') {
      return {
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({
          data: { name: 'Test Organization' },
          error: null,
        }),
      };
    }
    if (table === 'customer_configs') {
      return {
        ...mockSupabase,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: [{ domain: 'test.com' }, { domain: 'example.com' }],
          error: null,
        }),
      };
    }
    return mockSupabase;
  });
};
