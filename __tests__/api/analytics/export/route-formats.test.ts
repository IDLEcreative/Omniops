import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/export/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import * as authModule from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit } from '@/lib/middleware/analytics-rate-limit';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/middleware/analytics-rate-limit');
jest.mock('@/lib/dashboard/analytics', () => ({
  analyseMessages: jest.fn(),
}));
jest.mock('@/lib/dashboard/analytics/user-analytics', () => ({
  calculateUserAnalytics: jest.fn(),
}));

// Mock the entire export module
jest.mock('@/lib/analytics/export', () => ({
  exportToCSV: jest.fn(() => 'csv,data,here'),
  exportToExcel: jest.fn(async () => Buffer.from('excel-data')),
  exportToPDF: jest.fn(async () => Buffer.from('pdf-data')),
  generateCSVFilename: jest.fn(() => 'analytics_2024-01-01.csv'),
  generateExcelFilename: jest.fn(() => 'analytics_2024-01-01.xlsx'),
  generatePDFFilename: jest.fn(() => 'analytics_2024-01-01.pdf'),
}));

import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';
import * as exporters from '@/lib/analytics/export';

const mockedRequireAuth = authModule.requireAuth as jest.Mock;

// Helper to create mock Supabase client
const createMockSupabase = () => {
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
const createRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/analytics/export');
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url);
};

describe('GET /api/analytics/export', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockServiceSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    mockSupabase = createMockSupabase();
    mockServiceSupabase = createMockSupabase();

    mockedRequireAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      supabase: mockSupabase,
    });

    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockServiceSupabase);
    (checkAnalyticsRateLimit as jest.Mock).mockResolvedValue(null);

    // Default organization membership
    mockSupabase.single.mockResolvedValue({
      data: { organization_id: 'org-123', role: 'admin' },
      error: null,
    });

    // Default organization details
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

    // Mock analytics data
    (analyseMessages as jest.Mock).mockReturnValue({
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

    (calculateUserAnalytics as jest.Mock).mockReturnValue({
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
  });

  // Authentication & rate limit coverage lives in route.test.ts to keep files under LOC limits.

  describe('Format Validation', () => {
    it('should return 400 for missing format', async () => {
      const request = createRequest();
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid format. Must be csv, excel, or pdf');
    });

    it('should return 400 for invalid format', async () => {
      const request = createRequest({ format: 'txt' });
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Invalid format. Must be csv, excel, or pdf');
    });
  });

  describe('CSV Export', () => {
    it('should export data as CSV successfully', async () => {
      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="analytics_2024-01-01.csv"');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');

      const text = await response.text();
      expect(text).toBe('csv,data,here');
      expect(exporters.exportToCSV).toHaveBeenCalled();
    });

    it('should pass correct options to CSV exporter', async () => {
      const request = createRequest({
        format: 'csv',
        days: '30',
        includeMessage: 'false',
        includeUser: 'true',
        includeTopQueries: 'false',
      });

      await GET(request);

      expect(exporters.exportToCSV).toHaveBeenCalledWith(
        null, // messageAnalytics is null when includeMessage is false
        expect.objectContaining({
          total_unique_users: 500,
        }),
        expect.objectContaining({
          includeMessageAnalytics: false,
          includeUserAnalytics: true,
          includeTopQueries: false,
        })
      );
    });
  });

  describe('Excel Export', () => {
    it('should export data as Excel successfully', async () => {
      const request = createRequest({ format: 'excel' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="analytics_2024-01-01.xlsx"');

      const buffer = await response.arrayBuffer();
      expect(Buffer.from(buffer).toString()).toBe('excel-data');
      expect(exporters.exportToExcel).toHaveBeenCalled();
    });
  });

  describe('PDF Export', () => {
    it('should export data as PDF successfully', async () => {
      const request = createRequest({ format: 'pdf' });
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      expect(response.headers.get('Content-Disposition')).toBe('attachment; filename="analytics_2024-01-01.pdf"');

      const buffer = await response.arrayBuffer();
      expect(Buffer.from(buffer).toString()).toBe('pdf-data');
      expect(exporters.exportToPDF).toHaveBeenCalled();
    });

    it('should include organization name in PDF export', async () => {
      const request = createRequest({ format: 'pdf' });
      await GET(request);

      expect(exporters.exportToPDF).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          organizationName: 'Test Organization',
        })
      );
    });
  });
});
