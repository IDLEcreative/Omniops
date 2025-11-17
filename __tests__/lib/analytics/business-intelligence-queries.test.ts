import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createMockSupabase, mockSupabaseQuery, TEST_TIME_RANGE } from './test-utils';


describe('BusinessIntelligence - Queries', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let bi: BusinessIntelligence;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    bi = new BusinessIntelligence(mockSupabase as any);
  });

  describe('analyzeContentGaps', () => {
    it('should identify frequently unanswered queries', async () => {
      const mockMessages = [
        { content: 'return policy?', metadata: { confidence: 0.2 }, created_at: '2024-01-01T10:00:00Z' },
        { content: 'return policy?', metadata: { confidence: 0.3 }, created_at: '2024-01-01T11:00:00Z' },
        { content: 'shipping cost?', metadata: { confidence: 0.8 }, created_at: '2024-01-01T12:00:00Z' },
        { content: 'warranty info?', metadata: { confidence: 0.1 }, created_at: '2024-01-01T13:00:00Z' },
      ];

      mockSupabaseQuery(mockSupabase, mockMessages);

      const result = await bi.analyzeContentGaps('test-domain', TEST_TIME_RANGE);

      expect(result.unansweredQueries).toBeInstanceOf(Array);
      expect(result.unansweredQueries[0].query).toBe('return policy?');
      expect(result.unansweredQueries[0].frequency).toBe(2);
      expect(result.unansweredQueries[0].avgConfidence).toBeCloseTo(0.25, 2);
    });

    it('should filter by confidence threshold', async () => {
      const mockMessages = [
        { content: 'high confidence query', metadata: { confidence: 0.9 }, created_at: '2024-01-01T10:00:00Z' },
        { content: 'low confidence query', metadata: { confidence: 0.2 }, created_at: '2024-01-01T11:00:00Z' },
        { content: 'low confidence query', metadata: { confidence: 0.3 }, created_at: '2024-01-01T12:00:00Z' },
      ];

      mockSupabaseQuery(mockSupabase, mockMessages);

      const result = await bi.analyzeContentGaps('test-domain', TEST_TIME_RANGE);

      const lowConfidenceQuery = result.unansweredQueries.find((gap: any) => gap.query === 'low confidence query');
      expect(lowConfidenceQuery).toBeDefined();
      expect(lowConfidenceQuery?.frequency).toBe(2);
    });

    it('should sort by frequency', async () => {
      const mockMessages = [
        { content: 'query a', metadata: { confidence: 0.2 }, created_at: '2024-01-01T10:00:00Z' },
        { content: 'query b', metadata: { confidence: 0.2 }, created_at: '2024-01-01T11:00:00Z' },
        { content: 'query b', metadata: { confidence: 0.2 }, created_at: '2024-01-01T12:00:00Z' },
        { content: 'query b', metadata: { confidence: 0.2 }, created_at: '2024-01-01T13:00:00Z' },
        { content: 'query c', metadata: { confidence: 0.2 }, created_at: '2024-01-01T14:00:00Z' },
        { content: 'query c', metadata: { confidence: 0.2 }, created_at: '2024-01-01T15:00:00Z' },
      ];

      mockSupabaseQuery(mockSupabase, mockMessages);

      const result = await bi.analyzeContentGaps('test-domain', TEST_TIME_RANGE);

      expect(result.unansweredQueries[0].query).toBe('query b');
      expect(result.unansweredQueries[0].frequency).toBe(3);
      expect(result.unansweredQueries[1].query).toBe('query c');
      expect(result.unansweredQueries[1].frequency).toBe(2);
    });
  });

  describe('analyzePeakUsage', () => {
    it('should calculate hourly distribution', async () => {
      const mockMessages = [
        { created_at: '2024-01-01T09:00:00Z', metadata: {} },
        { created_at: '2024-01-01T09:30:00Z', metadata: {} },
        { created_at: '2024-01-01T14:00:00Z', metadata: {} },
        { created_at: '2024-01-01T14:15:00Z', metadata: {} },
        { created_at: '2024-01-01T14:30:00Z', metadata: {} },
        { created_at: '2024-01-02T09:00:00Z', metadata: {} },
      ];

      mockSupabaseQuery(mockSupabase, mockMessages);

      const result = await bi.analyzePeakUsage('test-domain', TEST_TIME_RANGE);

      expect(result.hourlyDistribution).toHaveLength(24);

      const hour9 = result.hourlyDistribution.find((h: any) => h.hour === 9);
      const hour14 = result.hourlyDistribution.find((h: any) => h.hour === 14);

      expect(hour9?.avgMessages).toBeGreaterThan(0);
      expect(hour14?.avgMessages).toBeGreaterThan(0);
    });

    it('should identify busiest days', async () => {
      const mockMessages = [
        { created_at: '2024-01-01T09:00:00Z', metadata: {} }, // Monday (day 1)
        { created_at: '2024-01-01T10:00:00Z', metadata: {} },
        { created_at: '2024-01-01T11:00:00Z', metadata: {} },
        { created_at: '2024-01-02T09:00:00Z', metadata: {} }, // Tuesday (day 2)
      ];

      mockSupabaseQuery(mockSupabase, mockMessages);

      const result = await bi.analyzePeakUsage('test-domain', TEST_TIME_RANGE);

      expect(result.dailyDistribution).toBeInstanceOf(Array);
      expect(result.dailyDistribution).toHaveLength(7); // All 7 days of week

      const mondayData = result.dailyDistribution.find((d: any) => d.dayOfWeek === 1);
      expect(mondayData).toBeDefined();
      expect(mondayData?.totalMessages).toBe(3);
    });

    it('should identify peak hours', async () => {
      const mockMessages = Array(50).fill(null).map((_, i) => ({
        created_at: `2024-01-01T14:${(i % 60).toString().padStart(2, '0')}:00Z`,
        metadata: {}
      })).concat(
        Array(30).fill(null).map((_, i) => ({
          created_at: `2024-01-01T15:${(i % 60).toString().padStart(2, '0')}:00Z`,
          metadata: {}
        }))
      );

      mockSupabaseQuery(mockSupabase, mockMessages);

      const result = await bi.analyzePeakUsage('test-domain', TEST_TIME_RANGE);

      expect(result.peakHours.map((p: any) => p.hour)).toContain(14);
      expect(result.peakHours.map((p: any) => p.hour)).toContain(15);
    });
  });

  describe('Domain Filtering', () => {
    it.skip('should filter by specific domain [NEEDS FIX: Mock chain setup after refactor]', async () => {
      const eqSpy = jest.fn().mockReturnThis();
      const queryBuilder = {
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: eqSpy,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          ...queryBuilder,
          then: (resolve: any) => resolve({ data: [], error: null })
        })
      }) as any;

      await bi.analyzeCustomerJourney('specific-domain.com', TEST_TIME_RANGE);

      expect(eqSpy).toHaveBeenCalledWith('domain', 'specific-domain.com');
    });

    it('should handle "all" domain parameter', async () => {
      const eqSpy = jest.fn().mockReturnThis();
      const queryBuilder = {
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        eq: eqSpy,
      };

      mockSupabase.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          ...queryBuilder,
          then: (resolve: any) => resolve({ data: [], error: null })
        })
      }) as any;

      await bi.analyzeCustomerJourney('all', TEST_TIME_RANGE);

      expect(eqSpy).not.toHaveBeenCalledWith('domain', 'all');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabaseQuery(mockSupabase, null, new Error('Database error'));

      const result = await bi.analyzeCustomerJourney('test-domain', TEST_TIME_RANGE);

      expect(result.conversionRate).toBe(0);
      expect(result.commonPaths).toEqual([]);
    });

    it('should handle invalid date ranges', async () => {
      const result = await bi.analyzeCustomerJourney('test-domain', {
        start: new Date('2024-01-31'),
        end: new Date('2024-01-01') // End before start
      });

      expect(result.conversionRate).toBe(0);
      expect(result.commonPaths).toEqual([]);
    });
  });
});
