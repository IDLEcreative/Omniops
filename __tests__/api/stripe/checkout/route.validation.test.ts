/**
 * Input Validation Tests for Stripe Checkout API
 *
 * Tests request parameter validation.
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

describe('POST /api/stripe/checkout - Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if priceId is missing', async () => {
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
    __setMockSupabaseClient(mockClient);

    const request = buildRequest({
      domainId: '123e4567-e89b-12d3-a456-426614174000',
      pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should return 400 if domainId is not a valid UUID', async () => {
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
    __setMockSupabaseClient(mockClient);

    const request = buildRequest({
      priceId: 'price_test_123',
      domainId: 'not-a-uuid',
      pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });
});
