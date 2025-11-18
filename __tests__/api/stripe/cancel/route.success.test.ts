/**
 * Successful Cancellation Tests for Stripe Cancel API
 *
 * Tests successful subscription cancellation scenarios.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/cancel/route';
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

// Mock Stripe
const mockUpdateSubscription = jest.fn();

jest.mock('@/lib/stripe-client', () => ({
  __esModule: true,
  default: {
    subscriptions: {
      update: (...args: any[]) => mockUpdateSubscription(...args),
    },
  },
}));

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/stripe/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/stripe/cancel - Successful Cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUpdateSubscription.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: true,
      current_period_end: 1738368000, // Feb 1, 2025
    });
  });

  it('should cancel subscription at period end', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const subscriptionId = 'sub_test_123';

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
    let dbUpdated = false;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              stripe_subscription_id: subscriptionId,
            },
            error: null,
          }),
          update: jest.fn((data: any) => {
            if (data.cancel_at_period_end === true) {
              dbUpdated = true;
            }
            return {
              eq: jest.fn().mockResolvedValue({
                data: {},
                error: null,
              }),
            };
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ organizationId });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.cancelAt).toBeDefined();
    expect(mockUpdateSubscription).toHaveBeenCalledWith(subscriptionId, {
      cancel_at_period_end: true,
    });
    expect(dbUpdated).toBe(true);
  });

  it('should return correct cancellation date', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const subscriptionId = 'sub_test_123';
    const periodEnd = 1738368000; // Feb 1, 2025

    mockUpdateSubscription.mockResolvedValue({
      id: subscriptionId,
      cancel_at_period_end: true,
      current_period_end: periodEnd,
    });

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              stripe_subscription_id: subscriptionId,
            },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ organizationId });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.cancelAt).toBe(new Date(periodEnd * 1000).toISOString());
  });

  it('should update database with cancel_at_period_end flag', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const subscriptionId = 'sub_test_123';

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
    let updateCalledWith: any = null;

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              stripe_subscription_id: subscriptionId,
            },
            error: null,
          }),
          update: jest.fn((data: any) => {
            updateCalledWith = data;
            return {
              eq: jest.fn().mockResolvedValue({
                data: {},
                error: null,
              }),
            };
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ organizationId });

    await POST(request);

    expect(updateCalledWith).toEqual({ cancel_at_period_end: true });
  });
});
