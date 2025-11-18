/**
 * Authentication Tests for Stripe Checkout API
 *
 * Tests authentication and database availability checks.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/checkout/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
} from '@/test-utils/supabase-test-helpers';
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

describe('POST /api/stripe/checkout - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockClient = createUnauthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const request = buildRequest({
      priceId: 'price_test_123',
      domainId: '123e4567-e89b-12d3-a456-426614174000',
      pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should return 503 if database is unavailable', async () => {
    __setMockSupabaseClient(null);

    const request = buildRequest({
      priceId: 'price_test_123',
      domainId: '123e4567-e89b-12d3-a456-426614174000',
      pricingTierId: '123e4567-e89b-12d3-a456-426614174001',
      organizationId: '123e4567-e89b-12d3-a456-426614174002',
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Database service unavailable');
  });
});
