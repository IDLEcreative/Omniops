/**
 * Error Handling Tests for Stripe Invoices API
 *
 * Tests error scenarios and data completeness.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/stripe/invoices/route';
import { createAuthenticatedMockClient } from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const buildRequest = (organizationId?: string) => {
  const url = organizationId
    ? `http://localhost:3000/api/stripe/invoices?organizationId=${organizationId}`
    : 'http://localhost:3000/api/stripe/invoices';

  return new NextRequest(url, { method: 'GET' });
};

describe('GET /api/stripe/invoices - Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle database errors when fetching invoices', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'member' },
            error: null,
          }),
        };
      }
      if (table === 'invoices') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest(organizationId);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch invoices');
  });

  it('should handle unexpected errors gracefully', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockRejectedValue(new Error('Unexpected error')),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest(organizationId);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('GET /api/stripe/invoices - Invoice Data Completeness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include all invoice fields in response', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockInvoice = {
      id: 'inv_1',
      organization_id: organizationId,
      stripe_invoice_id: 'in_test_1',
      amount_due: 2000,
      amount_paid: 2000,
      currency: 'usd',
      status: 'paid',
      invoice_pdf: 'https://invoice.pdf',
      hosted_invoice_url: 'https://invoice.url',
      period_start: '2024-01-01T00:00:00Z',
      period_end: '2024-02-01T00:00:00Z',
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { role: 'member' },
            error: null,
          }),
        };
      }
      if (table === 'invoices') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [mockInvoice],
            error: null,
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest(organizationId);
    const response = await GET(request);
    const data = await response.json();

    const invoice = data.invoices[0];
    expect(invoice.stripe_invoice_id).toBe('in_test_1');
    expect(invoice.amount_due).toBe(2000);
    expect(invoice.amount_paid).toBe(2000);
    expect(invoice.currency).toBe('usd');
    expect(invoice.status).toBe('paid');
    expect(invoice.invoice_pdf).toBe('https://invoice.pdf');
    expect(invoice.hosted_invoice_url).toBe('https://invoice.url');
  });
});
