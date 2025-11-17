import { POST as authUrlPost } from '@/app/api/instagram/auth/url/route';
import { GET as callbackGet } from '@/app/api/instagram/callback/route';
import { createClient } from '@/lib/supabase/server';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/instagram-oauth');
jest.mock('@/lib/encryption');

describe('Instagram OAuth API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock environment variables
    process.env.INSTAGRAM_APP_ID = 'test-app-id';
    process.env.INSTAGRAM_REDIRECT_URI = 'http://localhost:3000/api/instagram/callback';
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
  });

  describe('POST /api/instagram/auth/url', () => {
    it('should generate OAuth URL with valid customer ID', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      const mockFrom = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      (createClient as jest.Mock).mockResolvedValue({
        from: mockFrom,
      });

      const request = new Request('http://localhost:3000/api/instagram/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      });

      const response = await authUrlPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.authUrl).toContain('facebook.com');
      expect(data.authUrl).toContain('client_id=test-app-id');
      expect(data.authUrl).toContain('instagram_basic');
      expect(mockUpsert).toHaveBeenCalled();
    });

    it('should reject invalid customer ID format', async () => {
      const request = new Request('http://localhost:3000/api/instagram/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'invalid-uuid',
        }),
      });

      const response = await authUrlPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle missing customer ID', async () => {
      const request = new Request('http://localhost:3000/api/instagram/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const response = await authUrlPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should handle database errors gracefully', async () => {
      const mockUpsert = jest.fn().mockResolvedValue({
        error: new Error('Database connection failed'),
      });
      const mockFrom = jest.fn().mockReturnValue({
        upsert: mockUpsert,
      });

      (createClient as jest.Mock).mockResolvedValue({
        from: mockFrom,
      });

      const request = new Request('http://localhost:3000/api/instagram/auth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: '550e8400-e29b-41d4-a716-446655440000',
        }),
      });

      const response = await authUrlPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('GET /api/instagram/callback', () => {
    it('should handle OAuth error from Meta', async () => {
      const url = new URL('http://localhost:3000/api/instagram/callback');
      url.searchParams.set('error', 'access_denied');
      url.searchParams.set('error_description', 'User denied permission');

      const request = new Request(url.toString());
      const response = await callbackGet(request);

      expect(response.status).toBe(307); // Redirect
      expect(response.headers.get('location')).toContain('error=oauth_denied');
    });

    it('should reject callback without code', async () => {
      const url = new URL('http://localhost:3000/api/instagram/callback');
      url.searchParams.set('state', 'test-customer:test-state');

      const request = new Request(url.toString());
      const response = await callbackGet(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('error=invalid_callback');
    });

    it('should reject callback without state', async () => {
      const url = new URL('http://localhost:3000/api/instagram/callback');
      url.searchParams.set('code', 'test-code');

      const request = new Request(url.toString());
      const response = await callbackGet(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('error=invalid_callback');
    });

    it('should reject callback with malformed state', async () => {
      const url = new URL('http://localhost:3000/api/instagram/callback');
      url.searchParams.set('code', 'test-code');
      url.searchParams.set('state', 'malformed-state-without-colon');

      const request = new Request(url.toString());
      const response = await callbackGet(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('error=invalid_state');
    });
  });
});
