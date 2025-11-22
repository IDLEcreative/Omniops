import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { ChatService } from '@/lib/chat-service'
import { __setMockSupabaseClient } from '@/lib/supabase-server'


describe('ChatService - Context Enhancement', () => {
  let chatService: ChatService
  let mockSupabaseClient: any

  beforeEach(() => {
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
    // Pass mockSupabaseClient to ChatService constructor
    chatService = new ChatService(mockSupabaseClient)

    // Clear mocks AFTER setting up Supabase client
    mockSupabaseClient.from.mockClear()
  })

  describe('updateSessionMetadata', () => {
    it('should update session metadata', async () => {
      const updates = {
        title: 'New Title',
        metadata: { key: 'value' }
      }

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          error: null
        })
      })

      await chatService.updateSessionMetadata('session-123', updates)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Title',
          metadata: { key: 'value' },
          updated_at: expect.any(String)
        })
      )
    })

  })

  describe('storeWordPressContext', () => {
    it('should store WordPress context in session metadata', async () => {
      const context = {
        userData: { id: 'wp-user-123', name: 'John Doe' },
        pageContext: { url: '/products', title: 'Products' },
        cartData: { items: 3, total: 99.99 },
        orderContext: { orderId: 'order-456' }
      }

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          error: null
        })
      })

      await chatService.storeWordPressContext('session-123', context)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            wordpress_context: expect.objectContaining({
              user_data: context.userData,
              page_context: context.pageContext,
              cart_data: context.cartData,
              order_context: context.orderContext,
              timestamp: expect.any(String)
            })
          }),
          updated_at: expect.any(String)
        })
      )
    })

  })

  describe('getOrCreateSession', () => {
    it('should return existing session if found', async () => {
      const existingSession = {
        id: 'session-123',
        user_id: 'user-123',
        started_at: '2024-01-01T00:00:00Z'
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: existingSession,
          error: null
        })
      })

      const session = await chatService.getOrCreateSession('session-123')

      expect(session).toEqual(existingSession)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
    })

    it('should create new session if not found', async () => {
      const newSession = {
        id: 'session-456',
        user_id: 'user-123',
        started_at: new Date().toISOString()
      }

      // First call returns not found, second call creates session
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      }).mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: newSession,
          error: null
        })
      })

      const session = await chatService.getOrCreateSession('session-456', 'user-123')

      expect(session.id).toBe('session-456')
      expect(session.user_id).toBe('user-123')
    })

  })

  describe('generateSessionTitle', () => {
    it('should generate title from first message', async () => {
      const firstMessage = 'What are your business hours?'

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          error: null
        })
      })

      await chatService.generateSessionTitle('session-123', firstMessage)

      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: firstMessage
        })
      )
    })

    it('should truncate long messages to 100 characters', async () => {
      const longMessage = 'A'.repeat(150)

      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          error: null
        })
      })

      await chatService.generateSessionTitle('session-123', longMessage)

      const updateCall = mockSupabaseClient.from().update.mock.calls[0][0]
      expect(updateCall.title).toBe('A'.repeat(100) + '...')
      expect(updateCall.title.length).toBe(103)
    })

  })

  describe('calculateTokenCount', () => {
    it('should estimate token count from text length', () => {
      const text = 'Hello world'
      const tokenCount = chatService.calculateTokenCount(text)

      expect(tokenCount).toBe(Math.ceil(text.length / 4))
    })
  })

  describe('cleanupOldSessions', () => {
    it('should delete sessions older than specified days', async () => {
      mockSupabaseClient.from.mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        is: jest.fn().mockResolvedValue({
          error: null
        })
      })

      await chatService.cleanupOldSessions(30)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabaseClient.from().delete).toHaveBeenCalled()
      expect(mockSupabaseClient.from().lt).toHaveBeenCalledWith(
        'created_at',
        expect.any(String)
      )
      expect(mockSupabaseClient.from().is).toHaveBeenCalledWith('ended_at', null)
    })

  })
})
