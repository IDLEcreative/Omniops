import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gdpr/export/route';

jest.mock('@/lib/supabase-server');

import { createServiceRoleClient } from '@/lib/supabase-server';

const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>;

const createRequest = (body: any) =>
  new NextRequest('http://localhost:3000/api/gdpr/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const createMockSupabase = (conversations: any[] | null, error: any = null) => ({
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: conversations, error }),
  })),
});

describe('POST /api/gdpr/export', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects request without session_id or email', async () => {
    const response = await POST(createRequest({
      domain: 'example.com',
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Either session_id or email is required');
  });

  it('rejects request with invalid email format', async () => {
    const response = await POST(createRequest({
      domain: 'example.com',
      email: 'not-an-email',
    }));

    expect(response.status).toBe(400);
  });

  it('exports conversations by session_id', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        created_at: '2025-10-20T10:00:00Z',
        messages: [
          { role: 'user', content: 'Hello', created_at: '2025-10-20T10:00:01Z' },
          { role: 'assistant', content: 'Hi there!', created_at: '2025-10-20T10:00:02Z' },
        ],
      },
      {
        id: 'conv-2',
        created_at: '2025-10-20T11:00:00Z',
        messages: [
          { role: 'user', content: 'Help', created_at: '2025-10-20T11:00:01Z' },
        ],
      },
    ];

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(function (this: any) {
          Promise.resolve().then(() => {
            this._resolve({ data: mockConversations, error: null });
          });
          return {
            then: (resolve: any) => {
              this._resolve = resolve;
              return Promise.resolve({ data: mockConversations, error: null });
            },
          };
        }),
      })),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
    }));

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.domain).toBe('example.com');
    expect(body.user_identifier).toBe('session-123');
    expect(body.conversations).toHaveLength(2);
    expect(body.metadata.total_conversations).toBe(2);
    expect(body.metadata.total_messages).toBe(3);
    expect(response.headers.get('Content-Disposition')).toContain('attachment');
    expect(response.headers.get('Content-Disposition')).toContain('chat-export-');
  });

  it('exports conversations by email', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        created_at: '2025-10-20T10:00:00Z',
        messages: [],
      },
    ];

    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(function (this: any) {
          Promise.resolve().then(() => {
            this._resolve({ data: mockConversations, error: null });
          });
          return {
            then: (resolve: any) => {
              this._resolve = resolve;
              return Promise.resolve({ data: mockConversations, error: null });
            },
          };
        }),
      })),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      email: 'user@example.com',
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user_identifier).toBe('user@example.com');
  });

  it('returns 503 when database is unavailable', async () => {
    mockCreateServiceRoleClient.mockResolvedValue(null as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
    }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Database connection unavailable');
  });

  it('returns empty export when no conversations found', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(function (this: any) {
          return {
            then: () => Promise.resolve({ data: [], error: null }),
          };
        }),
      })),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'nonexistent-session',
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.conversations).toEqual([]);
    expect(body.metadata.total_conversations).toBe(0);
    expect(body.metadata.total_messages).toBe(0);
  });

  it('handles database query errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn(function (this: any) {
          return {
            then: () => Promise.resolve({ data: null, error: new Error('Database error') }),
          };
        }),
      })),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
    }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to export data');
  });
});
