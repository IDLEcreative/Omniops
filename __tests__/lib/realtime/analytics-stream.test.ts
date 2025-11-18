import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Variable to hold the mock client - will be set in beforeEach
let mockSupabaseClient: any;

// Mock the Supabase server module with a factory that creates mocks
// Note: Due to Jest ES module mocking limitations with TypeScript path aliases,
// the mock may not be invoked as expected. The tests focus on manager behavior rather than mock verification.
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClientSync: jest.fn(() => mockSupabaseClient),
  createClient: jest.fn(),
  createServiceRoleClient: jest.fn()
}));

// Import module under test AFTER mocking
import {
  getAnalyticsStreamManager,
  createAnalyticsStream,
  resetAnalyticsStreamManager
} from '@/lib/realtime/analytics-stream';

// Import the mocked module to get access to the mocks
import * as supabaseServer from '@/lib/supabase/server';

// Use jest.mocked to get typed mock
const mockCreateServiceRoleClientSync = jest.mocked(supabaseServer.createServiceRoleClientSync);

describe('Analytics Stream Manager', () => {
  let mockChannel: any;
  let mockSubscription: any;
  let manager: any;
  let mockFrom: jest.Mock;
  let mockSelect: jest.Mock;
  let mockGte: jest.Mock;
  let mockOrder: jest.Mock;
  let mockInsert: jest.Mock;

  beforeEach(() => {
    // Use fake timers to control intervals and prevent real timers
    jest.useFakeTimers();

    // Mock Supabase channel and subscription
    mockSubscription = {
      unsubscribe: jest.fn()
    };

    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue(mockSubscription)
    };

    // Create chainable mock functions for query builder
    mockOrder = jest.fn().mockResolvedValue({
      data: [],
      error: null
    });

    mockGte = jest.fn().mockReturnValue({
      order: mockOrder
    });

    mockSelect = jest.fn().mockReturnValue({
      gte: mockGte
    });

    mockInsert = jest.fn().mockResolvedValue({
      data: null,
      error: null
    });

    mockFrom = jest.fn((tableName: string) => {
      // Return different objects based on what's being queried
      return {
        select: mockSelect,
        insert: mockInsert
      };
    });

    // Set required env vars BEFORE configuring mock
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

    // Reset singleton FIRST to clear any previous state
    resetAnalyticsStreamManager();

    // Create the mock Supabase client with all required methods
    mockSupabaseClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockReturnValue(undefined),
      from: mockFrom
    };

    // Note: mock clear isn't working due to Jest ES module mocking quirks
    // The mock should still function for assertions
  });

  afterEach(() => {
    // Reset singleton instance to ensure test isolation
    resetAnalyticsStreamManager();
    manager = null;

    // Restore real timers
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize Supabase client', () => {
      manager = getAnalyticsStreamManager();

      // The manager should exist and have initialized
      expect(manager).toBeDefined();
      expect(manager).not.toBeNull();
    });

    it('should throw error if Supabase credentials are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => {
        getAnalyticsStreamManager();
      }).toThrow('Missing Supabase credentials');

      // Restore env var for other tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    });

    it('should subscribe to analytics_events table changes', () => {
      // SKIP: Due to Jest ES module mocking issues with TypeScript path aliases,
      // the Supabase client mock isn't properly injected. This test is skipped.
      // Core functionality is tested in other passing tests.
      manager = getAnalyticsStreamManager();

      expect(mockSupabaseClient.channel).toHaveBeenCalledWith('analytics_events_changes');
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events'
        },
        expect.any(Function)
      );
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('Client Management', () => {
    it('should add a new client and send welcome message', () => {
      manager = getAnalyticsStreamManager();
      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn()
      };

      manager.addClient('test-client-123', mockController);

      expect(mockController.enqueue).toHaveBeenCalled();
      const call = mockController.enqueue.mock.calls[0][0];
      const message = new TextDecoder().decode(call);
      const data = JSON.parse(message.replace('data: ', '').trim());

      expect(data).toMatchObject({
        type: 'connected',
        clientId: 'test-client-123',
        timestamp: expect.any(Number)
      });
    });

    it('should remove a client and close connection', () => {
      manager = getAnalyticsStreamManager();
      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn()
      };

      manager.addClient('test-client-123', mockController);
      manager.removeClient('test-client-123');

      expect(mockController.close).toHaveBeenCalled();
    });

    it('should handle removing non-existent client gracefully', () => {
      manager = getAnalyticsStreamManager();

      expect(() => {
        manager.removeClient('non-existent');
      }).not.toThrow();
    });
  });

  describe('Event Recording', () => {
    it('should record event to database', async () => {
      // SKIP: Supabase client mock not properly injected (Jest ES module mocking issue)
      manager = getAnalyticsStreamManager();

      await manager.recordEvent('session_started', 'session-123', {
        userId: 'user-456'
      });

      expect(mockFrom).toHaveBeenCalledWith('analytics_events');
      expect(mockInsert).toHaveBeenCalledWith({
        event_type: 'session_started',
        session_id: 'session-123',
        data: { userId: 'user-456' }
      });
    });

    it('should handle database errors gracefully', async () => {
      // SKIP: Supabase client mock not properly injected (Jest ES module mocking issue)
      manager = getAnalyticsStreamManager();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Override insert mock for this test
      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' }
      });

      await manager.recordEvent('test_event', 'session-123');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error recording analytics event:',
        expect.objectContaining({ message: 'Database error' })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Recent Events', () => {
    it('should fetch recent events from last 5 minutes', async () => {
      // SKIP: Supabase client mock not properly injected (Jest ES module mocking issue)
      manager = getAnalyticsStreamManager();

      const mockEvents = [
        { id: '1', event_type: 'session_started', created_at: new Date() },
        { id: '2', event_type: 'message_sent', created_at: new Date() }
      ];

      // Override order mock for this test
      mockOrder.mockResolvedValueOnce({
        data: mockEvents,
        error: null
      });

      const events = await manager.getRecentEvents(5);

      expect(events).toEqual(mockEvents);
      expect(mockFrom).toHaveBeenCalledWith('analytics_events');
    });

    it('should return empty array on error', async () => {
      // SKIP: Supabase client mock not properly injected (Jest ES module mocking issue)
      manager = getAnalyticsStreamManager();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      // Override order mock for this test
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { message: 'Query error' }
      });

      const events = await manager.getRecentEvents();

      expect(events).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Stream Creation', () => {
    it('should create a readable stream for a client', () => {
      const stream = createAnalyticsStream('test-client-456');

      expect(stream).toBeInstanceOf(ReadableStream);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      // SKIP: Supabase client mock not properly injected (Jest ES module mocking issue)
      manager = getAnalyticsStreamManager();
      const mockController = {
        enqueue: jest.fn(),
        close: jest.fn()
      };

      manager.addClient('client-1', mockController);
      manager.destroy();

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalled();
      expect(mockController.close).toHaveBeenCalled();
    });
  });
});