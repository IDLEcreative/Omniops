/**
 * Organizations API Tests using Global Supabase Mock
 * CRITICAL: Multi-tenant core - must prevent unauthorized access
 *
 * This version uses the global Supabase module mock from jest.config.js.
 * The global mock intercepts @supabase/supabase-js at the module level,
 * which prevents MSW from working but allows us to test with Next.js 15's
 * async cookies() function.
 *
 * @jest-environment node
 */

import { describe, it, expect } from '@jest/globals';
import { GET, POST } from '@/app/api/organizations/route';
import { server } from '@/__tests__/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Organizations API (Global Mock)', () => {
  describe('GET /api/organizations', () => {
    it('should return organizations for authenticated user', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organizations).toBeDefined();
      expect(Array.isArray(data.organizations)).toBe(true);
    });

    it('should return 401 for unauthenticated users', async () => {
      // Note: MSW doesn't work with the global Supabase module mock
      // Instead, directly manipulate the mock's return value
      const { _mockSupabaseClient } = require('@supabase/supabase-js');
      const originalGetUser = _mockSupabaseClient.auth.getUser;

      // Temporarily make getUser return null user
      _mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Unauthorized')
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      // Restore original mock
      _mockSupabaseClient.auth.getUser = originalGetUser;
    });

    it('should include organization details and role', async () => {
      // Global mock now returns realistic data for organization_members
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organizations.length).toBeGreaterThan(0);

      const org = data.organizations[0];
      expect(org).toHaveProperty('id');
      expect(org).toHaveProperty('name');
      expect(org).toHaveProperty('slug');
      expect(org).toHaveProperty('user_role');
      expect(org.user_role).toBe('owner');
    });

    it('should handle database errors gracefully', async () => {
      // Override to return database error
      server.use(
        http.get('*/rest/v1/organization_members', () => {
          return HttpResponse.json(
            { message: 'Database error' },
            { status: 500 }
          )
        })
      );

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch organizations');
    });
  });

  describe('POST /api/organizations', () => {
    it('should create organization with valid data', async () => {
      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Test Organization',
          slug: 'new-test-org'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.organization).toBeDefined();
      expect(data.organization.name).toBe('New Test Organization');
      expect(data.organization.slug).toBe('new-test-org');
      expect(data.organization.user_role).toBe('owner');
      expect(data.organization.member_count).toBe(1);
    });

    it('should validate name minimum length', async () => {
      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'A' // Too short
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
      expect(data.details).toBeDefined();
    });

    it('should validate slug format', async () => {
      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Valid Name',
          slug: 'Invalid_Slug!' // Contains invalid characters
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid request');
    });

    it('should auto-generate slug from name if not provided', async () => {
      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Auto Slug Test'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.organization.slug).toMatch(/^auto-slug-test$/);
    });

    it('should reject duplicate slugs', async () => {
      // Override to return existing organization with slug
      server.use(
        http.get('*/rest/v1/organizations*', ({ request }) => {
          const url = new URL(request.url);
          if (url.searchParams.get('slug') === 'eq.existing-slug') {
            return HttpResponse.json([{ slug: 'existing-slug' }])
          }
          return HttpResponse.json([])
        })
      );

      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test',
          slug: 'existing-slug'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('Organization slug already exists');
    });

    it('should return 401 for unauthenticated users', async () => {
      const { _mockSupabaseClient } = require('@supabase/supabase-js');

      // Temporarily make getUser return null user
      _mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error('Unauthorized')
      });

      const request = new Request('http://localhost:3000/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Org' })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });
});
