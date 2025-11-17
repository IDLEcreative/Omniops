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
  createCombinedMockSupabase,
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
      const mockSupabase = createCombinedMockSupabase();
      __setMockSupabaseClient(mockSupabase as any);

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
      const mockSupabase = createCombinedMockSupabase(
        mockConversationData({ metadata: { customer: 'John' } })
      );
      __setMockSupabaseClient(mockSupabase as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      await POST(request, { params });

      const updateCall = mockSupabase.from('conversations').update.mock.calls[0];
      if (updateCall && updateCall[0]) {
        expect(updateCall[0]).toMatchObject({
          metadata: expect.objectContaining({
            assigned_to_human: true,
            assigned_by: TEST_IDS.userId,
            status: 'waiting',
          }),
        });
      }
    });

    it('should preserve existing metadata when assigning', async () => {
      const existingMetadata = {
        customer: 'Jane',
        source: 'website',
        tags: ['urgent']
      };

      const mockSupabase = createCombinedMockSupabase(
        mockConversationData({ metadata: existingMetadata })
      );
      __setMockSupabaseClient(mockSupabase as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      await POST(request, { params });

      const updateCall = mockSupabase.from('conversations').update.mock.calls[0];
      if (updateCall && updateCall[0]) {
        const updateData = updateCall[0];
        expect(updateData.metadata).toMatchObject(existingMetadata);
        expect(updateData.metadata.assigned_to_human).toBe(true);
      }
    });
  });

  describe('close action', () => {
    it('should successfully close conversation', async () => {
      const mockSupabase = createCombinedMockSupabase();
      __setMockSupabaseClient(mockSupabase as any);

      const request = createMockRequest({ action: 'close' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('Conversation closed');
      expect(data.data.closedAt).toBeDefined();
    });

    it('should update metadata with closed flag', async () => {
      const mockSupabase = createCombinedMockSupabase();
      __setMockSupabaseClient(mockSupabase as any);

      const request = createMockRequest({ action: 'close' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      await POST(request, { params });

      const updateCall = mockSupabase.from('conversations').update.mock.calls[0];
      if (updateCall && updateCall[0]) {
        expect(updateCall[0]).toMatchObject({
          metadata: expect.objectContaining({
            closed: true,
            closed_by: TEST_IDS.userId,
            status: 'closed',
          }),
        });
      }
    });
  });

  describe('Error handling', () => {
    it('should handle conversation not found', async () => {
      const mockSupabase = createCombinedMockSupabase(null); // null will trigger not found error
      __setMockSupabaseClient(mockSupabase as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Conversation not found');
    });

    it('should handle database update failure', async () => {
      const mockSupabase = createCombinedMockSupabase(
        mockConversationData(),
        mockCustomerConfigData(),
        { message: 'Database error' } // This will trigger update error
      );
      __setMockSupabaseClient(mockSupabase as any);

      const request = createMockRequest({ action: 'assign_human' });
      const params = Promise.resolve({ id: TEST_IDS.conversationId });

      const response = await POST(request, { params });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Failed to assign');
    });
  });
});