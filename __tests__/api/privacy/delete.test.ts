/**
 * Tests for POST /api/privacy/delete
 * Validates GDPR Article 17 (Right to be Forgotten) with 30-day cooling-off period
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/privacy/delete/route';
import { createClient } from '@/lib/supabase/server';
import * as accountDeletion from '@/lib/privacy/account-deletion';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/privacy/account-deletion');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateAccountDeletionRequest = accountDeletion.createAccountDeletionRequest as jest.MockedFunction<typeof accountDeletion.createAccountDeletionRequest>;
const mockGetPendingDeletionRequest = accountDeletion.getPendingDeletionRequest as jest.MockedFunction<typeof accountDeletion.getPendingDeletionRequest>;

const createRequest = (body: any) =>
  new NextRequest('http://localhost:3000/api/privacy/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/privacy/delete', () => {
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

    const response = await POST(createRequest({ password: 'test', confirm: true }));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when password is missing', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ confirm: true }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when confirm is not explicitly true', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ password: 'test', confirm: false }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid request');
  });

  it('returns 503 when database is unavailable', async () => {
    mockCreateClient.mockResolvedValue(null);

    const response = await POST(createRequest({ password: 'test', confirm: true }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Database unavailable');
  });

  it('returns 403 when password is invalid', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Invalid password'),
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue(null);

    const response = await POST(createRequest({ password: 'wrong', confirm: true }));

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Invalid password');
  });

  it('returns 409 when deletion already scheduled', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    mockGetPendingDeletionRequest.mockResolvedValue({
      user_id: 'user-123',
      scheduled_for: futureDate.toISOString(),
      ip_address: '127.0.0.1',
      status: 'pending',
    });

    const response = await POST(createRequest({ password: 'test', confirm: true }));

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.error).toBe('Deletion already scheduled');
    expect(body.days_remaining).toBeGreaterThan(0);
  });

  it('schedules deletion 30 days in future with valid password', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue(null);
    mockCreateAccountDeletionRequest.mockResolvedValue(undefined);

    const response = await POST(createRequest({ password: 'correct', confirm: true }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.days_until_deletion).toBe(30);
    expect(mockCreateAccountDeletionRequest).toHaveBeenCalled();

    // Verify scheduled date is ~30 days in future
    const scheduledDate = new Date(body.scheduled_for);
    const daysDiff = Math.floor(
      (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDiff).toBe(30);
  });

  it('includes cancel_until in response', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue(null);
    mockCreateAccountDeletionRequest.mockResolvedValue(undefined);

    const response = await POST(createRequest({ password: 'correct', confirm: true }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.can_cancel_until).toBeDefined();
    expect(body.can_cancel_until).toBe(body.scheduled_for);
  });

  it('captures client IP address', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue(null);
    mockCreateAccountDeletionRequest.mockResolvedValue(undefined);

    const requestWithIp = new NextRequest('http://localhost:3000/api/privacy/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.1.1',
      },
      body: JSON.stringify({ password: 'correct', confirm: true }),
    });

    const response = await POST(requestWithIp);

    expect(response.status).toBe(200);
    expect(mockCreateAccountDeletionRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '192.168.1.1',
      })
    );
  });
});
