/**
 * Cart Analytics API E2E Tests
 *
 * Tests the cart analytics REST API endpoints.
 */

import { GET as getCartAnalytics } from '@/app/api/analytics/cart/route';
import { GET as getAbandonedCarts } from '@/app/api/analytics/cart/abandoned/route';
import { GET as getSessionMetrics } from '@/app/api/analytics/cart/session/route';
import { NextRequest } from 'next/server';
import * as cartAnalytics from '@/lib/cart-analytics';

// Mock the cart analytics service
jest.mock('@/lib/cart-analytics');

const mockGetDomainAnalytics = cartAnalytics.getDomainAnalytics as jest.MockedFunction<typeof cartAnalytics.getDomainAnalytics>;
const mockGetRecentOperations = cartAnalytics.getRecentOperations as jest.MockedFunction<typeof cartAnalytics.getRecentOperations>;
const mockGetAbandonedCarts = cartAnalytics.getAbandonedCarts as jest.MockedFunction<typeof cartAnalytics.getAbandonedCarts>;
const mockGetSessionMetrics = cartAnalytics.getSessionMetrics as jest.MockedFunction<typeof cartAnalytics.getSessionMetrics>;

describe('Cart Analytics API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/analytics/cart', () => {
    it('should return daily analytics for domain', async () => {
      const mockAnalytics = [
        {
          date: '2025-11-10',
          domain: 'test.com',
          platform: 'woocommerce',
          total_sessions: 50,
          total_operations: 200,
          conversions: 10,
          conversion_rate: 20.0
        }
      ];

      mockGetDomainAnalytics.mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/cart?domain=test.com');
      const response = await getCartAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockAnalytics);
      expect(data.count).toBe(1);
      expect(mockGetDomainAnalytics).toHaveBeenCalledWith('test.com', undefined, undefined);
    });

    it('should return recent operations when type=operations', async () => {
      const mockOperations = [
        {
          id: 'op1',
          domain: 'test.com',
          operation_type: 'add_to_cart',
          success: true,
          created_at: '2025-11-10T10:00:00Z'
        }
      ];

      mockGetRecentOperations.mockResolvedValue(mockOperations);

      const request = new NextRequest('http://localhost:3000/api/analytics/cart?domain=test.com&type=operations&limit=50');
      const response = await getCartAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockOperations);
      expect(mockGetRecentOperations).toHaveBeenCalledWith('test.com', 50);
    });

    it('should filter by date range', async () => {
      mockGetDomainAnalytics.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/cart?domain=test.com&startDate=2025-11-01&endDate=2025-11-10'
      );
      await getCartAnalytics(request);

      expect(mockGetDomainAnalytics).toHaveBeenCalledWith(
        'test.com',
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('should return 400 if domain is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/cart');
      const response = await getCartAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Domain parameter is required');
    });

    it('should handle errors gracefully', async () => {
      mockGetDomainAnalytics.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/analytics/cart?domain=test.com');
      const response = await getCartAnalytics(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to fetch cart analytics');
    });
  });

  describe('GET /api/analytics/cart/abandoned', () => {
    it('should return abandoned carts for domain', async () => {
      const mockCarts = [
        {
          id: 'cart1',
          domain: 'test.com',
          session_id: 'session123',
          cart_value: '99.99',
          items_count: 3,
          recovered: false
        }
      ];

      mockGetAbandonedCarts.mockResolvedValue(mockCarts);

      const request = new NextRequest('http://localhost:3000/api/analytics/cart/abandoned?domain=test.com');
      const response = await getAbandonedCarts(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCarts);
      expect(data.count).toBe(1);
      expect(mockGetAbandonedCarts).toHaveBeenCalledWith('test.com', false);
    });

    it('should include recovered carts when requested', async () => {
      mockGetAbandonedCarts.mockResolvedValue([]);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/cart/abandoned?domain=test.com&includeRecovered=true'
      );
      await getAbandonedCarts(request);

      expect(mockGetAbandonedCarts).toHaveBeenCalledWith('test.com', true);
    });

    it('should return 400 if domain is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/cart/abandoned');
      const response = await getAbandonedCarts(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Domain parameter is required');
    });
  });

  describe('GET /api/analytics/cart/session', () => {
    it('should return session metrics', async () => {
      const mockMetrics = {
        domain: 'test.com',
        sessionId: 'session123',
        platform: 'woocommerce',
        totalOperations: 5,
        itemsAdded: 3,
        itemsRemoved: 1,
        finalCartValue: 49.99,
        converted: false,
        sessionDurationSeconds: 120
      };

      mockGetSessionMetrics.mockResolvedValue(mockMetrics);

      const request = new NextRequest('http://localhost:3000/api/analytics/cart/session?sessionId=session123');
      const response = await getSessionMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockMetrics);
      expect(mockGetSessionMetrics).toHaveBeenCalledWith('session123');
    });

    it('should return 404 if session not found', async () => {
      mockGetSessionMetrics.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/analytics/cart/session?sessionId=nonexistent');
      const response = await getSessionMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
    });

    it('should return 400 if sessionId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/cart/session');
      const response = await getSessionMetrics(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Session ID parameter is required');
    });
  });
});
