/**
 * Checkout Event Tests for Stripe Webhook Handler
 *
 * Tests checkout.session.completed event processing.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/webhook/route';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Mock Stripe
const mockConstructEvent = jest.fn();
const mockRetrieveSubscription = jest.fn();

jest.mock('@/lib/stripe-client', () => ({
  __esModule: true,
  default: {
    webhooks: {
      constructEvent: (...args: any[]) => mockConstructEvent(...args),
    },
    subscriptions: {
      retrieve: (...args: any[]) => mockRetrieveSubscription(...args),
    },
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

// Mock headers
let mockHeaderValue: string | null = null;

jest.mock('next/headers', () => ({
  headers: jest.fn(async () => ({
    get: (key: string) => {
      if (key === 'stripe-signature') {
        return mockHeaderValue;
      }
      return null;
    },
  })),
}));

const buildRequest = (body: string) =>
  new NextRequest('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body,
  });

const mockSupabase = (overrides?: any) => {
  return {
    from: jest.fn().mockImplementation((table: string) => {
      if (overrides && overrides[table]) {
        return overrides[table];
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        update: jest.fn().mockReturnThis(),
      };
    }),
  };
};

describe('POST /api/stripe/webhook - checkout.session.completed Event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaderValue = null;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('should update domain_subscriptions for new subscription', async () => {
    const subscriptionId = 'sub_test_123';
    const domainId = '123e4567-e89b-12d3-a456-426614174000';
    const organizationId = '123e4567-e89b-12d3-a456-426614174001';

    mockHeaderValue = 'valid_signature';
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          subscription: subscriptionId,
          metadata: {
            domainId,
            organizationId,
          },
        },
      },
    });

    mockRetrieveSubscription.mockResolvedValue({
      id: subscriptionId,
      status: 'active',
      current_period_start: 1234567890,
      current_period_end: 1234567890,
      cancel_at_period_end: false,
      items: {
        data: [{ id: 'si_test_123' }],
      },
    });

    const supabaseMock = mockSupabase({
      billing_events: {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      },
      domain_subscriptions: {
        update: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        })),
      },
      organizations: {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: organizationId },
          error: null,
        }),
      },
    });

    (createServiceRoleClient as jest.Mock).mockResolvedValue(supabaseMock);

    const request = buildRequest('{}');
    const response = await POST(request);

    expect(response.status).toBe(200);
  });
});
