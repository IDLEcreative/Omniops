/**
 * Cart Analytics Tests
 *
 * Tests the cart analytics tracking system.
 */

import {
  trackCartOperation,
  getSessionMetrics,
  markCartAbandoned,
  markCartRecovered,
  getDomainAnalytics,
  getRecentOperations,
  getAbandonedCarts
} from '@/lib/cart-analytics';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn()
}));

const mockSupabase = createServiceRoleClient as jest.Mock;

describe('Cart Analytics', () => {
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn()
    };

    mockSupabase.mockResolvedValue(mockClient);
  });

  describe('trackCartOperation', () => {
    it('should track successful add to cart operation', async () => {
      mockClient.insert.mockResolvedValue({ error: null });

      await trackCartOperation({
        domain: 'test.com',
        sessionId: 'session123',
        operationType: 'add_to_cart',
        platform: 'woocommerce',
        productId: 'prod_123',
        quantity: 2,
        cartValue: 29.99,
        success: true
      });

      expect(mockClient.from).toHaveBeenCalledWith('cart_operations');
      expect(mockClient.insert).toHaveBeenCalledWith({
        domain: 'test.com',
        session_id: 'session123',
        user_id: undefined,
        operation_type: 'add_to_cart',
        platform: 'woocommerce',
        product_id: 'prod_123',
        quantity: 2,
        cart_value: 29.99,
        success: true,
        error_message: undefined,
        metadata: {}
      });
    });

    it('should track failed operation with error message', async () => {
      mockClient.insert.mockResolvedValue({ error: null });

      await trackCartOperation({
        domain: 'test.com',
        sessionId: 'session123',
        operationType: 'add_to_cart',
        platform: 'woocommerce',
        success: false,
        errorMessage: 'Product out of stock'
      });

      expect(mockClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error_message: 'Product out of stock'
        })
      );
    });

    it('should handle Supabase errors gracefully', async () => {
      mockClient.insert.mockResolvedValue({ error: { message: 'DB error' } });

      // Should not throw
      await expect(
        trackCartOperation({
          domain: 'test.com',
          sessionId: 'session123',
          operationType: 'get_cart',
          platform: 'shopify',
          success: true
        })
      ).resolves.not.toThrow();
    });
  });

  describe('getSessionMetrics', () => {
    it('should return session metrics when found', async () => {
      const mockMetrics = {
        domain: 'test.com',
        session_id: 'session123',
        platform: 'woocommerce',
        total_operations: 5,
        items_added: 3,
        items_removed: 1,
        final_cart_value: '49.99',
        converted: false,
        conversion_value: null,
        session_duration_seconds: 120
      };

      mockClient.single.mockResolvedValue({ data: mockMetrics, error: null });

      const result = await getSessionMetrics('session123');

      expect(result).toEqual({
        domain: 'test.com',
        sessionId: 'session123',
        platform: 'woocommerce',
        totalOperations: 5,
        itemsAdded: 3,
        itemsRemoved: 1,
        finalCartValue: 49.99,
        converted: false,
        conversionValue: undefined,
        sessionDurationSeconds: 120
      });
    });

    it('should return null when session not found', async () => {
      mockClient.single.mockResolvedValue({ data: null, error: { code: 'PGRST116' } });

      const result = await getSessionMetrics('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('markCartAbandoned', () => {
    it('should mark cart as abandoned', async () => {
      mockClient.insert.mockResolvedValue({ error: null });

      await markCartAbandoned({
        domain: 'test.com',
        sessionId: 'session123',
        platform: 'woocommerce',
        cartValue: 99.99,
        itemsCount: 3,
        lastActivityAt: new Date('2025-11-10T10:00:00Z')
      });

      expect(mockClient.from).toHaveBeenCalledWith('cart_abandonments');
      expect(mockClient.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'test.com',
          session_id: 'session123',
          platform: 'woocommerce',
          cart_value: 99.99,
          items_count: 3,
          last_activity_at: '2025-11-10T10:00:00.000Z'
        })
      );
    });
  });

  describe('markCartRecovered', () => {
    it('should mark abandoned cart as recovered [NEEDS FIX: Mock chain expectations]', async () => {
      mockClient.update.mockResolvedValue({ error: null });

      await markCartRecovered('session123');

      expect(mockClient.from).toHaveBeenCalledWith('cart_abandonments');
      expect(mockClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          recovered: true
        })
      );
      expect(mockClient.eq).toHaveBeenCalledWith('session_id', 'session123');
    });
  });

  describe('getDomainAnalytics', () => {
    it('should get analytics for domain without date range', async () => {
      const mockAnalytics = [
        { date: '2025-11-10', total_sessions: 50, conversions: 10 },
        { date: '2025-11-09', total_sessions: 45, conversions: 8 }
      ];

      mockClient.order.mockResolvedValue({ data: mockAnalytics, error: null });

      const result = await getDomainAnalytics('test.com');

      expect(mockClient.from).toHaveBeenCalledWith('cart_analytics_daily');
      expect(mockClient.eq).toHaveBeenCalledWith('domain', 'test.com');
      expect(result).toEqual(mockAnalytics);
    });

    it('should filter by date range when provided [NEEDS FIX: Mock chain expectations]', async () => {
      mockClient.order.mockResolvedValue({ data: [], error: null });

      await getDomainAnalytics(
        'test.com',
        new Date('2025-11-01'),
        new Date('2025-11-10')
      );

      expect(mockClient.gte).toHaveBeenCalledWith('date', '2025-11-01');
      expect(mockClient.lte).toHaveBeenCalledWith('date', '2025-11-10');
    });
  });

  describe('getRecentOperations', () => {
    it('should get recent operations for domain', async () => {
      const mockOperations = [
        { id: '1', operation_type: 'add_to_cart', success: true },
        { id: '2', operation_type: 'get_cart', success: true }
      ];

      mockClient.limit.mockResolvedValue({ data: mockOperations, error: null });

      const result = await getRecentOperations('test.com', 50);

      expect(mockClient.eq).toHaveBeenCalledWith('domain', 'test.com');
      expect(mockClient.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(mockOperations);
    });

    it('should use default limit of 100', async () => {
      mockClient.limit.mockResolvedValue({ data: [], error: null });

      await getRecentOperations('test.com');

      expect(mockClient.limit).toHaveBeenCalledWith(100);
    });
  });

  describe('getAbandonedCarts', () => {
    it('should get unrecovered abandoned carts by default [NEEDS FIX: Mock chain expectations]', async () => {
      const mockCarts = [
        { session_id: 'session1', cart_value: '49.99', recovered: false }
      ];

      mockClient.order.mockResolvedValue({ data: mockCarts, error: null });

      const result = await getAbandonedCarts('test.com');

      expect(mockClient.eq).toHaveBeenCalledWith('domain', 'test.com');
      expect(mockClient.eq).toHaveBeenCalledWith('recovered', false);
      expect(result).toEqual(mockCarts);
    });

    it('should include recovered carts when requested', async () => {
      mockClient.order.mockResolvedValue({ data: [], error: null });

      await getAbandonedCarts('test.com', true);

      expect(mockClient.eq).toHaveBeenCalledWith('domain', 'test.com');
      // Should NOT filter by recovered status
      expect(mockClient.eq).not.toHaveBeenCalledWith('recovered', expect.anything());
    });
  });
});
