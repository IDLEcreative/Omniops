import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server'

// Mock the Supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}))

describe('Supabase Database Integration', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

    // Create a mock Supabase client
    mockSupabaseClient = {
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
      })),
      rpc: jest.fn().mockResolvedValue({ data: [], error: null }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
        getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      },
    }

    const supabaseModule = await import('@supabase/supabase-js')
    ;(supabaseModule.createClient as jest.Mock).mockReturnValue(mockSupabaseClient)
  })

  describe('Database Operations', () => {
    it('should create a conversation', async () => {
      const mockConversation = {
        id: 'conv-123',
        session_id: 'session-456',
        created_at: new Date().toISOString(),
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockConversation, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('conversations')
        .insert({ session_id: 'session-456' })
        .select()
        .single()

      expect(result.data).toEqual(mockConversation)
      expect(result.error).toBeNull()
    })

    it('should insert a message', async () => {
      const mockMessage = {
        id: 'msg-123',
        conversation_id: 'conv-123',
        role: 'user',
        content: 'Test message',
        created_at: new Date().toISOString(),
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ data: mockMessage, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('messages')
        .insert({
          conversation_id: 'conv-123',
          role: 'user',
          content: 'Test message',
        })

      expect(result.error).toBeNull()
    })

    it('should fetch conversation history', async () => {
      const mockMessages = [
        { role: 'user', content: 'Hello', created_at: '2024-01-01T10:00:00Z' },
        { role: 'assistant', content: 'Hi there!', created_at: '2024-01-01T10:00:01Z' },
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('messages')
        .select('role, content')
        .eq('conversation_id', 'conv-123')
        .order('created_at', { ascending: true })
        .limit(10)

      expect(result.data).toEqual(mockMessages)
      expect(result.error).toBeNull()
    })

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed')

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ data: null, error: dbError }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('conversations')
        .insert({ session_id: 'session-456' })

      expect(result.data).toBeNull()
      expect(result.error).toEqual(dbError)
    })

    it('should search embeddings using RPC', async () => {
      const mockSearchResults = [
        { chunk_text: 'Relevant content', similarity: 0.85, page_id: 'page-1' },
        { chunk_text: 'Another match', similarity: 0.75, page_id: 'page-2' },
      ]

      mockSupabaseClient.rpc.mockResolvedValue({
        data: mockSearchResults,
        error: null,
      })

      const client = await createServiceRoleClient()
      const embedding = Array(1536).fill(0.1)
      
      const result = await client.rpc('search_embeddings', {
        query_embedding: embedding,
        similarity_threshold: 0.7,
        match_count: 5,
      })

      expect(result.data).toEqual(mockSearchResults)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('search_embeddings', {
        query_embedding: embedding,
        similarity_threshold: 0.7,
        match_count: 5,
      })
    })

    it('should save scraped page data', async () => {
      const mockPage = {
        id: 'page-123',
        url: 'https://example.com',
        title: 'Example Page',
        content: 'Page content',
        last_scraped_at: new Date().toISOString(),
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockPage, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('scraped_pages')
        .upsert({
          url: 'https://example.com',
          title: 'Example Page',
          content: 'Page content',
          last_scraped_at: new Date().toISOString(),
        })
        .select()
        .single()

      expect(result.data).toMatchObject({
        url: 'https://example.com',
        title: 'Example Page',
        content: 'Page content',
      })
    })

    it('should handle batch insert for embeddings', async () => {
      const mockEmbeddings = [
        { page_id: 'page-123', chunk_text: 'Chunk 1', embedding: Array(1536).fill(0.1) },
        { page_id: 'page-123', chunk_text: 'Chunk 2', embedding: Array(1536).fill(0.2) },
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        insert: jest.fn().mockResolvedValue({ data: mockEmbeddings, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('page_embeddings')
        .insert(mockEmbeddings)

      expect(result.error).toBeNull()
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('page_embeddings')
    })

    it('should fetch customer configuration', async () => {
      const mockConfig = {
        domain: 'example.com',
        woocommerce_enabled: true,
        encrypted_credentials: 'encrypted-data',
      }

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockConfig, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('customer_configs')
        .select('*')
        .eq('domain', 'example.com')
        .single()

      expect(result.data).toEqual(mockConfig)
    })

    it('should handle null results gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }))

      const client = await createServiceRoleClient()
      const result = await client
        .from('conversations')
        .select('*')
        .eq('id', 'non-existent')
        .single()

      expect(result.data).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('Authentication', () => {
    it('should check user authentication status', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const client = await createClient()
      const result = await client.auth.getUser()

      expect(result.data.user).toEqual(mockUser)
      expect(result.error).toBeNull()
    })

    it('should handle unauthenticated state', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const client = await createClient()
      const result = await client.auth.getUser()

      expect(result.data.user).toBeNull()
      expect(result.error).toBeNull()
    })
  })
})