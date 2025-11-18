/**
 * Error and Edge Case Tests for Stripe Cancel API
 *
 * Tests error scenarios and edge cases.
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

describe('POST /api/stripe/cancel - Error Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUpdateSubscription.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: true,
      current_period_end: 1738368000,
    });
  });

  it('should return 404 if no active subscription exists', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              stripe_subscription_id: null, // No subscription
            },
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

    expect(response.status).toBe(404);
    expect(data.error).toBe('No active subscription');
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

    const request = buildRequest({ organizationId });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('No active subscription');
  });

  it('should handle Stripe API errors gracefully', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              stripe_subscription_id: 'sub_test_123',
            },
            error: null,
          }),
        };
      }
      return mockClient.from(table);
    });

    mockUpdateSubscription.mockRejectedValue(new Error('Stripe API error'));

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ organizationId });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle database update errors gracefully', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              stripe_subscription_id: 'sub_test_123',
            },
            error: null,
          }),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockRejectedValue(new Error('Database error')),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ organizationId });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('POST /api/stripe/cancel - Edge Cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation
    mockUpdateSubscription.mockResolvedValue({
      id: 'sub_test_123',
      cancel_at_period_end: true,
      current_period_end: 1738368000,
    });
  });

  it('should handle subscription already set to cancel', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const subscriptionId = 'sub_test_123';

    mockUpdateSubscription.mockResolvedValue({
      id: subscriptionId,
      cancel_at_period_end: true,
      current_period_end: 1738368000,
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
    expect(data.success).toBe(true);
  });
});
