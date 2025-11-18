import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
  getAnalyticsStreamManager,
  createAnalyticsStream,
  resetAnalyticsStreamManager
} from '@/lib/realtime/analytics-stream';
import { createServiceRoleClientSync } from '@/lib/supabase/server';

// Create mock function
const mockCreateServiceRoleClientSync = jest.fn();

// Mock Supabase server module (the actual module used by the implementation)
jest.mock('@/lib/supabase/server', () => ({
  createServiceRoleClientSync: (...args: any[]) => mockCreateServiceRoleClientSync(...args)
}));

describe('Analytics Stream Manager', () => {
  let mockSupabaseClient: any;
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

    // Reset singleton before setting up mocks
    resetAnalyticsStreamManager();

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

    mockFrom = jest.fn().mockReturnValue({
      select: mockSelect,
      insert: mockInsert
    });

    mockSupabaseClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn(),
      from: mockFrom
    };

    // Reset and configure the mock for createServiceRoleClientSync
    mockCreateServiceRoleClientSync.mockReset();
    mockCreateServiceRoleClientSync.mockReturnValue(mockSupabaseClient as any);

    // Set required env vars
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  });

  afterEach(() => {
    // Reset singleton instance to ensure test isolation
    resetAnalyticsStreamManager();
    manager = null;

    // Restore real timers
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize Supabase client with correct credentials', () => {
      manager = getAnalyticsStreamManager();

      expect(mockCreateServiceRoleClientSync).toHaveBeenCalled();
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