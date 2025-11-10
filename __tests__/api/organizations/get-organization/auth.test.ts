/**
 * Authentication Tests for GET /api/organizations/[id]
 * Tests 401 errors and service unavailability
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/organizations/[id]/route';
import { createUnauthenticatedMockClient } from '@/test-utils/supabase-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

const mockRequest = new NextRequest('http://localhost:3000/api/organizations/org-123');

describe('GET /api/organizations/[id] - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthenticated user', async () => {
    const mockClient = createUnauthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockClient.auth.getUser).toHaveBeenCalled();
  });

  it('should return 503 when Supabase client is unavailable', async () => {
    __setMockSupabaseClient(null);

    const response = await GET(mockRequest, { params: Promise.resolve({ id: 'org-123' }) });
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Service unavailable');
  });
});
