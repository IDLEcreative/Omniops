/**
 * Authentication Tests for Stripe Invoices API
 *
 * Tests authentication, database availability, and input validation.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/stripe/invoices/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
} from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const buildRequest = (organizationId?: string) => {
  const url = organizationId
    ? `http://localhost:3000/api/stripe/invoices?organizationId=${organizationId}`
    : 'http://localhost:3000/api/stripe/invoices';

  return new NextRequest(url, { method: 'GET' });
};

describe('GET /api/stripe/invoices - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockClient = createUnauthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const request = buildRequest('123e4567-e89b-12d3-a456-426614174000');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database errors gracefully', async () => {
    __setMockSupabaseClient(null);

    const request = buildRequest('123e4567-e89b-12d3-a456-426614174000');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Internal server error');
  });
});

describe('GET /api/stripe/invoices - Input Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if organizationId is missing', async () => {
    const mockClient = createAuthenticatedMockClient('user-id', 'test@example.com');
    __setMockSupabaseClient(mockClient);

    const request = buildRequest();

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing organizationId');
  });
});
