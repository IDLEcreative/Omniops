/**
 * Business Logic Tests for Stripe Checkout API
 *
 * Tests domain and pricing tier validation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/checkout/route';
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

// Mock Stripe
jest.mock('@/lib/stripe-client', () => ({
  __esModule: true,
  default: {
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    customers: {
      create: jest.fn(),
    },
  },
}));

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const setupAuthorizationMocks = (mockClient: any) => {
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
    return mockClient.from(table);
  });
};

describe('POST /api/stripe/checkout - Business Logic Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 if domain not found', async () => {
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
    setupAuthorizationMocks(mockClient);

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
            data: null,
            error: { message: 'Not found' },
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({
      priceId: 'price_test_123',
      domainId: '123e4567-e89b-12d3-a456-426614174000',
      pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Domain not found');
  });

  it('should return 400 if domain already has active subscription', async () => {
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
            data: { id: 'sub-id', status: 'active' },
            error: null,
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({
      priceId: 'price_test_123',
      domainId: '123e4567-e89b-12d3-a456-426614174000',
      pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: orgId,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Domain already has an active subscription');
  });

});
