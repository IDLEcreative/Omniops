import { DashboardOverview } from '@/hooks/use-dashboard-overview';

export function createMockOverview(overrides?: Partial<DashboardOverview>): DashboardOverview {
  return {
    summary: {
      totalConversations: 42,
      conversationChange: 12,
      activeUsers: 15,
      activeUsersChange: 5,
      avgResponseTime: 1200,
      avgResponseTimeChange: -200,
      resolutionRate: 85,
      resolutionRateChange: 3,
      satisfactionScore: 4.5,
    },
    trend: [
      { date: '2025-10-18', conversations: 10, satisfactionScore: 4.2 },
      { date: '2025-10-19', conversations: 12, satisfactionScore: 4.5 },
    ],
    recentConversations: [
      {
        id: 'conv-1',
        createdAt: '2025-10-19T10:00:00Z',
        status: 'active',
        lastMessagePreview: 'How can I help?',
        lastMessageAt: '2025-10-19T10:05:00Z',
        customerName: 'Alice',
      },
    ],
    languageDistribution: [
      { language: 'en', percentage: 70, count: 35 },
      { language: 'es', percentage: 30, count: 15 },
    ],
    quickStats: {
      satisfaction: 4.5,
      avgResponseTime: 1200,
      conversationsToday: 8,
      successRate: 95,
      totalTokens: 50000,
      totalCostUSD: 2.5,
      avgSearchesPerRequest: 1.8,
    },
    telemetry: {
      totalRequests: 100,
      successfulRequests: 95,
      successRate: 95,
      avgSearchesPerRequest: 1.8,
      totalTokens: 50000,
      totalCostUSD: 2.5,
    },
    botStatus: {
      online: true,
      uptimePercent: 99.5,
      primaryModel: 'gpt-5-mini',
      lastTrainingAt: '2025-10-15T00:00:00Z',
    },
    ...overrides,
  };
}

export function createFetchResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);
}

export function createMalformedJsonResponse() {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.reject(new Error('Invalid JSON')),
  } as Response);
}

export function createAbortError() {
  const error = new Error('Aborted');
  error.name = 'AbortError';
  return error;
}

export function createDelayedFetchResponse(body: unknown) {
  let resolveResponse: (value: Response) => void;
  const promise = new Promise<Response>((resolve) => {
    resolveResponse = resolve;
  });

  return {
    promise,
    resolve: () => resolveResponse(createFetchResponse(body) as unknown as Response)
  };
}
