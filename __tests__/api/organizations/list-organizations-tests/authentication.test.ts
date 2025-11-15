/**
 * Authentication tests for GET /api/organizations
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET } from '@/app/api/organizations/route';
import { createUnauthenticatedMockClient } from '@/test-utils/supabase-test-helpers';

describe('GET /api/organizations - Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 for unauthenticated user', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    const mockClient = createUnauthenticatedMockClient();
    createClient.mockResolvedValue(mockClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
    expect(mockClient.auth.getUser).toHaveBeenCalled();
  });

  it('should return 503 when Supabase client is unavailable', async () => {
    const { createClient } = jest.requireMock('@/lib/supabase/server');
    createClient.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('Service unavailable');
  });
});
