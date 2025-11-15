/**
 * Shared test helpers for conversation search tests
 */

// Create a single shared mock instance
export const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn(),
  auth: {
    getUser: jest.fn()
  }
};

export function createMockSupabase() {
  return mockSupabase;
}

export function createMockRPCResponse(data: any[], count?: number) {
  return {
    data,
    error: null,
    count: count ?? data.length
  };
}

export function createMockFromResponse(data: any[]) {
  return {
    select: jest.fn().mockReturnValue({
      in: jest.fn().mockResolvedValue({
        data,
        error: null
      })
    })
  };
}

export function createMockMessage(overrides: Partial<any> = {}) {
  return {
    conversation_id: 'conv-1',
    message_id: 'msg-1',
    content: 'Test message content',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    sentiment: 'positive',
    relevance_score: 0.9,
    highlight: '<mark>Test</mark> message content',
    ...overrides
  };
}

export function createMockConversationDetails(overrides: Partial<any> = {}) {
  return {
    id: 'conv-1',
    customer_email: 'test@example.com',
    domain_id: 'domain-1',
    domains: { name: 'example.com' },
    ...overrides
  };
}
