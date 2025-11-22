/**
 * Tests for POST /api/privacy/delete/cancel
 * Validates ability to cancel scheduled account deletion within 30-day period
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/privacy/delete/cancel/route';
import { createClient } from '@/lib/supabase/server';
import * as accountDeletion from '@/lib/privacy/account-deletion';

jest.mock('@/lib/supabase/server');
jest.mock('@/lib/privacy/account-deletion');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCancelAccountDeletionRequest = accountDeletion.cancelAccountDeletionRequest as jest.MockedFunction<typeof accountDeletion.cancelAccountDeletionRequest>;
const mockGetPendingDeletionRequest = accountDeletion.getPendingDeletionRequest as jest.MockedFunction<typeof accountDeletion.getPendingDeletionRequest>;

const createRequest = () =>
  new NextRequest('http://localhost:3000/api/privacy/delete/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });

describe('POST /api/privacy/delete/cancel', () => {
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

    const response = await POST(createRequest());

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 503 when database is unavailable', async () => {
    mockCreateClient.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Database unavailable');
  });

  it('returns 404 when no pending deletion request exists', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue(null);

    const response = await POST(createRequest());

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe('No pending deletion request found');
  });

  it('returns 410 when deletion period has ended', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue({
      user_id: 'user-123',
      scheduled_for: pastDate.toISOString(),
      ip_address: '127.0.0.1',
      status: 'pending',
    });

    const response = await POST(createRequest());

    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.error).toContain('Deletion period has ended');
  });

  it('cancels deletion when within 30-day period', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue({
      user_id: 'user-123',
      scheduled_for: futureDate.toISOString(),
      ip_address: '127.0.0.1',
      status: 'pending',
    });
    mockCancelAccountDeletionRequest.mockResolvedValue(undefined);

    const response = await POST(createRequest());

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.message).toContain('cancelled');
    expect(mockCancelAccountDeletionRequest).toHaveBeenCalledWith('user-123');
  });

  it('handles database errors gracefully', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);
    mockGetPendingDeletionRequest.mockResolvedValue({
      user_id: 'user-123',
      scheduled_for: futureDate.toISOString(),
      ip_address: '127.0.0.1',
      status: 'pending',
    });
    mockCancelAccountDeletionRequest.mockRejectedValue(
      new Error('Database error')
    );

    const response = await POST(createRequest());

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to cancel deletion');
  });
});
