/**
 * Shopify Configure API Tests
 *
 * Tests for /api/shopify/configure endpoint
 * Coverage: POST (create config, update config, validation, encryption)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/shopify/configure/route';
import * as supabaseServer from '@/lib/supabase-server';

// Mock dependencies
jest.mock('@/lib/supabase-server');
jest.mock('@/lib/encryption', () => ({
  encrypt: jest.fn().mockReturnValue('encrypted_token_abc123'),
}));

describe('/api/shopify/configure', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      insert: jest.fn(),
    };

    (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('POST - Create new configuration', () => {
    it('should create new Shopify configuration with encrypted token', async () => {
      // No existing config
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_1234567890abcdef',
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify token was encrypted
      const { encrypt } = jest.requireMock('@/lib/encryption');
      expect(encrypt).toHaveBeenCalledWith('shpat_1234567890abcdef');

      // Verify insert was called with encrypted token
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        domain: 'example.com',
        shopify_shop: 'test-store.myshopify.com',
        shopify_access_token: 'encrypted_token_abc123',
      });
    });
  });

  describe('POST - Update existing configuration', () => {
    it('should update existing Shopify configuration', async () => {
      // Existing config found
      mockSupabase.single.mockResolvedValue({
        data: { id: 'config-123' },
        error: null,
      });
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'updated-store.myshopify.com',
          accessToken: 'shpat_newtoken123',
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify update was called
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          shopify_shop: 'updated-store.myshopify.com',
          shopify_access_token: 'encrypted_token_abc123',
        })
      );
    });
  });

  describe('POST - Validation errors', () => {
    it('should return 400 when shop is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          accessToken: 'shpat_1234567890abcdef',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should return 400 when accessToken is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should return 400 when shop domain format is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'invalid-domain.com',
          accessToken: 'shpat_1234567890abcdef',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('myshopify.com');
    });

    it('should return 400 when accessToken format is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'invalid_token_format',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('shpat_');
    });

    it('should accept valid shpat_ prefixed token', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_a1b2c3d4e5f6g7h8i9j0',
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST - Database errors', () => {
    it('should return 500 when Supabase client creation fails', async () => {
      (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_1234567890abcdef',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('connection failed');
    });

    it('should return 500 when insert fails', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'PGRST116' },
      });

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_1234567890abcdef',
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to save');
    });

    it('should return 500 when update fails', async () => {
      mockSupabase.single.mockResolvedValue({ data: { id: 'config-123' }, error: null });
      mockSupabase.update.mockReturnThis();
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: 'Update failed', code: 'PGRST116' },
      });

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_1234567890abcdef',
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to update');
    });
  });

  describe('POST - Domain handling', () => {
    it('should use provided domain parameter', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_1234567890abcdef',
          domain: 'custom-domain.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'custom-domain.com',
        })
      );
    });

    it('should use host header when domain not provided', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      const request = new NextRequest('http://example-host.com/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: 'shpat_1234567890abcdef',
        }),
        headers: {
          'Content-Type': 'application/json',
          'host': 'example-host.com',
        },
      });

      await POST(request);

      // Should have attempted to save with domain from host header or localhost
      expect(mockSupabase.insert).toHaveBeenCalled();
    });
  });

  describe('POST - Encryption security', () => {
    it('should never store plaintext access token', async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      const mockInsert = jest.fn().mockResolvedValue({ data: { id: 'config-123' }, error: null });
      mockSupabase.insert = mockInsert;

      const plainToken = 'shpat_plaintext_secret_token';
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: plainToken,
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      await POST(request);

      // Verify plaintext token was NOT stored
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          shopify_access_token: expect.not.stringContaining(plainToken),
        })
      );

      // Verify encrypted value was stored
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          shopify_access_token: 'encrypted_token_abc123',
        })
      );
    });
  });
});
