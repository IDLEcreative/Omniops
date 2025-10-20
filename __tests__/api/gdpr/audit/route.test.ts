import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/gdpr/audit/route';
import { createServiceRoleClient } from '@/lib/supabase-server';

type AuditEntry = {
  id: string;
};

type MockBuilder = {
  select: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  eq: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  ilike: jest.Mock;
};

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

const buildSupabaseMock = (entries: AuditEntry[] = []) => {
  const builder: MockBuilder = {
    select: jest.fn(() => builder),
    order: jest.fn(() => builder),
    range: jest.fn(() => Promise.resolve({ data: entries, error: null, count: entries.length })),
    eq: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    ilike: jest.fn(() => builder),
  };

  return {
    from: jest.fn(() => builder),
    builder,
  };
};

describe('GET /api/gdpr/audit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns audit entries with defaults', async () => {
    const { from, builder } = buildSupabaseMock([{ id: 'audit-1' }]);
    (createServiceRoleClient as jest.Mock).mockResolvedValue({ from });

    const response = await GET(new NextRequest('http://localhost:3000/api/gdpr/audit'));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.entries).toHaveLength(1);
    expect(builder.range).toHaveBeenCalledWith(0, 99);
  });

  it('applies filters when provided', async () => {
    const { from, builder } = buildSupabaseMock([]);
    (createServiceRoleClient as jest.Mock).mockResolvedValue({ from });

    const url = new URL('http://localhost:3000/api/gdpr/audit');
    url.searchParams.set('request_type', 'delete');
    url.searchParams.set('limit', '25');
    url.searchParams.set('offset', '10');
    url.searchParams.set('start_date', '2025-01-01T00:00:00Z');
    url.searchParams.set('end_date', '2025-02-01T00:00:00Z');
    url.searchParams.set('actor', 'dashboard');

    const response = await GET(new NextRequest(url));
    expect(response.status).toBe(200);
    await response.json();

    expect(builder.eq).toHaveBeenCalledWith('request_type', 'delete');
    expect(builder.range).toHaveBeenCalledWith(10, 34);
    expect(builder.gte).toHaveBeenCalledWith('created_at', '2025-01-01T00:00:00Z');
    expect(builder.lte).toHaveBeenCalledWith('created_at', '2025-02-01T00:00:00Z');
    expect(builder.ilike).toHaveBeenCalledWith('actor', '%dashboard%');
  });
});
