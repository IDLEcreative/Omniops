/**
 * Shared test setup for hybrid-search tests
 */

export const mockSupabase = {
  rpc: jest.fn(),
  from: jest.fn()
};

export function setupMocks() {
  jest.clearAllMocks();
  return mockSupabase;
}

export const sampleFtsResults = [
  {
    conversation_id: 'conv-1',
    message_id: 'msg-1',
    content: 'Order status inquiry',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    relevance_score: 0.9,
    highlight: '<mark>Order status</mark> inquiry'
  },
  {
    conversation_id: 'conv-2',
    message_id: 'msg-2',
    content: 'Product shipping delay',
    role: 'user',
    created_at: '2024-01-02T00:00:00Z',
    relevance_score: 0.7,
    highlight: 'Product <mark>shipping</mark> delay'
  }
];

export const sampleSemanticResults = [
  {
    message_id: 'msg-1',
    embedding: new Array(1536).fill(0.1),
    messages: {
      id: 'msg-1',
      content: 'Order status inquiry',
      role: 'user',
      created_at: '2024-01-01T00:00:00Z',
      conversation_id: 'conv-1'
    }
  },
  {
    message_id: 'msg-3',
    embedding: new Array(1536).fill(0.2),
    messages: {
      id: 'msg-3',
      content: 'Delivery tracking question',
      role: 'user',
      created_at: '2024-01-03T00:00:00Z',
      conversation_id: 'conv-3'
    }
  }
];
