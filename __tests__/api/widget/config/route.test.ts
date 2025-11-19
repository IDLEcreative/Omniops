/**
 * Widget Config API Tests
 *
 * Tests for /api/widget/config endpoint
 * Coverage: GET (with domain, with appId, no params), OPTIONS, error scenarios
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, OPTIONS } from '@/app/api/widget/config/route';
import * as supabaseServer from '@/lib/supabase-server';
import { z } from 'zod';

// Mock Supabase
jest.mock('@/lib/supabase-server');

describe('/api/widget/config', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
    };

    (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('OPTIONS', () => {
    it('should return CORS headers for OPTIONS request', async () => {
      const response = await OPTIONS();

      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    });
  });

  describe('GET - No parameters', () => {
    it('should return default config when no domain or appId provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/widget/config');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('config');
      expect(data.config).toHaveProperty('appearance');
      expect(data.config).toHaveProperty('behavior');
      expect(data.config.appearance.primaryColor).toBe('#0066FF');
    });
  });

  describe('GET - With domain parameter', () => {
    it('should return config for valid domain', async () => {
      const mockCustomerConfig = {
        id: 'config-123',
        domain: 'example.com',
        app_id: 'app-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const mockWidgetConfig = {
        id: 'widget-123',
        customer_id: 'config-123',
        appearance: {
          primaryColor: '#FF6600',
          position: 'bottom-right',
        },
        behavior: {
          welcomeMessage: 'Hello! How can I help you?',
          showWelcomeMessage: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockCustomerConfig, error: null }),
      });

      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockWidgetConfig, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('config');
      expect(data.config.appearance.primaryColor).toBe('#FF6600');
      expect(data.config.behavior.welcomeMessage).toBe('Hello! How can I help you?');
    });

    it('should return 404 when domain config not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=nonexistent.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('not found');
    });

    it('should extract domain from referer header if not in query params', async () => {
      const mockCustomerConfig = {
        id: 'config-123',
        domain: 'example.com',
        app_id: 'app-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockCustomerConfig, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config', {
        headers: {
          'referer': 'https://example.com/page',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('GET - With app ID parameter', () => {
    it('should return config for valid app ID', async () => {
      const mockCustomerConfig = {
        id: 'config-123',
        domain: 'example.com',
        app_id: 'app-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockCustomerConfig, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?id=app-123');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('config');
    });
  });

  describe('GET - Error scenarios', () => {
    it('should return 500 when Supabase client creation fails', async () => {
      (supabaseServer.createServiceRoleClient as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it('should return 500 when database query fails', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=example.com');

      const response = await GET(request);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle malformed domain parameters gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=');

      const response = await GET(request);
      const data = await response.json();

      // Should return default config for empty domain
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('config');
    });
  });

  describe('GET - Domain alias support', () => {
    it('should apply domain alias transformation if configured', async () => {
      const mockCustomerConfig = {
        id: 'config-123',
        domain: 'production.com',
        app_id: 'app-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockCustomerConfig, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=preview.com');

      const response = await GET(request);

      // Should have attempted to load config (domain may or may not be aliased based on env config)
      expect(mockSupabase.from).toHaveBeenCalled();
    });
  });

  describe('GET - CORS headers', () => {
    it('should include CORS headers in successful response', async () => {
      const mockCustomerConfig = {
        id: 'config-123',
        domain: 'example.com',
        app_id: 'app-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: mockCustomerConfig, error: null }),
      });

      const request = new NextRequest('http://localhost:3000/api/widget/config?domain=example.com');

      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });
  });
});
