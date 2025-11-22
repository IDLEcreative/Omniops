import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/gdpr/delete/route';


import { createServiceRoleClient } from '@/lib/supabase-server';

const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>;

const createRequest = (body: any) =>
  new NextRequest('http://localhost:3000/api/gdpr/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/gdpr/delete', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects request without confirmation', async () => {
    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
      confirm: false,
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Deletion must be confirmed');
  });

  it('rejects request without session_id or email', async () => {
    const response = await POST(createRequest({
      domain: 'example.com',
      confirm: true,
    }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Either session_id or email is required');
  });

  it('rejects request with invalid email format', async () => {
    const response = await POST(createRequest({
      domain: 'example.com',
      email: 'not-an-email',
      confirm: true,
    }));

    expect(response.status).toBe(400);
  });

  it('deletes conversations by session_id with confirmation', async () => {
    const mockConversations = [
      { id: 'conv-1' },
      { id: 'conv-2' },
    ];

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: mockConversations, error: null })),
            })),
            delete: jest.fn(() => ({
              in: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }
        if (table === 'chat_telemetry') {
          return {
            delete: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
              in: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }
        if (table === 'gdpr_audit_log') {
          return {
            insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
          };
        }
        return {};
      }),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
      confirm: true,
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('Data successfully deleted');
    expect(body.deleted_count).toBe(2);
  });

  it('deletes conversations by email with confirmation', async () => {
    const mockConversations = [
      { id: 'conv-1' },
    ];

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: mockConversations, error: null })),
            })),
            delete: jest.fn(() => ({
              in: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }
        if (table === 'chat_telemetry') {
          return {
            delete: jest.fn(() => ({
              in: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }
        if (table === 'purchase_attributions') {
          return {
            delete: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
            })),
          };
        }
        if (table === 'gdpr_audit_log') {
          return {
            insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
          };
        }
        return {};
      }),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      email: 'user@example.com',
      confirm: true,
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.deleted_count).toBe(1);
  });

  it('returns 503 when database is unavailable', async () => {
    mockCreateServiceRoleClient.mockResolvedValue(null as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
      confirm: true,
    }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Database connection unavailable');
  });

  it('returns success with zero deletions when no data found', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        if (table === 'gdpr_audit_log') {
          return {
            insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
          };
        }
        return {};
      }),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'nonexistent-session',
      confirm: true,
    }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe('No data found to delete');
    expect(body.deleted_count).toBe(0);
  });

  it('handles database fetch errors gracefully', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: null, error: new Error('Fetch failed') })),
            })),
          };
        }
        return {};
      }),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
      confirm: true,
    }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to delete data');
  });

  it('handles database deletion errors gracefully', async () => {
    const mockConversations = [{ id: 'conv-1' }];

    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn(() => ({
              eq: jest.fn(() => Promise.resolve({ data: mockConversations, error: null })),
            })),
            delete: jest.fn(() => ({
              in: jest.fn(() => Promise.resolve({ data: null, error: new Error('Delete failed') })),
            })),
          };
        }
        return {};
      }),
    };

    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
      confirm: true,
    }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to delete data');
  });

  it('prevents deletion without explicit confirmation even if confirm field exists', async () => {
    const response = await POST(createRequest({
      domain: 'example.com',
      session_id: 'session-123',
      confirm: 'true', // String instead of boolean should fail validation
    }));

    expect(response.status).toBe(400);
  });
});
