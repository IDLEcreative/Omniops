import { GET } from '@/app/api/analytics/intelligence/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { NextRequest } from 'next/server';
import {
  createMockBusinessIntelligence,
  mockJourneyData,
  mockContentGaps,
  mockPeakUsage,
  mockConversionFunnel,
  calculateDaysDiff
} from './intelligence.test-utils';
import * as authModule from '@/lib/middleware/auth';
import { checkAnalyticsRateLimit, addRateLimitHeaders } from '@/lib/middleware/analytics-rate-limit';
import { getSearchCacheManager } from '@/lib/search-cache';

const mockCreateServiceRoleClient = jest.fn();
const mockRequireAdmin = authModule.requireAdmin as jest.Mock;
const mockCheckAnalyticsRateLimit = checkAnalyticsRateLimit as jest.Mock;
const mockAddRateLimitHeaders = addRateLimitHeaders as jest.Mock;
const mockGetSearchCacheManager = getSearchCacheManager as jest.Mock;

jest.mock('@/lib/supabase-server', () => {
  const actual = jest.requireActual('@/lib/supabase-server');
  return {
    ...actual,
    createServiceRoleClient: () => mockCreateServiceRoleClient(),
  };
});
jest.mock('@/lib/analytics/business-intelligence', () => ({
  BusinessIntelligence: {
    getInstance: jest.fn(),
  },
}));
jest.mock('@/lib/logger');
jest.mock('@/lib/middleware/auth');
jest.mock('@/lib/middleware/analytics-rate-limit');
jest.mock('@/lib/search-cache');

describe('GET /api/analytics/intelligence - Metrics', () => {
  let mockSupabase: any;
  let mockUserSupabase: any;
  let mockBI: any;
  let mockCacheManager: any;

  beforeEach(() => {
    // Setup Supabase mocks
    mockSupabase = {};
    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase);

    // Setup user supabase with customer_configs query
    mockUserSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { organization_id: 'org-123', role: 'admin' },
        error: null
      })
    };

    // Mock customer_configs query to return allowed domains
    mockUserSupabase.from.mockImplementation((table: string) => {
      if (table === 'customer_configs') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnValue({
            data: [
              { domain: 'example.com' },
              { domain: 'test.com' }
            ],
            error: null
          })
        };
      }
      return mockUserSupabase;
    });

    // Setup auth mock
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'user-123', email: 'test@example.com' },
      supabase: mockUserSupabase,
      organizationId: 'org-123',
      role: 'admin'
    });

    // Setup rate limiting mock
    mockCheckAnalyticsRateLimit.mockResolvedValue(null);
    mockAddRateLimitHeaders.mockResolvedValue(undefined);

    // Setup cache manager mock
    mockCacheManager = {
      getCachedResult: jest.fn().mockResolvedValue(null),
      cacheResult: jest.fn().mockResolvedValue(undefined)
    };
    mockGetSearchCacheManager.mockReturnValue(mockCacheManager);

    // Setup Business Intelligence mock
    mockBI = createMockBusinessIntelligence();
    (BusinessIntelligence.getInstance as jest.Mock).mockReturnValue(mockBI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Metric Queries', () => {
    it('should return all metrics when metric=all', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue(mockJourneyData);
      mockBI.analyzeContentGaps.mockResolvedValue(mockContentGaps);
      mockBI.analyzePeakUsage.mockResolvedValue(mockPeakUsage);
      mockBI.analyzeConversionFunnel.mockResolvedValue(mockConversionFunnel);

      const request = new NextRequest('http://localhost/api/analytics/intelligence?metric=all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customerJourney).toEqual(mockJourneyData);
      expect(data.contentGaps).toEqual(mockContentGaps);
      expect(data.peakUsage).toEqual(mockPeakUsage);
      expect(data.conversionFunnel).toEqual(mockConversionFunnel);
      expect(data.summary).toBeDefined();
    });

    it('should return only journey metrics when metric=journey', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue(mockJourneyData);

      const request = new NextRequest('http://localhost/api/analytics/intelligence?metric=journey');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customerJourney).toEqual(mockJourneyData);
      expect(data.contentGaps).toBeUndefined();
      expect(data.peakUsage).toBeUndefined();
      expect(mockBI.analyzeCustomerJourney).toHaveBeenCalled();
      expect(mockBI.analyzeContentGaps).not.toHaveBeenCalled();
    });

    it('should filter by domain parameter', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        commonPaths: [],
        dropOffPoints: []
      });

      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=journey&domain=example.com'
      );
      await GET(request);

      expect(mockBI.analyzeCustomerJourney).toHaveBeenCalledWith(
        'example.com',
        expect.any(Object)
      );
    });

    it('should use custom date range when provided', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        commonPaths: [],
        dropOffPoints: []
      });

      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      const request = new NextRequest(
        `http://localhost/api/analytics/intelligence?metric=journey&startDate=${startDate}&endDate=${endDate}`
      );
      await GET(request);

      expect(mockBI.analyzeCustomerJourney).toHaveBeenCalledWith(
        'all',
        {
          start: new Date(startDate),
          end: new Date(endDate)
        }
      );
    });

    it('should use default 7 days when no date range provided', async () => {
      mockBI.analyzePeakUsage.mockResolvedValue({
        hourlyDistribution: [],
        busiestDays: [],
        peakHours: []
      });

      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=peak-usage'
      );
      await GET(request);

      const callArgs = mockBI.analyzePeakUsage.mock.calls[0];
      const timeRange = callArgs[1];
      const daysDiff = calculateDaysDiff(timeRange.start, timeRange.end);

      expect(daysDiff).toBe(7);
    });
  });

  describe('Query Parameter Validation', () => {
    it('should parse days parameter as integer', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        commonPaths: [],
        dropOffPoints: []
      });

      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=journey&days=14'
      );
      await GET(request);

      const callArgs = mockBI.analyzeCustomerJourney.mock.calls[0];
      const timeRange = callArgs[1];
      const daysDiff = calculateDaysDiff(timeRange.start, timeRange.end);

      expect(daysDiff).toBe(14);
    });

    it('should prioritize date range over days parameter', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        commonPaths: [],
        dropOffPoints: []
      });

      const startDate = '2024-01-01';
      const endDate = '2024-01-10';
      const request = new NextRequest(
        `http://localhost/api/analytics/intelligence?metric=journey&startDate=${startDate}&endDate=${endDate}&days=30`
      );
      await GET(request);

      const callArgs = mockBI.analyzeCustomerJourney.mock.calls[0];
      const timeRange = callArgs[1];

      expect(timeRange.start.toISOString().split('T')[0]).toBe(startDate);
      expect(timeRange.end.toISOString().split('T')[0]).toBe(endDate);
    });

    it('should handle invalid metric parameter gracefully', async () => {
      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=invalid'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch analytics');
    });

    it('should handle invalid date formats', async () => {
      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=journey&startDate=invalid-date'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch analytics');
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when BusinessIntelligence throws error', async () => {
      mockBI.analyzeCustomerJourney.mockRejectedValueOnce(new Error('Analysis failed'));

      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=journey'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch analytics');
    });
  });
});
