import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gdpr/delete/route';
import { createServiceRoleClient } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const mockSupabase = (conversationResult: unknown[] = []) => {
  const deleteChain = {
    delete: jest.fn().mockReturnThis(),
    in: jest.fn().mockResolvedValue({ error: null }),
  };

  const conversationsBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    delete: deleteChain.delete,
  };

  // Make the conversationsBuilder itself a thenable
  Object.assign(conversationsBuilder, {
    then: (resolve: (value: { data: unknown[]; error: null }) => void) => {
      return Promise.resolve({ data: conversationResult, error: null }).then(resolve);
    },
  });

  const auditBuilder = {
    insert: jest.fn().mockResolvedValue({ error: null }),
  };

  return {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        return conversationsBuilder;
      }
      if (table === 'gdpr_audit_log') {
        return auditBuilder;
      }
      return conversationsBuilder;
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
