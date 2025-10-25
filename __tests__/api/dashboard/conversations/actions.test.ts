/**
 * Tests for conversation actions API endpoint
 * Tests assign_human and close actions
 */

import { POST } from '@/app/api/dashboard/conversations/[id]/actions/route';
import { __setMockSupabaseClient, __resetMockSupabaseClient } from '@/lib/supabase-server';
import { NextRequest } from 'next/server';

describe('POST /api/dashboard/conversations/[id]/actions', () => {
  const conversationId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = 'user-123';
  const domainId = 'domain-456';
  const orgId = 'org-789';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/dashboard/conversations/test/actions', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const setupAuthenticatedMocks = () => {
    const userSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: userId } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'organization_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { organization_id: orgId },
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    const serviceSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'customer_configs') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn(),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }),
    };

    __setMockSupabaseClient(userSupabase as any);

    return { userSupabase, serviceSupabase };
  };

  describe('Validation', () => {
    it('should reject invalid conversation ID format', async () => {
      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: 'invalid-uuid' });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid conversation ID format');
    });

    it('should reject invalid action type', async () => {
      const request = createMockRequest({ action: 'invalid_action' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid request body');
    });
  });

  describe('Authentication', () => {
    it('should reject unauthenticated requests', async () => {
      mockCreateClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: null },
            error: new Error('Not authenticated'),
          }),
        },
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Unauthorized');
    });
  });

  describe('assign_human action', () => {
    it('should successfully assign conversation to human', async () => {
      const { userSupabase, serviceSupabase } = setupAuthenticatedMocks();

      // Mock conversation exists
      serviceSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: conversationId,
            domain_id: domainId,
            metadata: { status: 'active' },
          },
          error: null,
        })
        // Mock customer config check
        .mockResolvedValueOnce({
          data: { id: domainId },
          error: null,
        });

      // Mock update success
      serviceSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Conversation assigned to human agent');
      expect(data.data.conversationId).toBe(conversationId);
      expect(data.data.action).toBe('assign_human');
      expect(data.data.assignedAt).toBeDefined();
    });

    it('should update metadata with assigned_to_human flag', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: conversationId,
            domain_id: domainId,
            metadata: { customer: 'John' },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: domainId },
          error: null,
        });

      const updateMock = jest.fn().mockResolvedValue({ error: null });
      serviceSupabase.update.mockReturnValue({
        eq: updateMock,
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: conversationId });

      await POST(request, { params });

      expect(serviceSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            assigned_to_human: true,
            assigned_by: userId,
            status: 'waiting',
          }),
        })
      );
    });
  });

  describe('close action', () => {
    it('should successfully close conversation', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: conversationId,
            domain_id: domainId,
            metadata: { status: 'active' },
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: domainId },
          error: null,
        });

      serviceSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const request = createMockRequest({ action: 'close' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Conversation closed');
      expect(data.data.conversationId).toBe(conversationId);
      expect(data.data.action).toBe('close');
      expect(data.data.closedAt).toBeDefined();
    });

    it('should set ended_at and update metadata status', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: conversationId,
            domain_id: domainId,
            metadata: {},
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: domainId },
          error: null,
        });

      const updateMock = jest.fn().mockResolvedValue({ error: null });
      serviceSupabase.update.mockReturnValue({
        eq: updateMock,
      } as any);

      const request = createMockRequest({ action: 'close' });
      const params = Promise.resolve({ id: conversationId });

      await POST(request, { params });

      expect(serviceSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at: expect.any(String),
          metadata: expect.objectContaining({
            status: 'resolved',
            closed_by: userId,
          }),
        })
      );
    });
  });

  describe('Authorization', () => {
    it('should reject access to conversations from other organizations', async () => {
      const { userSupabase, serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: conversationId,
            domain_id: domainId,
            metadata: {},
          },
          error: null,
        })
        // Fail customer config check (different org)
        .mockResolvedValueOnce({
          data: null,
          error: new Error('Not found'),
        });

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Forbidden');
    });
  });

  describe('Error handling', () => {
    it('should handle conversation not found', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Conversation not found');
    });

    it('should handle database update failure', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.single
        .mockResolvedValueOnce({
          data: {
            id: conversationId,
            domain_id: domainId,
            metadata: {},
          },
          error: null,
        })
        .mockResolvedValueOnce({
          data: { id: domainId },
          error: null,
        });

      serviceSupabase.update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to assign');
    });
  });
});
