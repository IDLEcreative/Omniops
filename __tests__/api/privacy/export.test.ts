/**
 * Tests for POST /api/privacy/export
 * Validates GDPR Article 20 (Right to Data Portability) implementation
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/privacy/export/route';
import { createClient } from '@/lib/supabase/server';
import * as dataExport from '@/lib/privacy/data-export';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/privacy/data-export');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockLogDataExport = dataExport.logDataExport as jest.MockedFunction<typeof dataExport.logDataExport>;
const mockFetchConversations = dataExport.fetchConversations as jest.MockedFunction<typeof dataExport.fetchConversations>;
const mockFetchMessages = dataExport.fetchMessages as jest.MockedFunction<typeof dataExport.fetchMessages>;

const createRequest = () =>
  new NextRequest('http://localhost:3000/api/privacy/export', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

describe('GET /api/privacy/export', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await GET(createRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 503 when database is unavailable', async () => {
    mockCreateClient.mockResolvedValue(null);

    const response = await GET(createRequest());

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Database unavailable');
  });

  it('exports all user data with conversations and messages', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockFetchConversations.mockResolvedValue([
      {
        id: 'conv-1',
        created_at: '2025-11-22T10:00:00Z',
        message_count: 5,
      },
    ]);
    mockFetchMessages.mockResolvedValue([
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        created_at: '2025-11-22T10:00:00Z',
        conversation_id: 'conv-1',
      },
    ]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user_id).toBe('user-123');
    expect(body.email).toBe('user@example.com');
    expect(body.conversations).toHaveLength(1);
    expect(body.messages).toHaveLength(1);
    expect(body.metadata.total_conversations).toBe(1);
    expect(body.metadata.total_messages).toBe(1);
  });

  it('logs export for compliance audit', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockFetchConversations.mockResolvedValue([]);
    mockFetchMessages.mockResolvedValue([]);
    mockLogDataExport.mockResolvedValue(undefined);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(mockLogDataExport).toHaveBeenCalledWith('user-123', expect.objectContaining({
      format: 'json',
    }));
  });

  it('returns download headers with proper filename', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockFetchConversations.mockResolvedValue([]);
    mockFetchMessages.mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toMatch(
      /^attachment; filename="omniops-data-export-\d+\.json"$/
    );
  });

  it('handles empty conversation list', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockFetchConversations.mockResolvedValue([]);
    mockFetchMessages.mockResolvedValue([]);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.conversations).toEqual([]);
    expect(body.messages).toEqual([]);
    expect(body.metadata.total_conversations).toBe(0);
  });

  it('handles database fetch errors', async () => {
    const mockUser = { id: 'user-123', email: 'user@example.com' };
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockFetchConversations.mockRejectedValue(new Error('Database error'));

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to export user data');
  });
});
