import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gdpr/delete/route';
import { createServiceRoleClient } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const mockSupabase = (conversationResult: unknown[] = []) => {
  return {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === 'conversations') {
        return {
          select: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockResolvedValue({
              data: conversationResult,
              error: null
            }),
          })),
          eq: jest.fn().mockResolvedValue({
            data: conversationResult,
            error: null
          }),
          delete: jest.fn().mockReturnValue({
            in: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === 'gdpr_audit_log') {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      };
    }),
  };
};

const buildRequest = (body: unknown) =>
  new NextRequest('http://localhost:3000/api/gdpr/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-actor': 'jest-test' },
    body: JSON.stringify(body),
  });

describe('POST /api/gdpr/delete', () => {
  // Increase timeout for all tests in this suite
  jest.setTimeout(20000);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('validates confirmation payload', async () => {
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase());

    const response = await POST(
      buildRequest({ session_id: 'sess-123', confirm: false, domain: 'acme.com' }),
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toEqual('Deletion must be confirmed');
  });

  it('deletes conversations when confirmation provided', async () => {
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase([{ id: 'conv-1' }]));

    const response = await POST(
      buildRequest({
        session_id: 'sess-123',
        domain: 'acme.com',
        confirm: true,
      }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.message).toEqual('Data successfully deleted');
  });

  it('returns message when no data found', async () => {
    (createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase([]));

    const response = await POST(
      buildRequest({ session_id: 'sess-123', confirm: true, domain: 'acme.com' }),
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.deleted_count).toBe(0);
  });
});
