/**
 * Tests for Follow-ups API Route
 *
 * Validates API endpoints for follow-up management:
 * - GET summary and analytics
 * - POST manual trigger
 * - Authentication and authorization
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '@/app/api/follow-ups/route';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/follow-ups', () => ({
  detectFollowUpCandidates: jest.fn(),
  prioritizeFollowUps: jest.fn(),
  scheduleFollowUps: jest.fn(),
  getFollowUpAnalytics: jest.fn(),
  getFollowUpSummary: jest.fn(),
}));

describe('/api/follow-ups', () => {
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock user
    mockUser = {
      id: 'user-123',
      email: 'user@example.com',
    };

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    // Setup default auth mock
    const authModule = jest.requireMock('@/lib/middleware/auth');
    authModule.requireAuth.mockResolvedValue({
      user: mockUser,
      supabase: mockSupabase,
    });

    // Setup default service client mock
    const supabaseModule = jest.requireMock('@/lib/supabase-server');
    supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase);
  });

  describe('GET /api/follow-ups', () => {
    it('should return follow-up summary by default', async () => {
      // Mock organization membership
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        return {};
      });

      // Mock follow-up summary
      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      const mockSummary = {
        total_sent_today: 5,
        total_sent_this_week: 25,
        total_sent_this_month: 100,
        avg_response_rate: 45.5,
        most_effective_reason: 'cart_abandonment',
        least_effective_reason: 'low_satisfaction',
        pending_count: 10,
      };
      followUpsModule.getFollowUpSummary.mockResolvedValue(mockSummary);

      const request = new NextRequest('http://localhost:3000/api/follow-ups');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSummary);
      expect(followUpsModule.getFollowUpSummary).toHaveBeenCalled();
    });

    it('should return analytics when type=analytics', async () => {
      // Mock organization membership
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        return {};
      });

      // Mock follow-up analytics
      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      const mockAnalytics = {
        overall: {
          total_sent: 100,
          response_rate: 45,
          avg_response_time_hours: 12,
          conversion_rate: 25,
          effectiveness_score: 65,
        },
        by_reason: {},
        by_channel: {},
        trend: [],
      };
      followUpsModule.getFollowUpAnalytics.mockResolvedValue(mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/follow-ups?type=analytics&days=7');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockAnalytics);
      expect(followUpsModule.getFollowUpAnalytics).toHaveBeenCalledWith(
        expect.anything(),
        {
          days: 7,
          organizationId: 'org-123',
        }
      );
    });

    it('should return 401 if not authenticated', async () => {
      const authModule = jest.requireMock('@/lib/middleware/auth');
      authModule.requireAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const request = new NextRequest('http://localhost:3000/api/follow-ups');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if user has no organization', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/follow-ups');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No organization found');
    });

    it('should return 400 for invalid type parameter', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/follow-ups?type=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid type parameter');
    });

    it('should handle service client creation failure', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        return {};
      });

      const supabaseModule = jest.requireMock('@/lib/supabase-server');
      supabaseModule.createServiceRoleClient.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow-ups');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch follow-ups');
    });

    it('should parse days parameter correctly', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        return {};
      });

      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.getFollowUpAnalytics.mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/follow-ups?type=analytics&days=14');
      await GET(request);

      expect(followUpsModule.getFollowUpAnalytics).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ days: 14 })
      );
    });
  });

  describe('POST /api/follow-ups', () => {
    it('should manually trigger follow-up detection and scheduling', async () => {
      // Mock organization membership and domains
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                { domain: 'example.com' },
                { domain: 'shop.example.com' },
              ],
              error: null,
            }),
          };
        }
        return {};
      });

      // Mock follow-up functions
      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      const mockCandidates = [
        {
          conversation_id: 'conv-1',
          session_id: 'session-1',
          reason: 'abandoned_conversation',
          priority: 'medium',
          metadata: {},
        },
        {
          conversation_id: 'conv-2',
          session_id: 'session-2',
          reason: 'cart_abandonment',
          priority: 'high',
          metadata: {},
        },
      ];

      followUpsModule.detectFollowUpCandidates.mockResolvedValue(mockCandidates);
      followUpsModule.prioritizeFollowUps.mockReturnValue(mockCandidates);
      followUpsModule.scheduleFollowUps.mockResolvedValue({
        scheduled: 2,
        skipped: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/follow-ups', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        candidates_found: 2,
        scheduled: 2,
        skipped: 0,
      });

      expect(followUpsModule.detectFollowUpCandidates).toHaveBeenCalledWith(
        expect.anything(),
        ['example.com', 'shop.example.com']
      );
      expect(followUpsModule.prioritizeFollowUps).toHaveBeenCalledWith(mockCandidates);
      expect(followUpsModule.scheduleFollowUps).toHaveBeenCalled();
    });

    it('should return 401 if not authenticated', async () => {
      const authModule = jest.requireMock('@/lib/middleware/auth');
      authModule.requireAuth.mockResolvedValue(
        NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      );

      const request = new NextRequest('http://localhost:3000/api/follow-ups', {
        method: 'POST',
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if no organization found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/follow-ups', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No organization found');
    });

    it('should return 404 if no domains found', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {};
      });

      const request = new NextRequest('http://localhost:3000/api/follow-ups', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No domains found');
    });

    it('should handle service client creation failure', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ domain: 'example.com' }],
              error: null,
            }),
          };
        }
        return {};
      });

      const supabaseModule = jest.requireMock('@/lib/supabase-server');
      supabaseModule.createServiceRoleClient.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/follow-ups', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to schedule follow-ups');
    });

    it('should handle errors in follow-up detection', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: 'org-123' },
              error: null,
            }),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [{ domain: 'example.com' }],
              error: null,
            }),
          };
        }
        return {};
      });

      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.detectFollowUpCandidates.mockRejectedValue(
        new Error('Detection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/follow-ups', {
        method: 'POST',
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to schedule follow-ups');
    });
  });
});