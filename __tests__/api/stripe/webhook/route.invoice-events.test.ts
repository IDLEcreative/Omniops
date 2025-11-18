/**
 * Invoice Event Tests for Stripe Webhook Handler
 *
 * Tests invoice.paid event processing.
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

describe('POST /api/stripe/webhook - invoice.paid Event', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHeaderValue = null;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  it('should create invoice record', async () => {
    const invoiceId = 'in_test_123';
    const customerId = 'cus_test_123';
    const subscriptionId = 'sub_test_123';
    const organizationId = '123e4567-e89b-12d3-a456-426614174001';

    mockHeaderValue = 'valid_signature';
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'invoice.paid',
      data: {
        object: {
          id: invoiceId,
          customer: customerId,
          subscription: subscriptionId,
          amount_due: 2000,
          amount_paid: 2000,
          currency: 'usd',
          status: 'paid',
          invoice_pdf: 'https://invoice.pdf',
          hosted_invoice_url: 'https://invoice.url',
          period_start: 1234567890,
          period_end: 1234567890,
        },
      },
    });

    let invoiceCreated = false;
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
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { organization_id: organizationId },
          error: null,
        }),
      },
      invoices: {
        insert: jest.fn((data: any) => {
          invoiceCreated = true;
          return Promise.resolve({
            data: {},
            error: null,
          });
        }),
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
    expect(invoiceCreated).toBe(true);
  });
});
