import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GET, OPTIONS } from '@/app/api/conversations/[conversationId]/messages/route';
import {
  createSupabaseMock,
  createSupabaseMockWithMessagesError,
  makeConversationMessagesRequest,
  createMockConversation,
  createMockMessage,
  createMockMessages
} from '../../../__tests__/utils/api/supabase-test-helpers';
import { NextRequest } from 'next/server';

describe('GET /api/conversations/[conversationId]/messages', () => {
  let mockCreateServiceRoleClient: jest.Mock;

  beforeEach(() => {
    jest.resetAllMocks();
    const supabaseModule = jest.requireMock('@/lib/supabase-server');
    mockCreateServiceRoleClient = supabaseModule.createServiceRoleClient;
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      const messages = [createMockMessage('msg-1', 'user', 'Hello')];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should handle OPTIONS preflight request', async () => {
      const request = new NextRequest('http://localhost:3000/api/conversations/conv-1/messages', {
        method: 'OPTIONS',
        headers: { origin: 'https://example.com' },
      });

      const response = await OPTIONS(request);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://example.com');
    });
  });

  describe('Valid Conversation', () => {
    it('should return messages for valid conversation', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      const messages = createMockMessages(2);

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(true);
      expect(payload.messages).toHaveLength(2);
      expect(payload.count).toBe(2);
    });

    it('should return empty array for conversation with no messages', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(true);
      expect(payload.messages).toEqual([]);
      expect(payload.count).toBe(0);
    });

    it('should work without session_id parameter', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      const messages = [createMockMessage('msg-1', 'user', 'Hello')];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeConversationMessagesRequest('conv-1');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.success).toBe(true);
    });
  });

  describe('Session ID Validation', () => {
    it('should reject request with mismatched session_id', async () => {
      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(null, []));

      const request = makeConversationMessagesRequest('conv-1', 'wrong-session');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();

      expect(payload.success).toBe(false);
      expect(payload.messages).toEqual([]);
    });

    it('should return empty messages for non-existent conversation', async () => {
      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(null, []));

      const request = makeConversationMessagesRequest('non-existent-conv', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'non-existent-conv' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.success).toBe(false);
    });
  });

  describe('Query Parameters', () => {
    it('should respect limit parameter', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      const messages = createMockMessages(2);

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123', 10);
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(200);
      const payload = await response.json();
      expect(payload.messages).toHaveLength(2);
    });

    it('should reject limit above 100', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123', 150);
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500);
    });

    it('should reject negative limit', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, []));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123', -5);
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500);
    });
  });

  describe('Error Handling', () => {
    it('should handle Supabase service unavailable', async () => {
      mockCreateServiceRoleClient.mockResolvedValue(null);

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(503);
      const payload = await response.json();
      expect(payload.error).toBe('Service temporarily unavailable');
    });

    it('should handle database errors when fetching messages', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      const mockClient = createSupabaseMockWithMessagesError(conversation, 'Database error');

      mockCreateServiceRoleClient.mockResolvedValue(mockClient);

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500);
      const payload = await response.json();
      expect(payload.error).toBe('Failed to retrieve messages');
    });

    it('should handle unexpected errors gracefully', async () => {
      mockCreateServiceRoleClient.mockRejectedValue(new Error('Unexpected error'));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      expect(response.status).toBe(500);
      const payload = await response.json();
      expect(payload.error).toBe('An unexpected error occurred');
    });
  });

  describe('Response Format', () => {
    it('should include all required fields in response', async () => {
      const conversation = createMockConversation('conv-1', 'sess-123');
      const messages = [createMockMessage('msg-1', 'user', 'Test')];

      mockCreateServiceRoleClient.mockResolvedValue(createSupabaseMock(conversation, messages));

      const request = makeConversationMessagesRequest('conv-1', 'sess-123');
      const response = await GET(request, { params: Promise.resolve({ conversationId: 'conv-1' }) });

      const payload = await response.json();

      expect(payload).toHaveProperty('success');
      expect(payload).toHaveProperty('conversation');
      expect(payload).toHaveProperty('messages');
      expect(payload).toHaveProperty('count');
      expect(payload.conversation).toHaveProperty('id');
      expect(payload.messages[0]).toHaveProperty('id');
      expect(payload.messages[0]).toHaveProperty('role');
      expect(payload.messages[0]).toHaveProperty('content');
    });
  });
});
