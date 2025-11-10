import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/dashboard/telemetry/route';

jest.mock('@/lib/chat-telemetry');

import { createServiceRoleClient } from '@/lib/supabase-server';
import { telemetryManager } from '@/lib/chat-telemetry';

const mockCreateServiceRoleClient = createServiceRoleClient as jest.MockedFunction<typeof createServiceRoleClient>;
const mockGetAllMetrics = telemetryManager.getAllMetrics as jest.MockedFunction<typeof telemetryManager.getAllMetrics>;

type QueryResult<T> = { data: T; error: null };

const createQueryChain = <T>(result: QueryResult<T>) => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue(result),
    limit: jest.fn().mockReturnThis(),
  };
  return chain;
};

const createSupabaseMock = ({
  baseRollups,
  rawTelemetry,
  domainRollups,
  modelRollups,
}: {
  baseRollups: QueryResult<any[]>;
  rawTelemetry: QueryResult<any[]>;
  domainRollups: QueryResult<any[]>;
  modelRollups: QueryResult<any[]>;
}) => {
  const from = jest.fn((table: string) => {
    switch (table) {
      case 'chat_telemetry_rollups':
        return createQueryChain(baseRollups);
      case 'chat_telemetry':
        return createQueryChain(rawTelemetry);
      case 'chat_telemetry_domain_rollups':
        return createQueryChain(domainRollups);
      case 'chat_telemetry_model_rollups':
        return createQueryChain(modelRollups);
      default:
        return createQueryChain({ data: [], error: null });
    }
  });

  return { from };
};

const createRequest = (query: string) =>
  new NextRequest(`http://localhost:3000/api/dashboard/telemetry${query}`);

describe('GET /api/dashboard/telemetry', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockGetAllMetrics.mockReturnValue({
      summary: { totalCostUSD: 0.123456 },
      sessions: [
        { sessionId: 'sess-1', uptime: 12_000, estimatedCost: 0.00123, model: 'gpt-5-mini' },
      ],
    });
  });

  it('responds with aggregated rollup metrics when rollups are available', async () => {
    const now = new Date();
    const baseRollups = {
      data: [
        {
          bucket_start: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          bucket_end: now.toISOString(),
          total_requests: 10,
          success_count: 9,
          failure_count: 1,
          total_input_tokens: 4000,
          total_output_tokens: 1000,
          total_cost_usd: '1.2345',
          avg_duration_ms: 1200,
          avg_searches: '1.5',
          avg_iterations: '2.0',
        },
      ],
      error: null,
    };

    const domainRollups = {
      data: [
        {
          bucket_start: baseRollups.data[0].bucket_start,
          bucket_end: baseRollups.data[0].bucket_end,
          domain: 'acme.com',
          total_requests: 6,
          success_count: 5,
          failure_count: 1,
          total_input_tokens: 2500,
          total_output_tokens: 600,
          total_cost_usd: '0.6543',
          avg_duration_ms: 1100,
          avg_searches: '1.2',
          avg_iterations: '1.8',
        },
      ],
      error: null,
    };

    const modelRollups = {
      data: [
        {
          bucket_start: baseRollups.data[0].bucket_start,
          bucket_end: baseRollups.data[0].bucket_end,
          domain: 'acme.com',
          model: 'gpt-5-mini',
          total_requests: 7,
          success_count: 7,
          failure_count: 0,
          total_input_tokens: 2700,
          total_output_tokens: 700,
          total_cost_usd: '0.789',
          avg_duration_ms: 1000,
          avg_searches: '1',
          avg_iterations: '1.5',
        },
      ],
      error: null,
    };

    const rawTelemetry = {
      data: [
        {
          created_at: now.toISOString(),
          success: true,
          cost_usd: 0.123,
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
          duration_ms: 800,
          iterations: 1,
          search_count: 1,
          model: 'gpt-5-mini',
          domain: 'acme.com',
        },
      ],
      error: null,
    };

    const supabaseMock = createSupabaseMock({
      baseRollups,
      rawTelemetry,
      domainRollups,
      modelRollups,
    });

    mockCreateServiceRoleClient.mockResolvedValue(supabaseMock);

    const response = await GET(createRequest('?days=1'));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.overview.totalRequests).toBe(10);
    expect(body.overview.successfulRequests).toBe(9);
    expect(body.tokens.totalInput).toBe(4000);
    expect(body.tokens.totalOutput).toBe(1000);
    expect(body.cost.total).toBe('1.2345');
    expect(body.domainBreakdown).toEqual([
      { domain: 'acme.com', requests: 6, cost: '0.6543' },
    ]);
    expect(body.modelUsage).toEqual([
      {
        model: 'gpt-5-mini',
        count: 7,
        cost: '0.7890',
        tokens: 3400,
        percentage: 70,
      },
    ]);
    expect(body.health.rollupSource).toBe('rollup');
    expect(body.health.stale).toBe(false);
  });

  it('falls back to raw telemetry when rollup data is unavailable', async () => {
    const now = new Date();
    const supabaseMock = createSupabaseMock({
      baseRollups: { data: [], error: null },
      domainRollups: { data: [], error: null },
      modelRollups: { data: [], error: null },
      rawTelemetry: {
        data: [
          {
            created_at: now.toISOString(),
            success: false,
            cost_usd: 0.05,
            input_tokens: 200,
            output_tokens: 60,
            total_tokens: 260,
            duration_ms: 1500,
            iterations: 3,
            search_count: 2,
            model: 'gpt-4.1',
            domain: 'globex.com',
          },
        ],
        error: null,
      },
    });

    mockCreateServiceRoleClient.mockResolvedValue(supabaseMock);

    const response = await GET(createRequest('?days=1'));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.overview.totalRequests).toBe(1);
    expect(body.overview.failedRequests).toBe(1);
    expect(body.modelUsage[0].model).toBe('gpt-4.1');
    expect(body.domainBreakdown[0].domain).toBe('globex.com');
    expect(body.health.rollupSource).toBe('raw');
    expect(body.health.stale).toBe(true);
  });
});
