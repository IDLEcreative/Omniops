import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gdpr/export/route';
import { createServiceRoleClient } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const createSupabaseMock = (conversations: unknown[] = []) => {
  const conversationBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: conversations, error: null }),
  };

  const auditBuilder = {
    insert: jest.fn().mockResolvedValue({ error: null }),
  };

  return {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        return conversationBuilder;
      }
      if (table === 'gdpr_audit_log') {
        return auditBuilder;
      }
      return conversationBuilder;
    }),
  };
};

const makeRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/gdpr/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-actor': 'jest-test' },
    body: JSON.stringify(body),
  });

describe('POST /api/gdpr/export', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('requires session_id or email', async () => {
    (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock());

    const response = await POST(makeRequest({ domain: 'acme.com' }));
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Either session_id or email is required');
  });

  it('exports conversations successfully', async () => {
    const conversations = [
      {
        id: 'conv-1',
        created_at: '2025-01-01T00:00:00Z',
        messages: [
          { role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
        ],
      },
    ];

    (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(conversations));

    const response = await POST(
      makeRequest({ session_id: 'sess-123', domain: 'acme.com' }),
    );
    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(payload.conversations).toHaveLength(1);
    expect(payload.metadata.total_conversations).toBe(1);
    expect(response.headers.get('Content-Disposition')).toContain('chat-export');
  });
});
