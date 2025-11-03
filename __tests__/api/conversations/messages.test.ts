import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, OPTIONS } from '@/app/api/conversations/[conversationId]/messages/route';

// Mock Supabase module
jest.mock('@/lib/supabase-server');

const createSupabaseMock = (conversation: unknown = null, messages: unknown[] = []) => {
  const conversationBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: conversation, error: conversation ? null : { message: 'Not found' } }),
  };

  const messagesBuilder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue({ data: messages, error: null }),
  };

  return {
    from: jest.fn((table: string) => {
      if (table === 'conversations') {
        return conversationBuilder;
      }
      if (table === 'messages') {
        return messagesBuilder;
      }
      return conversationBuilder;
    }),
  };
};

const makeRequest = (conversationId: string, sessionId?: string, limit?: number) => {
  const url = new URL(`http://localhost:3000/api/conversations/${conversationId}/messages`);
  if (sessionId) url.searchParams.set('session_id', sessionId);
  if (limit) url.searchParams.set('limit', limit.toString());

  return new NextRequest(url.toString(), {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
};

describe('GET /api/conversations/[conversationId]/messages', () => {
  let mockCreateServiceRoleClient: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();

    // Get the mocked module
    const supabaseModule = jest.requireMock('@/lib/supabase-server');
    mockCreateServiceRoleClient = supabaseModule.createServiceRoleClient;
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
      ];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });

    it('should handle OPTIONS preflight request', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'OPTIONS',
        headers: { origin: 'https://example.com' },
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });
  });

  describe('Valid Conversation', () => {
    it('should return messages for valid conversation', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi there!', created_at: '2025-01-01T00:01:00Z' },
      ];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(true);
      expect(payload.messages).toHaveLength(2);
      expect(payload.messages[0].id).toBe('msg-1');
      expect(payload.messages[1].id).toBe('msg-2');
      expect(payload.count).toBe(2);
      expect(payload.conversation).toEqual({
        id: 'conv-1',
        created_at: '2025-01-01T00:00:00Z',
      });
    });

    it('should return empty array for conversation with no messages', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };

      (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(true);
      expect(payload.messages).toEqual([]);
      expect(payload.count).toBe(0);
    });

    it('should work without session_id parameter', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
      ];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeRequest('conv-1'); // No session_id
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(true);
      expect(payload.messages).toHaveLength(1);
    });
  });

  describe('Session ID Validation', () => {
    it('should reject request with mismatched session_id', async () => {
      const conversation = null; // Mismatch returns null

      (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeRequest('conv-1', 'wrong-session');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200); // Returns 200 but with empty messages
      const payload = await response.json();

      expect(payload.success).toBe(false);
      expect(payload.messages).toEqual([]);
      expect(payload.conversation).toBeNull();
    });

    it('should return empty messages for non-existent conversation', async () => {
      (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(null, []));

      const request = makeRequest('non-existent-conv', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'non-existent-conv' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(false);
      expect(payload.messages).toEqual([]);
      expect(payload.conversation).toBeNull();
    });
  });

  describe('Query Parameters', () => {
    it('should respect limit parameter', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Hello', created_at: '2025-01-01T00:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Hi', created_at: '2025-01-01T00:01:00Z' },
      ];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeRequest('conv-1', 'sess-123', 10);
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(true);
      expect(payload.messages).toHaveLength(2);
    });

    it('should use default limit of 50', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };

      (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
    });

    it('should reject limit above 100', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };

      (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeRequest('conv-1', 'sess-123', 150);
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500); // Zod validation error
      const payload = await response.json();
      expect(payload.success).toBe(false);
    });

    it('should reject negative limit', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };

      (createServiceRoleClient as jest.Mock).mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeRequest('conv-1', 'sess-123', -5);
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500); // Zod validation error
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase service unavailable', async () => {
      mockCreateServiceRoleClient.mockResolvedValue(null);

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(503);
      const payload = await response.json();

      expect(payload.error).toBe('Service temporarily unavailable');
    });

    it('should handle database errors when fetching messages', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };

      const mockClient = createSupabaseMock(conversation, []);
      const messagesError = { message: 'Database error' };

      // Override messages query to return error
      mockClient.from = jest.fn((table: string) => {
        if (table === 'conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: conversation, error: null }),
          };
        }
        if (table === 'messages') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: null, error: messagesError }),
          };
        }
        return {};
      });

      mockCreateServiceRoleClient.mockResolvedValue(mockClient);

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500);
      const payload = await response.json();

      expect(payload.success).toBe(false);
      expect(payload.error).toBe('Failed to retrieve messages');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockCreateServiceRoleClient.mockRejectedValue(new Error('Unexpected error'));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500);
      const payload = await response.json();

      expect(payload.success).toBe(false);
      expect(payload.error).toBe('An unexpected error occurred');
    });
  });

  describe('Message Ordering', () => {
    it('should return messages in chronological order', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };
      const messages = [
        { id: 'msg-1', role: 'user', content: 'First', created_at: '2025-01-01T00:00:00Z' },
        { id: 'msg-2', role: 'assistant', content: 'Second', created_at: '2025-01-01T00:01:00Z' },
        { id: 'msg-3', role: 'user', content: 'Third', created_at: '2025-01-01T00:02:00Z' },
      ];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      const payload = await response.json();

      expect(payload.messages[0].content).toBe('First');
      expect(payload.messages[1].content).toBe('Second');
      expect(payload.messages[2].content).toBe('Third');
    });
  });

  describe('Response Format', () => {
    it('should include all required fields in response', async () => {
      const conversation = {
        id: 'conv-1',
        session_id: 'sess-123',
        created_at: '2025-01-01T00:00:00Z',
      };
      const messages = [
        { id: 'msg-1', role: 'user', content: 'Test', created_at: '2025-01-01T00:00:00Z' },
      ];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      const payload = await response.json();

      expect(payload).toHaveProperty('success');
      expect(payload).toHaveProperty('conversation');
      expect(payload).toHaveProperty('messages');
      expect(payload).toHaveProperty('count');

      expect(payload.conversation).toHaveProperty('id');
      expect(payload.conversation).toHaveProperty('created_at');

      expect(payload.messages[0]).toHaveProperty('id');
      expect(payload.messages[0]).toHaveProperty('role');
      expect(payload.messages[0]).toHaveProperty('content');
      expect(payload.messages[0]).toHaveProperty('created_at');
    });
  });
});
