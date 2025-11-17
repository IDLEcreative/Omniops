/**
 * Tests for Send Follow-ups Cron Job
 *
 * Validates cron job for sending pending follow-up messages:
 * - Cron secret verification
 * - Sending pending messages
 * - Health check endpoint
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/cron/send-follow-ups/route';

// Import the mocked modules to access the mock functions
import * as supabaseServer from '@/lib/supabase-server';
import * as followUps from '@/lib/follow-ups';

// Get mock functions
const mockCreateServiceRoleClient = supabaseServer.createServiceRoleClient as jest.MockedFunction<typeof supabaseServer.createServiceRoleClient>;
const mockSendPendingFollowUps = followUps.sendPendingFollowUps as jest.MockedFunction<typeof followUps.sendPendingFollowUps>;

describe('/api/cron/send-follow-ups', () => {
  let mockSupabase: any;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };

    // Setup mock Supabase client with proper from method
    mockSupabase = {
      from: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null })
            })
          })
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      })
    };

    // Setup service client mock
    mockCreateServiceRoleClient.mockResolvedValue(mockSupabase);

    // Setup follow-ups mock to return resolved value by default
    mockSendPendingFollowUps.mockResolvedValue({
      sent: 0,
      failed: 0
    });

    // Spy on console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('POST /api/cron/send-follow-ups', () => {
    it('should send pending follow-ups when authorized', async () => {
      // Setup cron secret
      process.env.CRON_SECRET = 'test-cron-secret';

      // Mock sendPendingFollowUps with specific values for this test
      mockSendPendingFollowUps.mockResolvedValueOnce({
        sent: 10,
        failed: 2,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-cron-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(10);
      expect(data.failed).toBe(2);
      expect(data.timestamp).toBeDefined();

      expect(mockSendPendingFollowUps).toHaveBeenCalledWith(
        mockSupabase,
        100 // Default limit
      );

      expect(consoleLogSpy).toHaveBeenCalledWith('[Cron] Starting follow-up send job...');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[Cron] Follow-up send job complete:',
        { sent: 10, failed: 2 }
      );
    });

    it('should return 401 for invalid cron secret', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer wrong-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');

      // Should not call sendPendingFollowUps
      expect(mockSendPendingFollowUps).not.toHaveBeenCalled();
    });

    it('should return 401 for missing authorization header', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should allow request when no cron secret is configured', async () => {
      // No CRON_SECRET set (development mode)
      delete process.env.CRON_SECRET;

      mockSendPendingFollowUps.mockResolvedValueOnce({
        sent: 5,
        failed: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(5);
    });

    it('should handle Supabase client creation failure', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      mockCreateServiceRoleClient.mockResolvedValueOnce(null);

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-cron-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Cron job failed');
      expect(data.details).toContain('Failed to create Supabase client');
    });

    it('should handle errors in sendPendingFollowUps', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      mockSendPendingFollowUps.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-cron-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Cron job failed');
      expect(data.details).toBe('Error: Database connection failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Cron] Follow-up send job failed:',
        expect.any(Error)
      );
    });

    it('should send up to configured limit of messages', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      mockSendPendingFollowUps.mockResolvedValueOnce({
        sent: 100,
        failed: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-cron-secret',
        },
      });

      await POST(request);

      // Should pass limit of 100 to sendPendingFollowUps
      expect(mockSendPendingFollowUps).toHaveBeenCalledWith(
        expect.anything(),
        100
      );
    });

    it('should handle zero pending messages gracefully', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      mockSendPendingFollowUps.mockResolvedValueOnce({
        sent: 0,
        failed: 0,
      });

      const request = new NextRequest('http://localhost:3000/api/cron/send-follow-ups', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer test-cron-secret',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.sent).toBe(0);
      expect(data.failed).toBe(0);
    });
  });

  describe('GET /api/cron/send-follow-ups', () => {
    it('should return health check information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
      expect(data.job).toBe('send-follow-ups');
      expect(data.schedule).toBe('every 15 minutes');
    });

    it('should not require authentication for health check', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      // No authorization header
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('healthy');
    });
  });

  describe('Runtime configuration', () => {
    it('should have correct runtime settings', async () => {
      // Import the module to check exports
      const routeModule = await import('@/app/api/cron/send-follow-ups/route');

      expect(routeModule.runtime).toBe('nodejs');
      expect(routeModule.maxDuration).toBe(300); // 5 minutes
    });
  });
});