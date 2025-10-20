import { BusinessIntelligence } from '@/lib/analytics/business-intelligence';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { SupabaseClient } from '@supabase/supabase-js';

jest.mock('@/lib/supabase-server');

describe('BusinessIntelligence', () => {
  let mockSupabase: jest.Mocked<SupabaseClient>;
  let bi: BusinessIntelligence;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
    } as any;

    bi = new BusinessIntelligence(mockSupabase as any);
  });

  describe('analyzeCustomerJourney', () => {
    it('should calculate conversion metrics correctly', async () => {
      const mockConversations = [
        { session_id: 's1', created_at: '2024-01-01', metadata: { converted: true } },
        { session_id: 's2', created_at: '2024-01-02', metadata: {} },
        { session_id: 's3', created_at: '2024-01-03', metadata: { converted: true } },
      ];

      const mockMessages = [
        { conversation_id: 'c1', session_id: 's1', content: 'product inquiry', user_message: 'show products' },
        { conversation_id: 'c1', session_id: 's1', content: 'checkout', user_message: 'buy now' },
        { conversation_id: 'c2', session_id: 's2', content: 'help', user_message: 'need help' },
      ];

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockConversations, error: null })
          } as any;
        }
        if (table === 'messages') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
          } as any;
        }
        return mockSupabase;
      }) as any;

      const timeRange = {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      };

      const result = await bi.analyzeCustomerJourney('test-domain', timeRange);

      expect(result.conversionRate).toBeCloseTo(0.667, 2);
      expect(result.avgSessionsBeforeConversion).toBeDefined();
      expect(result.commonPaths).toBeInstanceOf(Array);
    });

    it('should identify drop-off points', async () => {
      const mockConversations = [
        { session_id: 's1', created_at: '2024-01-01', metadata: {} },
        { session_id: 's2', created_at: '2024-01-02', metadata: {} },
      ];

      const mockMessages = [
        { conversation_id: 'c1', session_id: 's1', content: 'products', user_message: 'show products' },
        { conversation_id: 'c1', session_id: 's1', content: 'price inquiry', user_message: 'how much?' },
        { conversation_id: 'c2', session_id: 's2', content: 'products', user_message: 'show products' },
      ];

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockConversations, error: null })
          } as any;
        }
        if (table === 'messages') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
          } as any;
        }
        return mockSupabase;
      }) as any;

      const result = await bi.analyzeCustomerJourney('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.dropOffPoints).toBeInstanceOf(Array);
      expect(result.dropOffPoints.length).toBeGreaterThan(0);
    });

    it('should handle empty data gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: [], error: null })
      }) as any;

      const result = await bi.analyzeCustomerJourney('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.conversionRate).toBe(0);
      expect(result.avgSessionsBeforeConversion).toBe(0);
      expect(result.commonPaths).toEqual([]);
      expect(result.dropOffPoints).toEqual([]);
    });
  });

  describe('analyzeContentGaps', () => {
    it('should identify frequently unanswered queries', async () => {
      const mockMessages = [
        { user_message: 'return policy?', metadata: { confidence_score: 0.2 } },
        { user_message: 'return policy?', metadata: { confidence_score: 0.3 } },
        { user_message: 'shipping cost?', metadata: { confidence_score: 0.8 } },
        { user_message: 'warranty info?', metadata: { confidence_score: 0.1 } },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
      }) as any;

      const result = await bi.analyzeContentGaps('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result).toBeInstanceOf(Array);
      expect(result[0].query).toBe('return policy?');
      expect(result[0].frequency).toBe(2);
      expect(result[0].avgConfidence).toBeCloseTo(0.25, 2);
    });

    it('should filter by confidence threshold', async () => {
      const mockMessages = [
        { user_message: 'high confidence query', metadata: { confidence_score: 0.9 } },
        { user_message: 'low confidence query', metadata: { confidence_score: 0.2 } },
        { user_message: 'low confidence query', metadata: { confidence_score: 0.3 } },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
      }) as any;

      const result = await bi.analyzeContentGaps('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      const lowConfidenceQuery = result.find((gap: any) => gap.query === 'low confidence query');
      expect(lowConfidenceQuery).toBeDefined();
      expect(lowConfidenceQuery?.frequency).toBe(2);
    });

    it('should sort by frequency', async () => {
      const mockMessages = [
        { user_message: 'query A', metadata: { confidence_score: 0.2 } },
        { user_message: 'query B', metadata: { confidence_score: 0.2 } },
        { user_message: 'query B', metadata: { confidence_score: 0.2 } },
        { user_message: 'query B', metadata: { confidence_score: 0.2 } },
        { user_message: 'query C', metadata: { confidence_score: 0.2 } },
        { user_message: 'query C', metadata: { confidence_score: 0.2 } },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
      }) as any;

      const result = await bi.analyzeContentGaps('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result[0].query).toBe('query B');
      expect(result[0].frequency).toBe(3);
      expect(result[1].query).toBe('query C');
      expect(result[1].frequency).toBe(2);
    });
  });

  describe('analyzePeakUsage', () => {
    it('should calculate hourly distribution', async () => {
      const mockTelemetry = [
        { created_at: '2024-01-01T09:00:00Z' },
        { created_at: '2024-01-01T09:30:00Z' },
        { created_at: '2024-01-01T14:00:00Z' },
        { created_at: '2024-01-01T14:15:00Z' },
        { created_at: '2024-01-01T14:30:00Z' },
        { created_at: '2024-01-02T09:00:00Z' },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: mockTelemetry, error: null })
      }) as any;

      const result = await bi.analyzePeakUsage('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.hourlyDistribution).toHaveLength(24);

      const hour9 = result.hourlyDistribution.find((h: any) => h.hour === 9);
      const hour14 = result.hourlyDistribution.find((h: any) => h.hour === 14);

      expect(hour9?.avgRequests).toBeGreaterThan(0);
      expect(hour14?.avgRequests).toBeGreaterThan(0);
    });

    it('should identify busiest days', async () => {
      const mockTelemetry = [
        { created_at: '2024-01-01T09:00:00Z' },
        { created_at: '2024-01-01T10:00:00Z' },
        { created_at: '2024-01-01T11:00:00Z' },
        { created_at: '2024-01-02T09:00:00Z' },
      ];

      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: mockTelemetry, error: null })
      }) as any;

      const result = await bi.analyzePeakUsage('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.busiestDays).toBeInstanceOf(Array);
      expect(result.busiestDays[0].date).toBe('2024-01-01');
      expect(result.busiestDays[0].totalRequests).toBe(3);
    });

    it('should identify peak hours', async () => {
      const mockTelemetry = Array(50).fill(null).map((_, i) => ({
        created_at: `2024-01-01T14:${i % 60}:00Z`
      })).concat(
        Array(30).fill(null).map((_, i) => ({
          created_at: `2024-01-01T15:${i % 60}:00Z`
        }))
      );

      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({ data: mockTelemetry, error: null })
      }) as any;

      const result = await bi.analyzePeakUsage('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.peakHours).toContain(14);
      expect(result.peakHours).toContain(15);
    });
  });

  describe('analyzeConversionFunnel', () => {
    it('should track progression through stages', async () => {
      const mockConversations = [
        { session_id: 's1', metadata: { stage: 'landing' } },
        { session_id: 's2', metadata: { stage: 'landing' } },
        { session_id: 's3', metadata: { stage: 'landing' } },
        { session_id: 's4', metadata: { stage: 'landing' } },
      ];

      const mockMessages = [
        { session_id: 's1', user_message: 'show products' },
        { session_id: 's1', user_message: 'add to cart' },
        { session_id: 's1', user_message: 'checkout' },
        { session_id: 's2', user_message: 'show products' },
        { session_id: 's2', user_message: 'add to cart' },
        { session_id: 's3', user_message: 'show products' },
      ];

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockConversations, error: null })
          } as any;
        }
        if (table === 'messages') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
          } as any;
        }
        return mockSupabase;
      }) as any;

      const result = await bi.analyzeConversionFunnel('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.stages).toBeInstanceOf(Array);
      expect(result.stages[0].name).toBe('Visit');
      expect(result.stages[0].count).toBe(4);

      const cartStage = result.stages.find((s: any) => s.name === 'Add to Cart');
      expect(cartStage?.count).toBe(2);

      const checkoutStage = result.stages.find((s: any) => s.name === 'Checkout');
      expect(checkoutStage?.count).toBe(1);
    });

    it('should calculate conversion rates between stages', async () => {
      const mockConversations = [
        { session_id: 's1', metadata: {} },
        { session_id: 's2', metadata: {} },
      ];

      const mockMessages = [
        { session_id: 's1', user_message: 'browse' },
        { session_id: 's1', user_message: 'checkout' },
        { session_id: 's2', user_message: 'browse' },
      ];

      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockConversations, error: null })
          } as any;
        }
        if (table === 'messages') {
          return {
            ...mockSupabase,
            select: jest.fn().mockResolvedValue({ data: mockMessages, error: null })
          } as any;
        }
        return mockSupabase;
      }) as any;

      const result = await bi.analyzeConversionFunnel('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(result.overallConversionRate).toBeCloseTo(0.5, 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockSupabase.from = jest.fn().mockReturnValue({
        ...mockSupabase,
        select: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      }) as any;

      const result = await bi.analyzeCustomerJourney('test-domain', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

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

  describe('Domain Filtering', () => {
    it('should filter by specific domain', async () => {
      const spy = jest.spyOn(mockSupabase, 'eq');

      await bi.analyzeCustomerJourney('specific-domain.com', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      expect(spy).toHaveBeenCalledWith('domain', 'specific-domain.com');
    });

    it('should handle "all" domain parameter', async () => {
      const spy = jest.spyOn(mockSupabase, 'eq');

      await bi.analyzeCustomerJourney('all', {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      });

      // Should not filter by domain when 'all' is specified
      expect(spy).not.toHaveBeenCalledWith('domain', 'all');
    });
  });
});