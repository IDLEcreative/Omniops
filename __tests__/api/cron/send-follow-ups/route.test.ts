/**
 * Tests for Send Follow-ups Cron Job
 *
 * Validates cron job for sending pending follow-up messages:
 * - Cron secret verification
 * - Sending pending messages
 * - Health check endpoint
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { POST, GET } from '@/app/api/cron/send-follow-ups/route';

// Mock dependencies
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(),
}));

jest.mock('@/lib/follow-ups', () => ({
  sendPendingFollowUps: jest.fn(),
}));

describe('/api/cron/send-follow-ups', () => {
  let mockSupabase: any;
  let consoleLogSpy: jest.SpiedFunction<typeof console.log>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset environment
    process.env = { ...originalEnv };

    // Setup mock Supabase client
    mockSupabase = {
      from: jest.fn(),
    };

    // Setup service client mock
    const supabaseModule = jest.requireMock('@/lib/supabase-server');
    supabaseModule.createServiceRoleClient.mockResolvedValue(mockSupabase);

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

      // Mock sendPendingFollowUps
      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.sendPendingFollowUps.mockResolvedValue({
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

      expect(followUpsModule.sendPendingFollowUps).toHaveBeenCalledWith(
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
      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      expect(followUpsModule.sendPendingFollowUps).not.toHaveBeenCalled();
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

      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.sendPendingFollowUps.mockResolvedValue({
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

      const supabaseModule = jest.requireMock('@/lib/supabase-server');
      supabaseModule.createServiceRoleClient.mockResolvedValue(null);

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

      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.sendPendingFollowUps.mockRejectedValue(
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

      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.sendPendingFollowUps.mockResolvedValue({
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
      expect(followUpsModule.sendPendingFollowUps).toHaveBeenCalledWith(
        expect.anything(),
        100
      );
    });

    it('should handle zero pending messages gracefully', async () => {
      process.env.CRON_SECRET = 'test-cron-secret';

      const followUpsModule = jest.requireMock('@/lib/follow-ups');
      followUpsModule.sendPendingFollowUps.mockResolvedValue({
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
    it('should have correct runtime settings', () => {
      // Import the module to check exports
      const routeModule = require('@/app/api/cron/send-follow-ups/route');

      expect(routeModule.runtime).toBe('nodejs');
      expect(routeModule.maxDuration).toBe(300); // 5 minutes
    });
  });
});