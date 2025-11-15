/**
 * Conversation Actions API - Operations Tests
 *
 * Tests assign_human and close actions functionality
 * including metadata updates and error handling.
 */

import { POST } from '@/app/api/dashboard/conversations/[id]/actions/route';
import { __setMockSupabaseClient } from '@/lib/supabase-server';
import {
  createMockRequest,
  setupAuthenticatedMocks,
  TEST_IDS,
  mockConversationData,
  mockCustomerConfigData
} from './actions-test-helpers';

describe('Conversation Actions - Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('assign_human action', () => {
    it('should successfully assign conversation to human', async () => {
      const { userSupabase, serviceSupabase } = setupAuthenticatedMocks();
      __setMockSupabaseClient(userSupabase as any);

      // Mock conversation exists
      serviceSupabase.from('conversations').single
        .mockResolvedValueOnce({
          data: mockConversationData(),
          error: null,
        });

      // Mock customer config check
      serviceSupabase.from('customer_configs').single
        .mockResolvedValueOnce({
          data: mockCustomerConfigData(),
          error: null,
        });

      // Mock update success
      serviceSupabase.from('conversations').update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Conversation assigned to human agent');
      expect(data.data.conversationId).toBe(TEST_IDS.conversationId);
      expect(data.data.action).toBe('assign_human');
      expect(data.data.assignedAt).toBeDefined();
    });

    it('should update metadata with assigned_to_human flag', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.from('conversations').single
        .mockResolvedValueOnce({
          data: mockConversationData({ metadata: { customer: 'John' } }),
          error: null,
        });

      serviceSupabase.from('customer_configs').single
        .mockResolvedValueOnce({
          data: mockCustomerConfigData(),
          error: null,
        });

      const updateMock = jest.fn().mockResolvedValue({ error: null });
      serviceSupabase.from('conversations').update.mockReturnValue({
        eq: updateMock,
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      await POST(request, { params });

      expect(serviceSupabase.from('conversations').update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            assigned_to_human: true,
            assigned_by: TEST_IDS.userId,
            status: 'waiting',
          }),
        })
      );
    });

    it('should preserve existing metadata when assigning', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      const existingMetadata = {
        customer: 'Jane',
        source: 'website',
        tags: ['urgent']
      };

      serviceSupabase.from('conversations').single
        .mockResolvedValueOnce({
          data: mockConversationData({ metadata: existingMetadata }),
          error: null,
        });

      serviceSupabase.from('customer_configs').single
        .mockResolvedValueOnce({
          data: mockCustomerConfigData(),
          error: null,
        });

      const updateMock = jest.fn().mockResolvedValue({ error: null });
      serviceSupabase.from('conversations').update.mockReturnValue({
        eq: updateMock,
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      await POST(request, { params });

      const updateCall = serviceSupabase.from('conversations').update.mock.calls[0][0];
      expect(updateCall.metadata).toMatchObject(existingMetadata);
      expect(updateCall.metadata.assigned_to_human).toBe(true);
    });
  });

  describe('close action', () => {
    it('should successfully close conversation', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.from('conversations').single
        .mockResolvedValueOnce({
          data: mockConversationData(),
          error: null,
        });

      serviceSupabase.from('customer_configs').single
        .mockResolvedValueOnce({
          data: mockCustomerConfigData(),
          error: null,
        });

      serviceSupabase.from('conversations').update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      } as any);

      const request = createMockRequest({ action: 'close' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Conversation closed');
      expect(data.data.conversationId).toBe(TEST_IDS.conversationId);
      expect(data.data.action).toBe('close');
      expect(data.data.closedAt).toBeDefined();
    });

    it('should set ended_at and update metadata status', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.from('conversations').single
        .mockResolvedValueOnce({
          data: mockConversationData({ metadata: {} }),
          error: null,
        });

      serviceSupabase.from('customer_configs').single
        .mockResolvedValueOnce({
          data: mockCustomerConfigData(),
          error: null,
        });

      const updateMock = jest.fn().mockResolvedValue({ error: null });
      serviceSupabase.from('conversations').update.mockReturnValue({
        eq: updateMock,
      } as any);

      const request = createMockRequest({ action: 'close' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      await POST(request, { params });

      expect(serviceSupabase.from('conversations').update).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at: expect.any(String),
          metadata: expect.objectContaining({
            status: 'resolved',
            closed_by: TEST_IDS.userId,
          }),
        })
      );
    });
  });

  describe('Error handling', () => {
    it('should handle conversation not found', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.from('conversations').single.mockResolvedValueOnce({
        data: null,
        error: new Error('Not found'),
      });

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Conversation not found');
    });

    it('should handle database update failure', async () => {
      const { serviceSupabase } = setupAuthenticatedMocks();

      serviceSupabase.from('conversations').single
        .mockResolvedValueOnce({
          data: mockConversationData(),
          error: null,
        });

      serviceSupabase.from('customer_configs').single
        .mockResolvedValueOnce({
          data: mockCustomerConfigData(),
          error: null,
        });

      serviceSupabase.from('conversations').update.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: new Error('Database error'),
        }),
      } as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to assign');
    });
  });
});
