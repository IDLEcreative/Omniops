/**
 * Authorization Tests for Stripe Invoices API
 *
 * Tests permission and access control checks.
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

describe('GET /api/stripe/invoices - Authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 403 if user is not a member of organization', async () => {
    const organizationId = '123e4567-e89b-12d3-a456-426614174000';
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');

    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null, // Not a member
            error: { message: 'Not found' },
          }),
        };
      }
      return mockClient.from(table);
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest(organizationId);

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Forbidden');
  });
});
