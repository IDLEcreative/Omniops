import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/analytics/export/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import * as authModule from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit } from '@/lib/middleware/analytics-rate-limit';
import { analyseMessages } from '@/lib/dashboard/analytics';
import { calculateUserAnalytics } from '@/lib/dashboard/analytics/user-analytics';
import * as exporters from '@/lib/analytics/export';

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
  exportToCSV: jest.fn(() => 'csv-data'),
  exportToExcel: jest.fn(async () => Buffer.from('excel')),
  exportToPDF: jest.fn(async () => Buffer.from('pdf')),
  generateCSVFilename: jest.fn(() => 'analytics.csv'),
}));

const mockedRequireAuth = authModule.requireAuth as jest.Mock;

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

  return { from: fromMock, select: selectMock, eq: eqMock, in: inMock, gte: gteMock, order: orderMock, single: singleMock };
};

const createRequest = (params: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/analytics/export');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  return new NextRequest(url);
};

describe('GET /api/analytics/export — options & errors', () => {
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

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'customer_configs') {
        return {
          ...mockSupabase,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [{ domain: 'test.com' }],
            error: null,
          }),
        };
      }
      return mockSupabase;
    });
  });

  describe('Query Parameters', () => {
    it('uses defaults when parameters missing', async () => {
      const request = createRequest({ format: 'csv' });
      await GET(request);

      expect(analyseMessages).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ days: 7 }));
    });

    it('respects custom day window', async () => {
      const request = createRequest({ format: 'csv', days: '30' });
      await GET(request);

      expect(analyseMessages).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ days: 30 }));
      expect(calculateUserAnalytics).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ days: 30 }));
    });

    it('skips message analytics when disabled', async () => {
      const request = createRequest({ format: 'csv', includeMessage: 'false' });
      await GET(request);
      expect(analyseMessages).not.toHaveBeenCalled();
    });

    it('skips user analytics when disabled', async () => {
      const request = createRequest({ format: 'csv', includeUser: 'false' });
      await GET(request);
      expect(calculateUserAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Multi-tenant Guardrails', () => {
    it('filters queries to organization domains', async () => {
      const inMock = jest.fn().mockReturnThis();
      mockServiceSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        in: inMock,
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      await GET(createRequest({ format: 'csv' }));
      expect(inMock).toHaveBeenCalledWith('conversations.domain', ['test.com']);
    });
  });

  describe('Error Handling', () => {
    it('returns 500 when service client missing', async () => {
      (createServiceRoleClient as jest.Mock).mockResolvedValue(null);
      const response = await GET(createRequest({ format: 'csv' }));
      expect(response.status).toBe(500);
    });

    it('returns 500 on exporter failure', async () => {
      (exporters.exportToCSV as jest.Mock).mockImplementation(() => {
        throw new Error('Export failed');
      });

      const response = await GET(createRequest({ format: 'csv' }));
      expect(response.status).toBe(500);
    });
  });

  describe('Date Range Calculation', () => {
    it('passes formatted date range to exporter', async () => {
      await GET(createRequest({ format: 'csv', days: '10' }));

      expect(exporters.exportToCSV).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          dateRange: expect.objectContaining({
            start: expect.any(String),
            end: expect.any(String),
          }),
        })
      );
    });
  });
});
