import { GET } from '@/app/api/analytics/intelligence/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { NextRequest } from 'next/server';

jest.mock('@/lib/supabase-server');
jest.mock('@/lib/analytics/business-intelligence');
jest.mock('@/lib/logger');

describe('GET /api/analytics/intelligence', () => {
  let mockSupabase: any;
  let mockBI: jest.Mocked<BusinessIntelligence>;

  beforeEach(() => {
    mockSupabase = {};
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);

    mockBI = {
      analyzeCustomerJourney: jest.fn(),
      analyzeContentGaps: jest.fn(),
      analyzePeakUsage: jest.fn(),
      analyzeConversionFunnel: jest.fn(),
    } as any;

    (BusinessIntelligence as jest.Mock).mockImplementation(() => mockBI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful Requests', () => {
    it('should return all metrics when metric=all', async () => {
      const mockJourneyData = {
        conversionRate: 0.25,
        avgSessionsBeforeConversion: 3,
        commonPaths: [],
        dropOffPoints: []
      };

      const mockContentGaps = [
        { query: 'return policy', frequency: 10, avgConfidence: 0.3 }
      ];

      const mockPeakUsage = {
        hourlyDistribution: Array(24).fill(null).map((_, i) => ({
          hour: i,
          avgRequests: Math.random() * 100
        })),
        busiestDays: [],
        peakHours: [14, 15]
      };

      const mockFunnel = {
        stages: [
          { name: 'Visit', count: 100 },
          { name: 'Browse', count: 80 },
          { name: 'Add to Cart', count: 30 },
          { name: 'Checkout', count: 10 }
        ],
        overallConversionRate: 0.1
      };

      mockBI.analyzeCustomerJourney.mockResolvedValue(mockJourneyData);
      mockBI.analyzeContentGaps.mockResolvedValue(mockContentGaps);
      mockBI.analyzePeakUsage.mockResolvedValue(mockPeakUsage);
      mockBI.analyzeConversionFunnel.mockResolvedValue(mockFunnel);

      const request = new NextRequest('http://localhost/api/analytics/intelligence?metric=all');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customerJourney).toEqual(mockJourneyData);
      expect(data.contentGaps).toEqual(mockContentGaps);
      expect(data.peakUsage).toEqual(mockPeakUsage);
      expect(data.conversionFunnel).toEqual(mockFunnel);
      expect(data.summary).toBeDefined();
    });

    it('should return only journey metrics when metric=journey', async () => {
      const mockJourneyData = {
        conversionRate: 0.25,
        avgSessionsBeforeConversion: 3,
        commonPaths: [],
        dropOffPoints: []
      };

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
      const daysDiff = Math.round(
        (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysDiff).toBe(7);
    });
  });

  describe('Summary Insights Generation', () => {
    it('should generate warning for low conversion rate', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0.15, // Below 20% threshold
        avgSessionsBeforeConversion: 2,
        commonPaths: [],
        dropOffPoints: []
      });

      mockBI.analyzeContentGaps.mockResolvedValue([]);
      mockBI.analyzePeakUsage.mockResolvedValue({
        hourlyDistribution: [],
        busiestDays: [],
        peakHours: []
      });
      mockBI.analyzeConversionFunnel.mockResolvedValue({
        stages: [],
        overallConversionRate: 0.15
      });

      const request = new NextRequest('http://localhost/api/analytics/intelligence?metric=all');
      const response = await GET(request);
      const data = await response.json();

      expect(data.summary.insights).toContainEqual(
        expect.objectContaining({
          type: 'warning',
          metric: 'conversion',
          priority: 'high'
        })
      );
    });

    it('should identify critical content gaps', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0.5,
        avgSessionsBeforeConversion: 2,
        commonPaths: [],
        dropOffPoints: []
      });

      mockBI.analyzeContentGaps.mockResolvedValue([
        { query: 'critical question', frequency: 15, avgConfidence: 0.2 },
        { query: 'another gap', frequency: 12, avgConfidence: 0.3 }
      ]);

      mockBI.analyzePeakUsage.mockResolvedValue({
        hourlyDistribution: [],
        busiestDays: [],
        peakHours: []
      });

      mockBI.analyzeConversionFunnel.mockResolvedValue({
        stages: [],
        overallConversionRate: 0.5
      });

      const request = new NextRequest('http://localhost/api/analytics/intelligence?metric=all');
      const response = await GET(request);
      const data = await response.json();

      const contentInsight = data.summary.insights.find(
        (i: any) => i.metric === 'content'
      );
      expect(contentInsight).toBeDefined();
      expect(contentInsight.priority).toBe('high');
      expect(contentInsight.details).toHaveLength(2);
    });

    it('should identify funnel bottlenecks', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0.5,
        avgSessionsBeforeConversion: 2,
        commonPaths: [],
        dropOffPoints: []
      });

      mockBI.analyzeContentGaps.mockResolvedValue([]);
      mockBI.analyzePeakUsage.mockResolvedValue({
        hourlyDistribution: [],
        busiestDays: [],
        peakHours: []
      });

      mockBI.analyzeConversionFunnel.mockResolvedValue({
        stages: [
          { name: 'Visit', count: 100 },
          { name: 'Browse', count: 90 },
          { name: 'Add to Cart', count: 30 }, // 67% drop
          { name: 'Checkout', count: 25 }
        ],
        overallConversionRate: 0.25
      });

      const request = new NextRequest('http://localhost/api/analytics/intelligence?metric=all');
      const response = await GET(request);
      const data = await response.json();

      const funnelInsight = data.summary.insights.find(
        (i: any) => i.metric === 'funnel'
      );
      expect(funnelInsight).toBeDefined();
      expect(funnelInsight.priority).toBe('critical');
      expect(funnelInsight.message).toContain('Add to Cart');
    });
  });

  describe('Error Handling', () => {
    it('should return 503 when database connection fails', async () => {
      (createServiceRoleClient as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/analytics/intelligence');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database connection failed');
    });

    it('should return 500 when BusinessIntelligence throws error', async () => {
      mockBI.analyzeCustomerJourney.mockRejectedValue(new Error('Analysis failed'));

      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=journey'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch analytics');
    });

    it('should handle invalid metric parameter gracefully', async () => {
      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=invalid'
      );
      const response = await GET(request);

      // Should default to valid behavior or return error
      expect(response.status).toBeLessThan(500);
    });

    it('should handle invalid date formats', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0,
        avgSessionsBeforeConversion: 0,
        commonPaths: [],
        dropOffPoints: []
      });

      const request = new NextRequest(
        'http://localhost/api/analytics/intelligence?metric=journey&startDate=invalid-date'
      );
      const response = await GET(request);

      // Should handle gracefully, using default dates
      expect(response.status).toBe(200);
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
      const daysDiff = Math.round(
        (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
      );

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
  });
});