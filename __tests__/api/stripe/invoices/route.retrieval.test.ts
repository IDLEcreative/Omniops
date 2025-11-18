/**
 * Invoice Retrieval Tests for Stripe Invoices API
 *
 * Tests fetching and filtering invoices by status.
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

describe('GET /api/stripe/invoices - Invoice Retrieval', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return invoices for organization', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockInvoices = [
      {
        id: 'inv_1',
        stripe_invoice_id: 'in_test_1',
        amount_due: 2000,
        amount_paid: 2000,
        currency: 'usd',
        status: 'paid',
        invoice_pdf: 'https://invoice1.pdf',
        hosted_invoice_url: 'https://invoice1.url',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'inv_2',
        stripe_invoice_id: 'in_test_2',
        amount_due: 3000,
        amount_paid: 3000,
        currency: 'usd',
        status: 'paid',
        invoice_pdf: 'https://invoice2.pdf',
        hosted_invoice_url: 'https://invoice2.url',
        created_at: '2024-02-01T00:00:00Z',
      },
    ];

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
            data: mockInvoices,
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

    expect(response.status).toBe(200);
    expect(data.invoices).toHaveLength(2);
    expect(data.invoices[0].stripe_invoice_id).toBe('in_test_1');
    expect(data.invoices[1].stripe_invoice_id).toBe('in_test_2');
  });

  it('should return empty array when no invoices exist', async () => {
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
            data: [],
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

    expect(response.status).toBe(200);
    expect(data.invoices).toEqual([]);
  });

  it('should order invoices by created_at descending', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    let orderCalled = false;
    let orderParams: any = null;

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
          order: jest.fn((field: string, params: any) => {
            orderCalled = true;
            orderParams = { field, ...params };
            return Promise.resolve({
              data: [],
              error: null,
            });
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest(organizationId);

    await GET(request);

    expect(orderCalled).toBe(true);
    expect(orderParams.field).toBe('created_at');
    expect(orderParams.ascending).toBe(false);
  });
});

describe('GET /api/stripe/invoices - Invoice Status Types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle paid invoices', async () => {
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
            data: [{ status: 'paid' }],
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

    expect(data.invoices[0].status).toBe('paid');
  });

  it('should handle open invoices', async () => {
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
            data: [{ status: 'open' }],
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

    expect(data.invoices[0].status).toBe('open');
  });

  it('should handle uncollectible invoices', async () => {
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
            data: [{ status: 'uncollectible' }],
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

    expect(data.invoices[0].status).toBe('uncollectible');
  });
});
