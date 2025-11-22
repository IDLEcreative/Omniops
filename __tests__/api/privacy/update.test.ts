/**
 * Tests for POST /api/privacy/update
 * Validates GDPR Article 16 (Right to Rectification) - update personal data
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/privacy/update/route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const createRequest = (body: any) =>
  new NextRequest('http://localhost:3000/api/privacy/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

describe('POST /api/privacy/update', () => {
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

    const response = await POST(createRequest({ field: 'name', value: 'John' }));

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 503 when database is unavailable', async () => {
    mockCreateClient.mockResolvedValue(null);

    const response = await POST(createRequest({ field: 'name', value: 'John' }));

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error).toBe('Database unavailable');
  });

  it('returns 400 when field is missing', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ value: 'John' }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when value is empty', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'name', value: '' }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid request');
  });

  it('returns 400 when field is not allowed', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'email', value: 'new@example.com' }));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Invalid request');
  });

  it('updates user name successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        updateUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'name', value: 'John Doe' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.updated_field).toBe('name');
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { full_name: 'John Doe' },
    });
  });

  it('updates user phone successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        updateUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'phone', value: '+1234567890' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.updated_field).toBe('phone');
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { phone: '+1234567890' },
    });
  });

  it('updates user company successfully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        updateUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'company', value: 'Acme Corp' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.updated_field).toBe('company');
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { company: 'Acme Corp' },
    });
  });

  it('handles update errors gracefully', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        updateUser: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Update failed'),
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'name', value: 'John' }));

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Failed to update user data');
  });

  it('returns success message with field name', async () => {
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123', email: 'user@example.com' } },
          error: null,
        }),
        updateUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    const response = await POST(createRequest({ field: 'phone', value: '123456' }));

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toContain('phone');
    expect(body.message).toContain('successfully');
  });
});
