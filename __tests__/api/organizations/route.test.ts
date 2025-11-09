/**
 * Tests for Organizations API Routes
 * CRITICAL: Multi-tenant core - must prevent unauthorized access
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/organizations/route';
import {
  createAuthenticatedMockClient,
  createUnauthenticatedMockClient,
  createMockSupabaseClient,
} from '@/test-utils/supabase-test-helpers';
import { createMockOrganization, createMockUser } from '@/test-utils/api-test-helpers';
import { __setMockSupabaseClient } from '@/lib/supabase-server';

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
    const mockClient = createUnauthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should handle database errors gracefully', async () => {
    const mockUser = createMockUser();
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    // Override from() to return error for organization_members table
    mockClient.from = jest.fn((table: string) => {
      if (table === 'organization_members') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    });

    __setMockSupabaseClient(mockClient);

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
    const mockClient = createUnauthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ name: 'Test Org' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Unauthorized');
  });

  it('should validate request body - name too short', async () => {
    const mockClient = createAuthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ name: 'A' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid request');
  });

  it('should reject invalid slug format', async () => {
    const mockClient = createAuthenticatedMockClient();
    __setMockSupabaseClient(mockClient);

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
    const mockClient = createAuthenticatedMockClient(mockUser.id, mockUser.email);

    // Override from() to return existing slug for organizations table
    mockClient.from = jest.fn((table: string) => {
      if (table === 'organizations') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({
                data: { slug: 'test-org' },
                error: null,
              }),
            }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      };
    });

    __setMockSupabaseClient(mockClient);

    const request = buildRequest({ name: 'Test Org', slug: 'test-org' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe('Organization slug already exists');
  });
});
