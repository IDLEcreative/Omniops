import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { ChatService } from '@/lib/chat-service'
import { __setMockSupabaseClient } from '@/lib/supabase-server'


describe('ChatService - Error Handling', () => {
  let chatService: ChatService
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    mockSupabaseClient = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null
        })
      }
    }

    __setMockSupabaseClient(mockSupabaseClient)
    chatService = new ChatService()
  })

  describe('createSession errors', () => {
    it('should handle database errors when creating session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      })

      await expect(chatService.createSession()).rejects.toThrow()
    })

  })

  describe('addMessage errors', () => {
    it('should handle database errors when adding message', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Insert failed')
        })
      })

      await expect(
        chatService.addMessage('session-123', 'user', 'Test')
      ).rejects.toThrow()
    })

    it('should handle session update failure after message insert', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { id: 'msg-123', content: 'test' },
              error: null
            })
          }
        }
        if (table === 'conversations') {
          return {
            update: jest.fn().mockReturnThis(),
            or: jest.fn().mockResolvedValue({
              error: new Error('Update failed')
            })
          }
        }
        return {}
      })

      await expect(
        chatService.addMessage('session-123', 'user', 'Test')
      ).rejects.toThrow()
    })
  })

  describe('getSession errors', () => {
    it('should handle database errors when getting session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed')
        })
      })

      await expect(
        chatService.getSession('session-123')
      ).rejects.toThrow()
    })

    it('should distinguish between not found and other errors', async () => {
      // Set up mock to handle both calls
      let callCount = 0;
      mockSupabaseClient.from.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - not found error
          return {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          }
        } else {
          // Second call - other error that should throw
          return {
            select: jest.fn().mockReturnThis(),
            or: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'OTHER_ERROR', message: 'Database error' }
            })
          }
        }
      })

      const result1 = await chatService.getSession('not-found')
      expect(result1).toBeNull()

      try {
        await chatService.getSession('error-case')
        // If we get here, the function didn't throw
        throw new Error('Expected getSession to throw but it did not')
      } catch (error: any) {
        // Check that it threw the right kind of error
        expect(error.code).toBe('OTHER_ERROR')
        expect(error.message).toBe('Database error')
      }
    })
  })

  describe('getConversationHistory errors', () => {
    it('should handle database errors when retrieving messages', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed')
        })
      })

      await expect(
        chatService.getConversationHistory('session-123')
      ).rejects.toThrow()
    })

    it('should return empty array when data is null but no error', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const messages = await chatService.getConversationHistory('session-123')
      expect(messages).toEqual([])
    })
  })

  describe('updateSessionMetadata errors', () => {
    it('should handle database errors when updating metadata', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          error: new Error('Update failed')
        })
      })

      await expect(
        chatService.updateSessionMetadata('session-123', { title: 'New Title' })
      ).rejects.toThrow()
    })

    it('should handle connection errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockRejectedValue(new Error('Connection lost'))
      })

      await expect(
        chatService.updateSessionMetadata('session-123', {})
      ).rejects.toThrow('Connection lost')
    })
  })

  describe('cleanupOldSessions errors', () => {
    it('should handle database errors during cleanup', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          error: new Error('Delete failed')
        })
      })

      await expect(
        chatService.cleanupOldSessions(30)
      ).rejects.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle very long message content', async () => {
      const longContent = 'A'.repeat(10000)

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'msg-long', content: longContent },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ error: null })
      })

      const message = await chatService.addMessage('session-123', 'user', longContent)

      expect(message.content).toBe(longContent)
    })

    it('should handle Unicode and emoji in content', async () => {
      const unicodeContent = 'Hello 🌍 世界 🎉'

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'msg-unicode', content: unicodeContent },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ error: null })
      })

      const message = await chatService.addMessage('session-123', 'user', unicodeContent)

      expect(message.content).toBe(unicodeContent)
    })

    it('should handle malformed session IDs gracefully', async () => {
      const malformedIds = ['', null, undefined]

      for (const id of malformedIds) {
        mockSupabaseClient.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' }
          })
        })

        const result = await chatService.getSession(id as string)
        expect(result).toBeNull()
      }
    })
  })
})
