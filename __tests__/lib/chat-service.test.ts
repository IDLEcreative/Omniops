import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { ChatService } from '@/lib/chat-service'
import { createServiceRoleClient } from '@/lib/supabase-server'

// Mock dependencies
jest.mock('@/lib/supabase-server')

describe('ChatService', () => {
  let chatService: ChatService
  let mockSupabaseClient: ReturnType<typeof createServiceRoleClient>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(),
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'user-123' } }, 
          error: null 
        })
      }
    }

    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabaseClient)

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
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
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
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
    })

    it('should handle database errors when creating session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error')
        })
      })

      await expect(chatService.createSession()).rejects.toThrow('Failed to create session')
    })

    it('should include metadata in session creation', async () => {
      const metadata = {
        source: 'mobile',
        version: '1.0.0',
        platform: 'ios'
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'session-789', metadata },
          error: null
        })
      })

      const session = await chatService.createSession('user-123', metadata)

      expect(session.metadata).toEqual(metadata)
    })
  })

  describe('addMessage', () => {
    it('should add a message to a session', async () => {
      const mockInsertResponse = {
        data: {
          id: 'msg-123',
          session_id: 'session-123',
          role: 'user',
          content: 'Hello, world!'
        },
        error: null
      }

      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue(mockInsertResponse)
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
        })
      })

      const message = await chatService.addMessage(
        'session-123',
        'assistant',
        'Response text',
        metadata
      )

      expect(message.metadata).toEqual(metadata)
    })

    it('should handle different message roles', async () => {
      const roles: Array<'user' | 'assistant' | 'system'> = ['user', 'assistant', 'system']

      for (const role of roles) {
        mockSupabaseClient.from.mockReturnValue({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: `msg-${role}`, role, content: `${role} message` },
            error: null
          })
        })

        const message = await chatService.addMessage(
          'session-123',
          role,
          `${role} message`
        )

        expect(message.role).toBe(role)
      }
    })

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
      ).rejects.toThrow('Failed to add message')
    })

    it('should handle empty content', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'msg-empty', content: '' },
          error: null
        })
      })

      const message = await chatService.addMessage('session-123', 'user', '')
      
      expect(message.content).toBe('')
    })
  })

  describe('getSessionMessages', () => {
    it('should retrieve messages for a session', async () => {
      const mockMessages = [
        { id: '1', role: 'user', content: 'Hello', created_at: '2024-01-01T00:00:00Z' },
        { id: '2', role: 'assistant', content: 'Hi there', created_at: '2024-01-01T00:01:00Z' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockMessages,
          error: null
        })
      })

      const messages = await chatService.getSessionMessages('session-123')

      expect(messages).toEqual(mockMessages)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
      expect(mockSupabaseClient.from().select).toHaveBeenCalledWith('*')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('session_id', 'session-123')
      expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('created_at', { ascending: true })
    })

    it('should limit number of messages retrieved', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await chatService.getSessionMessages('session-123', 50)

      expect(mockSupabaseClient.from().limit).toHaveBeenCalledWith(50)
    })

    it('should handle empty message list', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const messages = await chatService.getSessionMessages('session-123')

      expect(messages).toEqual([])
    })

    it('should handle database errors when retrieving messages', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed')
        })
      })

      await expect(
        chatService.getSessionMessages('session-123')
      ).rejects.toThrow('Failed to get messages')
    })
  })

  describe('endSession', () => {
    it('should end a chat session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {
            id: 'session-123',
            ended_at: new Date().toISOString()
          },
          error: null
        })
      })

      const session = await chatService.endSession('session-123')

      expect(session.ended_at).toBeDefined()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith(
        expect.objectContaining({
          ended_at: expect.any(String)
        })
      )
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('id', 'session-123')
    })

    it('should handle database errors when ending session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Update failed')
        })
      })

      await expect(
        chatService.endSession('session-123')
      ).rejects.toThrow('Failed to end session')
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
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockSession,
          error: null
        })
      })

      const session = await chatService.getSession('session-123')

      expect(session).toEqual(mockSession)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('id', 'session-123')
    })

    it('should handle session not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null
        })
      })

      const session = await chatService.getSession('non-existent')

      expect(session).toBeNull()
    })

    it('should handle database errors when getting session', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed')
        })
      })

      await expect(
        chatService.getSession('session-123')
      ).rejects.toThrow('Failed to get session')
    })
  })

  describe('getUserSessions', () => {
    it('should retrieve all sessions for a user', async () => {
      const mockSessions = [
        { id: 'session-1', user_id: 'user-123', started_at: '2024-01-01T00:00:00Z' },
        { id: 'session-2', user_id: 'user-123', started_at: '2024-01-02T00:00:00Z' }
      ]

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: mockSessions,
          error: null
        })
      })

      const sessions = await chatService.getUserSessions('user-123')

      expect(sessions).toEqual(mockSessions)
      expect(mockSupabaseClient.from().eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(mockSupabaseClient.from().order).toHaveBeenCalledWith('started_at', { ascending: false })
    })

    it('should limit the number of sessions returned', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      await chatService.getUserSessions('user-123', 5)

      expect(mockSupabaseClient.from().limit).toHaveBeenCalledWith(5)
    })

    it('should handle users with no sessions', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      })

      const sessions = await chatService.getUserSessions('user-new')

      expect(sessions).toEqual([])
    })

    it('should handle database errors when getting user sessions', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Query failed')
        })
      })

      await expect(
        chatService.getUserSessions('user-123')
      ).rejects.toThrow('Failed to get user sessions')
    })
  })

  describe('deleteSession', () => {
    it('should delete a session and its messages', async () => {
      // Mock message deletion
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null })
          }
        }
        if (table === 'chat_sessions') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null })
          }
        }
        return {}
      })

      await chatService.deleteSession('session-123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('messages')
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_sessions')
    })

    it('should handle errors when deleting messages', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') })
          }
        }
        return {}
      })

      await expect(
        chatService.deleteSession('session-123')
      ).rejects.toThrow('Failed to delete session messages')
    })

    it('should handle errors when deleting session', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'messages') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: null })
          }
        }
        if (table === 'chat_sessions') {
          return {
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ error: new Error('Delete failed') })
          }
        }
        return {}
      })

      await expect(
        chatService.deleteSession('session-123')
      ).rejects.toThrow('Failed to delete session')
    })
  })

  describe('updateSessionTitle', () => {
    it('should update session title', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'session-123', title: 'New Title' },
          error: null
        })
      })

      const session = await chatService.updateSessionTitle('session-123', 'New Title')

      expect(session.title).toBe('New Title')
      expect(mockSupabaseClient.from().update).toHaveBeenCalledWith({
        title: 'New Title',
        updated_at: expect.any(String)
      })
    })

    it('should handle database errors when updating title', async () => {
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Update failed')
        })
      })

      await expect(
        chatService.updateSessionTitle('session-123', 'New Title')
      ).rejects.toThrow('Failed to update session title')
    })
  })

  describe('Edge cases and error scenarios', () => {
    it('should handle null supabase client initialization', async () => {
      ;(createServiceRoleClient as jest.Mock).mockResolvedValue(null)
      const service = new ChatService()
      
      await expect(service.createSession()).rejects.toThrow()
    })

    it('should handle concurrent message additions', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => 
          Promise.resolve({ 
            data: { id: `msg-${Date.now()}` }, 
            error: null 
          })
        )
      })

      const promises = Array(5).fill(null).map((_, i) => 
        chatService.addMessage('session-123', 'user', `Message ${i}`)
      )

      const messages = await Promise.all(promises)
      
      expect(messages).toHaveLength(5)
      expect(new Set(messages.map(m => m.id)).size).toBe(5) // All unique IDs
    })

    it('should handle very long message content', async () => {
      const longContent = 'A'.repeat(10000)
      
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'msg-long', content: longContent },
          error: null
        })
      })

      const message = await chatService.addMessage('session-123', 'user', longContent)
      
      expect(message.content).toBe(longContent)
    })
  })
})