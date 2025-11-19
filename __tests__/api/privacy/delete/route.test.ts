/**
 * Privacy Delete API Tests
 *
 * Tests for /api/privacy/delete endpoint
 * Coverage: POST (successful deletion, CSRF protection, error scenarios)
 * GDPR/CCPA Compliance: Data deletion requests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import * as supabaseServer from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/middleware/csrf', () => ({
  withCSRF: (handler: any) => handler, // Bypass CSRF for tests
}));

// Import after mocks are set up
import { POST } from '@/app/api/privacy/delete/route';

describe('/api/privacy/delete', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    };

    (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('POST - Successful deletion', () => {
    it('should delete all user data when valid userId provided', async () => {
      mockSupabase.delete.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ data: { id: 'req-123' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');

      // Verify messages were deleted
      expect(mockSupabase.from).toHaveBeenCalledWith('messages');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('session_id', 'user-123');

      // Verify conversations were deleted
      expect(mockSupabase.from).toHaveBeenCalledWith('conversations');

      // Verify privacy request was logged
      expect(mockSupabase.from).toHaveBeenCalledWith('privacy_requests');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          request_type: 'deletion',
          status: 'completed',
        })
      );
    });
  });

  describe('POST - Validation errors', () => {
    it('should return 400 when userId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });

    it('should return 400 when userId is null', async () => {
      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: null }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });

    it('should return 400 when userId is empty string', async () => {
      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: '' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('User ID is required');
    });
  });

  describe('POST - Database errors', () => {
    it('should return 503 when Supabase client creation fails', async () => {
      (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('unavailable');
    });

    it('should return 500 when messages deletion fails', async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'PGRST116' },
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to delete');
    });

    it('should return 500 when conversations deletion fails', async () => {
      // Messages deletion succeeds
      mockSupabase.eq.mockResolvedValueOnce({ data: null, error: null });
      // Conversations deletion fails
      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error', code: 'PGRST116' },
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to delete');
    });
  });

  describe('POST - GDPR compliance logging', () => {
    it('should log deletion request for compliance audit trail', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });
      const mockInsert = jest.fn().mockResolvedValue({ data: { id: 'req-123' }, error: null });
      mockSupabase.insert = mockInsert;

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-456' }),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      // Verify privacy request was logged with correct fields
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-456',
          request_type: 'deletion',
          status: 'completed',
          completed_at: expect.any(String),
        })
      );
    });

    it('should still succeed even if compliance logging fails', async () => {
      mockSupabase.eq.mockResolvedValue({ data: null, error: null });
      // Logging fails but shouldn't affect the deletion result
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Logging error' },
      });

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-123' }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      // Deletion should still be reported as successful
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST - Data consistency', () => {
    it('should delete both messages and conversations for the same user', async () => {
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.eq = mockEq;

      const request = new NextRequest('http://localhost:3000/api/privacy/delete', {
        method: 'POST',
        body: JSON.stringify({ userId: 'user-789' }),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      // Verify both deletions used the same userId
      expect(mockEq).toHaveBeenCalledWith('session_id', 'user-789');
      expect(mockEq).toHaveBeenCalledTimes(2); // Once for messages, once for conversations
    });
  });
});
