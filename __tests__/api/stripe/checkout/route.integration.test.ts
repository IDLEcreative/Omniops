/**
 * Integration Tests for Stripe Checkout API
 *
 * Tests successful checkout session creation and error handling.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/checkout/route';
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

// Mock Stripe
const mockCreateCheckoutSession = jest.fn();
const mockCreateCustomer = jest.fn();

jest.mock('@/lib/stripe-client', () => ({
  __esModule: true,
  default: {
    checkout: {
      sessions: {
        create: (...args: any[]) => mockCreateCheckoutSession(...args),
      },
    },
    customers: {
      create: (...args: any[]) => mockCreateCustomer(...args),
    },
  },
}));

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });


describe('POST /api/stripe/checkout - Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockCreateCheckoutSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    });

    mockCreateCustomer.mockResolvedValue({
      id: 'cus_test_123',
    });
  });

  describe('Successful Checkout Session Creation', () => {
    it('should create checkout session with new Stripe customer', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174002';
      const domainId = '123e4567-e89b-12d3-a456-426614174000';
      const pricingTierId = '123e4567-e89b-12d3-a456-426614174001';
      const priceId = 'price_test_123';

      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'owner' },
              error: null,
            }),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: domainId, domain: 'test.com', customer_id: 'customer-id' },
              error: null,
            }),
          };
        }
        if (table === 'customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'customer-id', organization_id: orgId },
              error: null,
            }),
          };
        }
        if (table === 'domain_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === 'pricing_tiers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: pricingTierId,
                display_name: 'Pro',
                stripe_price_id: priceId,
              },
              error: null,
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: orgId,
                name: 'Test Org',
                stripe_customer_id: null,
              },
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        return mockClient.from(table);
      });

      __setMockSupabaseClient(mockClient);

      const request = buildRequest({
        priceId,
        domainId,
        pricingTierId,
        organizationId: orgId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionUrl).toBe('https://checkout.stripe.com/test');
      expect(mockCreateCustomer).toHaveBeenCalledWith({
        email: 'test@example.com',
        metadata: {
          organizationId: orgId,
          organizationName: 'Test Org',
        },
      });
      expect(mockCreateCheckoutSession).toHaveBeenCalled();
    });

  });

  describe('Error Handling', () => {
    it('should handle Stripe API errors gracefully', async () => {
      const orgId = '123e4567-e89b-12d3-a456-426614174002';
      const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

      mockClient.from = jest.fn((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { role: 'owner' },
              error: null,
            }),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'domain-id', domain: 'test.com', customer_id: 'customer-id' },
              error: null,
            }),
          };
        }
        if (table === 'customers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'customer-id', organization_id: orgId },
              error: null,
            }),
          };
        }
        if (table === 'domain_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            in: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        if (table === 'pricing_tiers') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: 'tier-id',
                display_name: 'Pro',
                stripe_price_id: 'price_test_123',
              },
              error: null,
            }),
          };
        }
        if (table === 'organizations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                id: orgId,
                name: 'Test Org',
                stripe_customer_id: 'cus_test_123',
              },
              error: null,
            }),
          };
        }
        return mockClient.from(table);
      });

      mockCreateCheckoutSession.mockRejectedValue(new Error('Stripe API error'));

      __setMockSupabaseClient(mockClient);

      const request = buildRequest({
        priceId: 'price_test_123',
        domainId: '123e4567-e89b-12d3-a456-426614174000',
        pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
        organizationId: orgId,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });
});
