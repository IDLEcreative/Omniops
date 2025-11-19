/**
 * Auth Me API Tests
 *
 * Tests for /api/auth/me endpoint
 * Coverage: GET (authenticated user, with/without organization, error scenarios)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/auth/me/route';
import * as supabaseServer from '@/lib/supabase-server';

// Mock dependencies
jest.mock('@/lib/supabase-server');

describe('/api/auth/me', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client with auth
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
      single: jest.fn(),
    };

    (supabaseServer.createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET - Authenticated user without organization', () => {
    it('should return user data when authenticated', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {
          name: 'John Doe',
        },
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null, // No organization membership
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        created_at: '2024-01-01T00:00:00Z',
      });
      expect(data.organization).toBeNull();
    });

    it('should use full_name from metadata if name not available', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'user2@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {
          full_name: 'Jane Smith',
        },
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const response = await GET();
      const data = await response.json();

      expect(data.user.name).toBe('Jane Smith');
    });

    it('should return null name if no metadata available', async () => {
      const mockUser = {
        id: 'user-789',
        email: 'user3@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({ data: null, error: null });

      const response = await GET();
      const data = await response.json();

      expect(data.user.name).toBeNull();
    });
  });

  describe('GET - Authenticated user with organization', () => {
    it('should return user with organization data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: { name: 'John Doe' },
      };

      const mockMembership = {
        id: 'member-123',
        organization_id: 'org-123',
        role: 'admin',
        joined_at: '2024-01-15T00:00:00Z',
      };

      const mockOrganization = {
        id: 'org-123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        plan_type: 'premium',
        seat_limit: 10,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockMembership,
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: mockOrganization,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user.id).toBe('user-123');
      expect(data.organization).toEqual({
        id: 'org-123',
        name: 'Acme Corp',
        slug: 'acme-corp',
        role: 'admin',
        plan_type: 'premium',
        seat_limit: 10,
        joined_at: '2024-01-15T00:00:00Z',
      });
    });

    it('should handle different user roles correctly', async () => {
      const mockUser = {
        id: 'user-456',
        email: 'owner@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
      };

      const mockMembership = {
        id: 'member-456',
        organization_id: 'org-456',
        role: 'owner',
        joined_at: '2024-01-01T00:00:00Z',
      };

      const mockOrganization = {
        id: 'org-456',
        name: 'Test Org',
        slug: 'test-org',
        plan_type: 'free',
        seat_limit: 5,
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockMembership,
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: mockOrganization,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(data.organization.role).toBe('owner');
    });
  });

  describe('GET - Unauthenticated', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });

    it('should return 401 when auth error occurs', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Session expired' },
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET - Database errors', () => {
    it('should return 500 when Supabase client creation fails', async () => {
      (supabaseServer.createClient as jest.Mock).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to initialize');
    });

    it('should handle membership query errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const response = await GET();
      const data = await response.json();

      // Should still return user data even if membership fetch fails
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.organization).toBeNull();
    });

    it('should handle organization query errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
      };

      const mockMembership = {
        id: 'member-123',
        organization_id: 'org-123',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockMembership,
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Organization not found' },
      });

      const response = await GET();
      const data = await response.json();

      // Should still return user data even if organization fetch fails
      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.organization).toBeNull();
    });
  });

  describe('GET - Edge cases', () => {
    it('should handle user with membership but no organization', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        created_at: '2024-01-01T00:00:00Z',
        user_metadata: {},
      };

      const mockMembership = {
        id: 'member-123',
        organization_id: 'nonexistent-org',
        role: 'member',
        joined_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockMembership,
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.organization).toBeNull();
    });

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Internal server error');
    });
  });
});
