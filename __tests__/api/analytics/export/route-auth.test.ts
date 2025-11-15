/**
 * Analytics Export API - Auth & Security Tests
 *
 * Tests authentication, authorization, rate limiting,
 * and multi-tenant security for analytics export.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/export/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import * as authModule from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit } from '@/lib/middleware/analytics-rate-limit';
import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';
import * as exporters from '@/lib/analytics/export';
import {
  createMockSupabase,
  createRequest,
  mockAnalyticsData,
  mockUserAnalyticsData,
  setupOrganizationMocks
} from './route-test-helpers';

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
jest.mock('@/lib/analytics/export', () => ({
  exportToCSV: jest.fn(() => 'csv,data,here'),
  exportToExcel: jest.fn(async () => Buffer.from('excel-data')),
  exportToPDF: jest.fn(async () => Buffer.from('pdf-data')),
  generateCSVFilename: jest.fn(() => 'analytics_2024-01-01.csv'),
  generateExcelFilename: jest.fn(() => 'analytics_2024-01-01.xlsx'),
  generatePDFFilename: jest.fn(() => 'analytics_2024-01-01.pdf'),
}));

const mockedRequireAuth = authModule.requireAuth as jest.Mock;

describe('Analytics Export - Auth & Security', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;
  let mockServiceSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = createMockSupabase();
    mockServiceSupabase = createMockSupabase();

    mockedRequireAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      supabase: mockSupabase,
    });

    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockServiceSupabase);
    (checkAnalyticsRateLimit as jest.Mock).mockResolvedValue(null);

    mockSupabase.single.mockResolvedValue({
      data: { organization_id: 'org-123', role: 'admin' },
      error: null,
    });

    setupOrganizationMocks(mockSupabase);

    (analyseMessages as jest.Mock).mockReturnValue(mockAnalyticsData());
    (calculateUserAnalytics as jest.Mock).mockReturnValue(mockUserAnalyticsData());
  });

  describe('Authentication and Authorization', () => {
    it('should return 401 if not authenticated', async () => {
      mockedRequireAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if user has no organization', async () => {
      mockSupabase.from.mockImplementation(() => ({
        ...mockSupabase,
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }));

      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('No organization found');
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 if rate limit exceeded', async () => {
      (checkAnalyticsRateLimit as jest.Mock).mockResolvedValue(
        NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
      );

      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
    });

    it('should check rate limit with correct parameters', async () => {
      const request = createRequest({ format: 'csv' });
      await GET(request);

      expect(checkAnalyticsRateLimit).toHaveBeenCalledWith(
        { id: 'user-123', email: 'test@example.com' },
        'export',
        10,
        3600
      );
    });
  });

  describe('Multi-tenant Security', () => {
    it('should only fetch data for organization domains', async () => {
      const selectMock = jest.fn().mockReturnThis();
      const gteMock = jest.fn().mockReturnThis();
      const inMock = jest.fn().mockReturnThis();
      const orderMock = jest.fn().mockResolvedValue({ data: [], error: null });

      mockServiceSupabase.from.mockImplementation((table: string) => ({
        select: selectMock,
        gte: gteMock,
        in: inMock,
        order: orderMock,
      }));

      const request = createRequest({ format: 'csv' });
      await GET(request);

      expect(inMock).toHaveBeenCalledWith('conversations.domain', ['test.com', 'example.com']);
    });

    it('should handle empty organization domains', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'customer_configs') {
          return {
            ...mockSupabase,
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
