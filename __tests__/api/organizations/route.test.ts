/**
 * Tests for Organizations API Routes
 * CRITICAL: Multi-tenant core - must prevent unauthorized access
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/organizations/route';
import { createClient } from '@/lib/supabase/server';
import { mockSupabaseClient, createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/organizations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('GET /api/organizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockClient = mockSupabaseClient({
      authError: new Error('Unauthorized'),
    });

    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database errors gracefully', async () => {
    const mockUser = createMockUser();

    const mockClient = mockSupabaseClient({
      user: mockUser,
      tables: {
        organization_members: {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        },
      },
    });

    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to fetch organizations');
  });
});

describe('POST /api/organizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if user is not authenticated', async () => {
    const mockClient = mockSupabaseClient({
      authError: new Error('Unauthorized'),
    });

    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Test Org' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate request body - name too short', async () => {
    const mockClient = mockSupabaseClient();
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'A' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should reject invalid slug format', async () => {
    const mockClient = mockSupabaseClient();
    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const request = buildRequest({
      name: 'Test Org',
      slug: 'Invalid_Slug!',
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should reject duplicate slugs', async () => {
    const mockUser = createMockUser();

    const mockClient = mockSupabaseClient({
      user: mockUser,
      tables: {
        organizations: {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { slug: 'test-org' },
                error: null,
              }),
            }),
          }),
        },
      },
    });

    (createClient as jest.Mock).mockResolvedValue(mockClient);

    const request = buildRequest({ name: 'Test Org', slug: 'test-org' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Organization slug already exists');
  });
});
