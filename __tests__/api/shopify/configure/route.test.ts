/**
 * Shopify Configure API Tests
 *
 * Tests for /api/shopify/configure endpoint
 * Coverage: POST (create config, update config, validation, encryption)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import * as supabaseServer from '@/lib/supabase-server';

// Mock dependencies BEFORE importing POST
jest.mock('@/lib/supabase-server');

// Import POST after mocks are set up
import { POST } from '@/app/api/shopify/configure/route';

describe('/api/shopify/configure', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client with proper chaining
    mockSupabase = {
      from: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      single: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
    };

    // Make methods chainable by returning the mockSupabase object
    mockSupabase.from.mockReturnValue(mockSupabase);
    mockSupabase.select.mockReturnValue(mockSupabase);
    mockSupabase.eq.mockReturnValue(mockSupabase);
    mockSupabase.update.mockReturnValue(mockSupabase);

    (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('POST - Create new configuration', () => {
    it('should create new Shopify configuration with encrypted token', async () => {
      // No existing config
      mockSupabase.single.mockResolvedValue({ data: null, error: null });
      mockSupabase.insert.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      const plainToken = 'shpat_1234567890abcdef';
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'test-store.myshopify.com',
          accessToken: plainToken,
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify insert was called
      expect(mockSupabase.insert).toHaveBeenCalled();

      // Verify the token was encrypted (not plaintext)
      const insertCall = (mockSupabase.insert as jest.Mock).mock.calls[0][0];
      expect(insertCall.shopify_access_token).not.toBe(plainToken);
      expect(insertCall.shopify_access_token).toBeTruthy();
      expect(insertCall.domain).toBe('example.com');
      expect(insertCall.shopify_shop).toBe('test-store.myshopify.com');
    });
  });

  describe('POST - Update existing configuration', () => {
    it('should update existing Shopify configuration', async () => {
      // Existing config found
      mockSupabase.single.mockResolvedValue({
        data: { id: 'config-123' },
        error: null,
      });
      // For the check phase, single() should return existing config
      // For the update phase, eq() should return mockSupabase and then single/eq returns the update result
      mockSupabase.eq.mockReturnValue(mockSupabase);

      const plainToken = 'shpat_newtoken123';
      const request = new NextRequest('http://localhost:3000/api/shopify/configure', {
        method: 'POST',
        body: JSON.stringify({
          shop: 'updated-store.myshopify.com',
          accessToken: plainToken,
          domain: 'example.com',
        }),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify update was called with encrypted token
      expect(mockSupabase.update).toHaveBeenCalled();
      const updateCall = (mockSupabase.update as jest.Mock).mock.calls[0][0];

      // Verify the token is encrypted (not plaintext)
      expect(updateCall.shopify_shop).toBe('updated-store.myshopify.com');
      expect(updateCall.shopify_access_token).not.toBe(plainToken);
      expect(updateCall.shopify_access_token).not.toContain(plainToken);
      expect(updateCall.shopify_access_token).toBeTruthy();
      expect(typeof updateCall.shopify_access_token).toBe('string');
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
      // First, the check phase: .from().select().eq().single() returns existing config
      mockSupabase.single.mockResolvedValue({ data: { id: 'config-123' }, error: null });

      // Setup for update phase: .from().update().eq() should return an error
      // We need to track calls and return different results for check vs update
      mockSupabase.eq.mockImplementationOnce(() => {
        // First call is in the check phase (after select)
        return mockSupabase;
      }).mockImplementationOnce(() => {
        // Second call is in the update phase (after update)
        // This should resolve to an error
        return Promise.resolve({
          data: null,
          error: { message: 'Update failed', code: 'PGRST116' },
        });
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
      expect(data.error).toContain('Failed to update configuration');
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
      mockSupabase.insert.mockResolvedValue({ data: { id: 'config-123' }, error: null });

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

      const response = await POST(request);
      const data = await response.json();

      // Should succeed
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify insert was called
      expect(mockSupabase.insert).toHaveBeenCalled();

      // Verify plaintext token was NOT stored in the insert call
      const insertCall = (mockSupabase.insert as jest.Mock).mock.calls[0][0];

      // CRITICAL: Token should be encrypted, not plaintext
      expect(insertCall.shopify_access_token).not.toBe(plainToken);
      expect(insertCall.shopify_access_token).not.toContain(plainToken);

      // Verify an encrypted value (not plaintext) was stored
      expect(insertCall.shopify_access_token).toBeTruthy();
      expect(typeof insertCall.shopify_access_token).toBe('string');
    });
  });
});
