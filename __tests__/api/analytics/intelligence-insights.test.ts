import { GET } from '@/app/api/analytics/intelligence/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { NextRequest } from 'next/server';
import { createMockBusinessIntelligence } from './intelligence.test-utils';

const mockCreateServiceRoleClient = jest.fn();

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: (...args: any[]) => mockCreateServiceRoleClient(...args),
}));
jest.mock('@/lib/analytics/business-intelligence', () => ({
  BusinessIntelligence: {
    getInstance: jest.fn(),
  },
}));
jest.mock('@/lib/logger');

describe('GET /api/analytics/intelligence - Insights', () => {
  let mockSupabase: any;
  let mockBI: any;

  beforeEach(() => {
    mockSupabase = {};
    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase);
    mockBI = createMockBusinessIntelligence();
    (BusinessIntelligence.getInstance as jest.Mock).mockReturnValue(mockBI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Summary Insights Generation', () => {
    it('should generate warning for low conversion rate', async () => {
      mockBI.analyzeCustomerJourney.mockResolvedValue({
        conversionRate: 0.15,
        avgSessionsBeforeConversion: 2,
        commonPaths: [],
        dropOffPoints: []
      });

      mockBI.analyzeContentGaps.mockResolvedValue({ unansweredQueries: [] });
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

      mockBI.analyzeContentGaps.mockResolvedValue({
        unansweredQueries: [
          { query: 'critical question', frequency: 15, avgConfidence: 0.2 },
          { query: 'another gap', frequency: 12, avgConfidence: 0.3 }
        ]
      });

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

      mockBI.analyzeContentGaps.mockResolvedValue({ unansweredQueries: [] });
      mockBI.analyzePeakUsage.mockResolvedValue({
        hourlyDistribution: [],
        busiestDays: [],
        peakHours: []
      });

      mockBI.analyzeConversionFunnel.mockResolvedValue({
        stages: [
          { name: 'initial_contact', completedCount: 100 },
          { name: 'product_inquiry', completedCount: 90 },
          { name: 'price_check', completedCount: 30 },
          { name: 'order_lookup', completedCount: 25 }
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
      expect(funnelInsight.message).toContain('price_check');
    });
  });
});
