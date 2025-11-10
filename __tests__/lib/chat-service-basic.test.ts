import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { ChatService } from '@/lib/chat-service'
import { __setMockSupabaseClient } from '@/lib/supabase-server'


describe('ChatService - Basic Operations', () => {
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

  describe('createSession', () => {
    it('should create a new chat session', async () => {
      const mockInsertResponse = {
        data: {
          id: 'session-123',
          user_id: 'user-123',
          started_at: new Date().toISOString(),
          metadata: { source: 'web' }
        },
        error: null
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      })

      const session = await chatService.createSession('user-123', { source: 'web' })

      expect(session).toEqual(mockInsertResponse.data)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'user-123',
          metadata: { source: 'web' }
        })
      )
    })

    it('should create session without user ID', async () => {
      const mockInsertResponse = {
        data: {
          id: 'session-456',
          user_id: null,
          started_at: new Date().toISOString()
        },
        error: null
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
      })

      const session = await chatService.createSession()

      expect(session.user_id).toBeNull()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
    })

  })

  describe('addMessage', () => {
    it('should add a message to a session', async () => {
      const mockInsertResponse = {
        data: {
          id: 'msg-123',
          session_id: 'session-123',
          conversation_id: 'session-123',
          role: 'user',
          content: 'Hello, world!'
        },
        error: null
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse),
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ error: null })
      })

      const message = await chatService.addMessage(
        'session-123',
        'user',
        'Hello, world!'
      )

      expect(message).toEqual(mockInsertResponse.data)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          conversation_id: 'session-123',
          session_id: 'session-123',
          role: 'user',
          content: 'Hello, world!'
        })
      )
    })

    it('should add message with metadata', async () => {
      const metadata = {
        tokens: 10,
        model: 'gpt-4',
        timestamp: Date.now()
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'msg-456', metadata },
          error: null
        }),
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({ error: null })
      })

      const message = await chatService.addMessage(
        'session-123',
        'assistant',
        'Response text',
        metadata
      )

      expect(message.metadata).toEqual(metadata)
    })

  })

  describe('getSession', () => {
    it('should retrieve a session by ID', async () => {
      const mockSession = {
        id: 'session-123',
        user_id: 'user-456',
        started_at: '2024-01-01T00:00:00Z',
        metadata: { source: 'web' }
      }

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSession,
          error: null
        })
      })

      const session = await chatService.getSession('session-123')

      expect(session).toEqual(mockSession)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
    })

    it('should handle session not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        })
      })

      const session = await chatService.getSession('non-existent')

      expect(session).toBeNull()
    })
  })

  describe('getConversationHistory', () => {
    it('should retrieve messages for a session', async () => {
      const mockMessages = [
        { id: '1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', role: 'assistant', content: 'Hi there', created_at: '2024-01-01T00:01:00Z' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockMessages,
          error: null
        })
      })

      const messages = await chatService.getConversationHistory('session-123')

      expect(messages).toEqual(mockMessages)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
      expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('should limit number of messages retrieved', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await chatService.getConversationHistory('session-123', 50)

      expect(mockSupabaseClient.from().limit).toHaveBeenCalledWith(50)
    })

    it('should handle empty message list', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const messages = await chatService.getConversationHistory('session-123')

      expect(messages).toEqual([])
    })
  })

  describe('endSession', () => {
    it('should end a chat session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        or: jest.fn().mockResolvedValue({
          error: null
        })
      })

      await chatService.endSession('session-123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('conversations')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at: expect.any(String)
        })
      )
    })
  })
})
