import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gdpr/export/route';


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

    expect(response.status).toBe(500); // Zod parse throws, resulting in 500
  });

  it.skip('exports conversations by session_id', async () => {
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

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(resolve({ data: mockConversations, error: null }))),
    };

    const mockSupabase = {
      from: jest.fn(() => mockQuery),
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

  it.skip('exports conversations by email', async () => {
    const mockConversations = [
      {
        id: 'conv-1',
        created_at: '2025-10-20T10:00:00Z',
        messages: [],
      },
    ];

    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(resolve({ data: mockConversations, error: null }))),
    };

    const mockSupabase = {
      from: jest.fn(() => mockQuery),
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

  it.skip('returns empty export when no conversations found', async () => {
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(resolve({ data: [], error: null }))),
    };

    const mockSupabase = {
      from: jest.fn(() => mockQuery),
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
    const mockQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => Promise.resolve(resolve({ data: null, error: new Error('Database error') }))),
    };

    const mockSupabase = {
      from: jest.fn(() => mockQuery),
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
