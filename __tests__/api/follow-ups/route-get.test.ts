/**
 * GET /api/follow-ups tests
 *
 * Verifies analytics + summary responses, auth handling,
 * and validation for query params.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/follow-ups/route';
import * as authModule from '@/lib/middleware/auth';
import { getFollowUpAnalytics, getFollowUpSummary } from '@/lib/follow-ups';

jest.mock('@/lib/middleware/auth', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/follow-ups', () => ({
  getFollowUpAnalytics: jest.fn(),
  getFollowUpSummary: jest.fn(),
}));

const mockedRequireAuth = authModule.requireAuth as jest.Mock;

const createSingleQuery = (data: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error: null }),
});

describe('GET /api/follow-ups', () => {
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = { id: 'user-123', email: 'user@example.com' };
    mockSupabase = { from: jest.fn() };

    mockedRequireAuth.mockResolvedValue({
      user: mockUser,
      supabase: mockSupabase,
    });
  });

  const mockMembership = (organizationId: string | null) => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return createSingleQuery(organizationId ? { organization_id: organizationId } : null);
      }
      return {};
    });
  };

  it('returns follow-up summary by default', async () => {
    mockMembership('org-123');

    const mockSummary = {
      total_sent_today: 5,
      total_sent_this_week: 25,
      total_sent_this_month: 100,
      avg_response_rate: 45.5,
      most_effective_reason: 'cart_abandonment',
      least_effective_reason: 'low_satisfaction',
      pending_count: 10,
    };
    (getFollowUpSummary as jest.Mock).mockResolvedValue(mockSummary);

    const request = new NextRequest('http://localhost:3000/api/follow-ups');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockSummary);
    expect(getFollowUpSummary as jest.Mock).toHaveBeenCalled();
  });

  it('returns analytics when type=analytics', async () => {
    mockMembership('org-123');

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
    (getFollowUpAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

    const request = new NextRequest('http://localhost:3000/api/follow-ups?type=analytics&days=7');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(mockAnalytics);
    expect(getFollowUpAnalytics as jest.Mock).toHaveBeenCalledWith(expect.anything(), {
      days: 7,
      organizationId: 'org-123',
    });
  });

  it('returns 401 when auth fails', async () => {
    mockedRequireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    );

    const request = new NextRequest('http://localhost:3000/api/follow-ups');
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
  });

  it('returns 404 when user has no organization', async () => {
    mockMembership(null);

    const request = new NextRequest('http://localhost:3000/api/follow-ups');
    const response = await GET(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'No organization found' });
  });

  it('returns 400 for invalid type parameter', async () => {
    mockMembership('org-123');

    const request = new NextRequest('http://localhost:3000/api/follow-ups?type=invalid');
    const response = await GET(request);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid type parameter' });
  });

  it('parses custom days parameter', async () => {
    mockMembership('org-123');

    (getFollowUpAnalytics as jest.Mock).mockResolvedValue({ overall: {}, by_reason: {} });

    const request = new NextRequest('http://localhost:3000/api/follow-ups?type=analytics&days=14');
    await GET(request);

    expect(getFollowUpAnalytics as jest.Mock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ days: 14 })
    );
  });
});
