/**
 * Analytics Export API - Error Handling Tests
 *
 * Tests error scenarios, data fetching options,
 * and date range calculation for analytics export.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
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

describe('Analytics Export - Error Handling', () => {
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

  describe('Error Handling', () => {
    it('should return 500 if Supabase client creation fails', async () => {
      (createServiceRoleClient as jest.Mock).mockResolvedValue(null);

      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to generate export');
    });

    it('should return 500 on unexpected errors', async () => {
      (exporters.exportToCSV as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const request = createRequest({ format: 'csv' });
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to generate export');
    });

    it('should log errors to console', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      (exporters.exportToCSV as jest.Mock).mockImplementation(() => {
        throw new Error('Test error');
      });

      const request = createRequest({ format: 'csv' });
      await GET(request);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics Export] Error:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Data Fetching Options', () => {
    it('should skip message analytics when includeMessage is false', async () => {
      mockServiceSupabase.from.mockImplementation(() => ({
        ...mockServiceSupabase,
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }));

      const request = createRequest({ format: 'csv', includeMessage: 'false' });
      await GET(request);

      expect(mockServiceSupabase.from).not.toHaveBeenCalledWith('messages');
      expect(analyseMessages).not.toHaveBeenCalled();
    });

    it('should skip user analytics when includeUser is false', async () => {
      const request = createRequest({ format: 'csv', includeUser: 'false' });
      await GET(request);

      expect(calculateUserAnalytics).not.toHaveBeenCalled();
    });
  });

  describe('Date Range Calculation', () => {
    it('should calculate correct date range for export', async () => {
      const request = createRequest({ format: 'csv', days: '7' });
      await GET(request);

      const expectedEndDate = new Date().toISOString().split('T')[0];
      const expectedStartDate = new Date();
      expectedStartDate.setDate(expectedStartDate.getDate() - 7);

      expect(exporters.exportToCSV).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          dateRange: {
            start: expectedStartDate.toISOString().split('T')[0],
            end: expectedEndDate,
          },
        })
      );
    });

    it('should use default 30 days if days parameter not provided', async () => {
      const request = createRequest({ format: 'csv' });
      await GET(request);

      const expectedEndDate = new Date().toISOString().split('T')[0];
      const expectedStartDate = new Date();
      expectedStartDate.setDate(expectedStartDate.getDate() - 30);

      expect(exporters.exportToCSV).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          dateRange: {
            start: expectedStartDate.toISOString().split('T')[0],
            end: expectedEndDate,
          },
        })
      );
    });
  });
});
