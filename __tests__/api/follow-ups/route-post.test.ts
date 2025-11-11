/**
 * POST /api/follow-ups tests
 *
 * Validates manual scheduling trigger, authentication,
 * domain/org lookups, and error propagation.
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/follow-ups/route';
import { createServiceRoleClient } from '@/lib/supabase-server';
import * as authModule from '@/lib/middleware/auth';
import {
  detectFollowUpCandidates,
  prioritizeFollowUps,
  scheduleFollowUps,
} from '@/lib/follow-ups';

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
}));

const authMock = jest.requireMock('@/lib/middleware/auth') as {
  requireAuth: jest.Mock;
};
const mockedServiceClient = createServiceRoleClient as jest.Mock;

const createSingleQuery = (data: any) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data, error: null }),
});

const createListQuery = (data: any[]) => ({
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockResolvedValue({ data, error: null }),
});

describe('POST /api/follow-ups', () => {
  let mockSupabase: any;
  let mockUser: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUser = { id: 'user-123', email: 'user@example.com' };
    mockSupabase = { from: jest.fn() };

    authMock.requireAuth.mockResolvedValue({
      user: mockUser,
      supabase: mockSupabase,
    });

    mockedServiceClient.mockResolvedValue(mockSupabase);
  });

  const mockOrgAndDomains = ({
    organizationId = 'org-123',
    domains = ['example.com'],
  }: {
    organizationId: string | null;
    domains?: string[];
  }) => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return createSingleQuery(
          organizationId ? { organization_id: organizationId } : null
        );
      }
      if (table === 'customer_configs') {
        return createListQuery(domains.map((domain) => ({ domain })));
      }
      return {};
    });
  };

  it('manually schedules follow-ups', async () => {
    mockOrgAndDomains({ organizationId: 'org-123', domains: ['example.com', 'shop.example.com'] });

    const mockCandidates = [
      { conversation_id: 'conv-1', session_id: 's1', reason: 'abandoned_conversation', priority: 'medium', metadata: {} },
      { conversation_id: 'conv-2', session_id: 's2', reason: 'cart_abandonment', priority: 'high', metadata: {} },
    ];

    (detectFollowUpCandidates as jest.Mock).mockResolvedValue(mockCandidates);
    (prioritizeFollowUps as jest.Mock).mockReturnValue(mockCandidates);
    (scheduleFollowUps as jest.Mock).mockResolvedValue({ scheduled: 2, skipped: 0 });

    const request = new NextRequest('http://localhost:3000/api/follow-ups', { method: 'POST' });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual({ candidates_found: 2, scheduled: 2, skipped: 0 });
    expect(detectFollowUpCandidates as jest.Mock).toHaveBeenCalledWith(
      expect.anything(),
      ['example.com', 'shop.example.com']
    );
    expect(prioritizeFollowUps as jest.Mock).toHaveBeenCalledWith(mockCandidates);
    expect(scheduleFollowUps as jest.Mock).toHaveBeenCalled();
  });

  it('returns 401 when auth fails', async () => {
    authMock.requireAuth.mockResolvedValueOnce(
      NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    );

    const request = new NextRequest('http://localhost:3000/api/follow-ups', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
  });

  it('returns 404 when no organization found', async () => {
    mockOrgAndDomains({ organizationId: null });

    const request = new NextRequest('http://localhost:3000/api/follow-ups', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'No organization found' });
  });

  it('returns 404 when no domains configured', async () => {
    mockOrgAndDomains({ organizationId: 'org-123', domains: [] });

    const request = new NextRequest('http://localhost:3000/api/follow-ups', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'No domains found' });
  });

  it('handles service client creation failures', async () => {
    mockOrgAndDomains({ organizationId: 'org-123', domains: ['example.com'] });
    mockedServiceClient.mockResolvedValueOnce(null);

    const request = new NextRequest('http://localhost:3000/api/follow-ups', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to schedule follow-ups' });
  });

  it('handles detection errors', async () => {
    mockOrgAndDomains({ organizationId: 'org-123', domains: ['example.com'] });
    (detectFollowUpCandidates as jest.Mock).mockRejectedValue(new Error('Detection failed'));

    const request = new NextRequest('http://localhost:3000/api/follow-ups', { method: 'POST' });
    const response = await POST(request);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Failed to schedule follow-ups' });
  });
});
