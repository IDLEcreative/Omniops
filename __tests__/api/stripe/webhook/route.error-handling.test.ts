/**
 * Error Handling Tests for Stripe Webhook Handler
 *
 * Tests error scenarios during webhook processing.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/webhook/route';
import { createServiceRoleClient } from '@/lib/supabase-server';

// Mock Stripe
const mockConstructEvent = jest.fn();

jest.mock('@/lib/stripe-client', () => ({
  __esModule: true,
  default: {
    webhooks: {
      constructEvent: (...args: any[]) => mockConstructEvent(...args),
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

describe('POST /api/stripe/webhook - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaderValue = null;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('should return 500 if event processing fails', async () => {
    mockHeaderValue = 'valid_signature';
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      data: { object: {} },
    });

    const supabaseMock = mockSupabase({
      billing_events: {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
        insert: jest.fn().mockRejectedValue(new Error('Database error')),
      },
    });

    (createServiceRoleClient as jest.Mock).mockResolvedValue(supabaseMock);

    const request = buildRequest('{}');
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Webhook processing failed');
  });
});
