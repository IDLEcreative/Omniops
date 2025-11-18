/**
 * Authorization Tests for Stripe Checkout API
 *
 * Tests permission and access control checks.
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

describe('POST /api/stripe/checkout - Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if user is not an owner/admin of organization', async () => {
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'member' }, // Not owner/admin
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
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });

  it('should return 403 if domain does not belong to organization', async () => {
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
            data: {
              id: 'customer-id',
              organization_id: 'different-org-id' // Different org!
            },
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
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Domain does not belong to organization');
  });
});
