/**
 * Tests for Stripe Subscription Retrieval API
 *
 * Tests fetching organization subscription status.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/stripe/subscription/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
} from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const buildRequest = (organizationId?: string) => {
  const url = organizationId
    ? `http://localhost:3000/api/stripe/subscription?organizationId=${organizationId}`
    : 'http://localhost:3000/api/stripe/subscription';

  return new NextRequest(url, { method: 'GET' });
};

describe('GET /api/stripe/subscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      const mockClient = createUnauthenticatedMockClient();
      __setMockSupabaseClient(mockClient);

      const request = buildRequest('123e4567-e89b-12d3-a456-426614174000');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 503 if database is unavailable', async () => {
      __setMockSupabaseClient(null);

      const request = buildRequest('123e4567-e89b-12d3-a456-426614174000');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toBe('Database service unavailable');
    });
  });

  describe('Input Validation', () => {
    it('should return 400 if organizationId is missing', async () => {
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
      __setMockSupabaseClient(mockClient);

      const request = buildRequest(); // No organizationId

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing organizationId');
    });
  });

  describe('Subscription Data Retrieval', () => {
    it('should return subscription data when it exists', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                stripe_customer_id: 'cus_test_123',
                stripe_subscription_id: 'sub_test_123',
                subscription_status: 'active',
                current_period_start: '2024-01-01T00:00:00Z',
                current_period_end: '2024-02-01T00:00:00Z',
                cancel_at_period_end: false,
                plan_type: 'pro',
              },
              error: null,
            }),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest(organizationId);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasSubscription).toBe(true);
      expect(data.subscription).toEqual({
        status: 'active',
        currentPeriodStart: '2024-01-01T00:00:00Z',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        planType: 'pro',
      });
    });

    it('should return no subscription when subscription does not exist', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                stripe_customer_id: null,
                stripe_subscription_id: null,
                subscription_status: null,
                current_period_start: null,
                current_period_end: null,
                cancel_at_period_end: null,
                plan_type: null,
              },
              error: null,
            }),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest(organizationId);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.hasSubscription).toBe(false);
      expect(data.subscription).toBeNull();
    });

    it('should return 404 if organization not found', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest(organizationId);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });
  });

  describe('Subscription Status Types', () => {
    const testStatusScenario = async (status: string) => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                stripe_customer_id: 'cus_test_123',
                stripe_subscription_id: 'sub_test_123',
                subscription_status: status,
                current_period_start: '2024-01-01T00:00:00Z',
                current_period_end: '2024-02-01T00:00:00Z',
                cancel_at_period_end: false,
                plan_type: 'pro',
              },
              error: null,
            }),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest(organizationId);
      const response = await GET(request);
      const data = await response.json();

      return data;
    };

    it('should handle active subscription status', async () => {
      const data = await testStatusScenario('active');
      expect(data.subscription.status).toBe('active');
    });

    it('should handle trialing subscription status', async () => {
      const data = await testStatusScenario('trialing');
      expect(data.subscription.status).toBe('trialing');
    });

    it('should handle past_due subscription status', async () => {
      const data = await testStatusScenario('past_due');
      expect(data.subscription.status).toBe('past_due');
    });

    it('should handle canceled subscription status', async () => {
      const data = await testStatusScenario('canceled');
      expect(data.subscription.status).toBe('canceled');
    });

    it('should handle incomplete subscription status', async () => {
      const data = await testStatusScenario('incomplete');
      expect(data.subscription.status).toBe('incomplete');
    });
  });

  describe('Cancel at Period End', () => {
    it('should correctly indicate subscription set to cancel', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                stripe_customer_id: 'cus_test_123',
                stripe_subscription_id: 'sub_test_123',
                subscription_status: 'active',
                current_period_start: '2024-01-01T00:00:00Z',
                current_period_end: '2024-02-01T00:00:00Z',
                cancel_at_period_end: true, // Will cancel at period end
                plan_type: 'pro',
              },
              error: null,
            }),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest(organizationId);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.subscription.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const organizationId = '123e4567-e89b-12d3-a456-426614174000';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockRejectedValue(new Error('Database error')),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest(organizationId);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
