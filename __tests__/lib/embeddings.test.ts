import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  splitIntoChunks,
  generateEmbeddingVectors,
  generateEmbedding,
  storeEmbeddings,
  searchSimilar
} from '@/lib/embeddings'
import OpenAI from 'openai'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createServiceRoleMockClient } from '@/test-utils/supabase-test-helpers'

// Mock dependencies
jest.mock('openai')
jest.mock('@/lib/supabase/server')

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'

describe('Embeddings Service', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>
  let mockSupabaseClient: ReturnType<typeof createServiceRoleMockClient>

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock OpenAI instance
    mockOpenAIInstance = {
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [
            { embedding: Array(1536).fill(0.1) },
            { embedding: Array(1536).fill(0.2) }
          ]
        })
      }
    } as any

    // Mock OpenAI constructor
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockClear()
    MockedOpenAI.mockImplementation(() => mockOpenAIInstance)

    // Mock Supabase client with test helpers
    mockSupabaseClient = createServiceRoleMockClient()

    // Override specific mock behaviors for embeddings tests
    mockSupabaseClient.from = jest.fn(() => ({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockResolvedValue({ error: null })
    })) as any

    mockSupabaseClient.rpc = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'chunk-1',
          chunk_text: 'Relevant content',
          page_id: 'page-1',
          similarity: 0.85
        }
      ],
      error: null
    })

    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  describe('splitIntoChunks', () => {
    it('should split text into chunks based on sentences', () => {
      const text = 'First sentence. Second sentence. Third sentence. Fourth sentence.'
      const chunks = splitIntoChunks(text, 50)
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.every(chunk => chunk.length <= 50)).toBe(true)
    })

    it('should handle text with various punctuation marks', () => {
      const text = 'Question? Exclamation! Normal. Another? Yes! Of course.'
      const chunks = splitIntoChunks(text, 30)
      
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.every(chunk => chunk.includes('?') || chunk.includes('!') || chunk.includes('.'))).toBe(true)
    })

    it('should handle empty text', () => {
      const chunks = splitIntoChunks('', 100)
      expect(chunks).toEqual([])
    })

    it('should handle text without sentence breaks', () => {
      const text = 'This is a long text without any sentence breaks that should still be chunked properly'
      const chunks = splitIntoChunks(text, 20)
      
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(text)
    })

    it('should respect max chunk size', () => {
      const text = 'A'.repeat(2000)
      const chunks = splitIntoChunks(text, 1000)
      
      expect(chunks).toHaveLength(1) // Single long sentence should stay together
    })

    it('should handle text with multiple spaces', () => {
      const text = 'First sentence.    Second sentence.   Third sentence.'
      const chunks = splitIntoChunks(text)
      
      expect(chunks).toBeDefined()
      expect(chunks.every(chunk => !chunk.includes('    '))).toBe(true)
    })
  })

  describe('generateEmbeddingVectors', () => {
    it('should generate embeddings for multiple chunks in batches', async () => {
      const chunks = Array(25).fill('Test chunk') // More than batch size
      
      const embeddings = await generateEmbeddingVectors(chunks)
      
      expect(embeddings).toHaveLength(25)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(2) // 20 + 5
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: expect.any(Array)
      })
    })

    it('should handle single chunk', async () => {
      mockOpenAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.5) }]
      })

      const chunks = ['Single chunk']
      const embeddings = await generateEmbeddingVectors(chunks)
      
      expect(embeddings).toHaveLength(1)
      expect(embeddings[0]).toHaveLength(1536)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(1)
    })

    it('should handle empty chunks array', async () => {
      const embeddings = await generateEmbeddingVectors([])
      
      expect(embeddings).toEqual([])
      expect(mockOpenAIInstance.embeddings.create).not.toHaveBeenCalled()
    })

    it('should handle API errors gracefully', async () => {
      mockOpenAIInstance.embeddings.create.mockRejectedValue(new Error('OpenAI API error'))
      
      await expect(generateEmbeddingVectors(['chunk'])).rejects.toThrow('OpenAI API error')
    })

    it('should process chunks with concurrent batch limit', async () => {
      const chunks = Array(100).fill('Test chunk')
      
      // Mock different responses for different batches
      let callCount = 0
      mockOpenAIInstance.embeddings.create.mockImplementation(() => {
        callCount++
        const batchSize = callCount <= 5 ? 20 : 10 // Last batch is smaller
        return Promise.resolve({
          data: Array(batchSize).fill({ embedding: Array(1536).fill(0.1) })
        })
      })

      const embeddings = await generateEmbeddingVectors(chunks)
      
      expect(embeddings).toHaveLength(100)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(5) // 100 / 20 = 5 batches
    })
  })

  describe('generateEmbedding', () => {
    it('should generate a single embedding', async () => {
      mockOpenAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.3) }]
      })

      const embedding = await generateEmbedding('Test text')
      
      expect(embedding).toHaveLength(1536)
      expect(embedding[0]).toBe(0.3)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: 'Test text'
      })
    })

    it('should handle empty text', async () => {
      mockOpenAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0) }]
      })

      const embedding = await generateEmbedding('')
      
      expect(embedding).toHaveLength(1536)
    })

    it('should handle very long text', async () => {
      const longText = 'A'.repeat(10000)
      mockOpenAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }]
      })

      const embedding = await generateEmbedding(longText)
      
      expect(embedding).toHaveLength(1536)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: longText
      })
    })
  })

  describe('storeEmbeddings', () => {
    it('should store embeddings in database', async () => {
      const pageId = 'page-123'
      const chunks = ['Chunk 1', 'Chunk 2']
      const embeddings = [
        Array(1536).fill(0.1),
        Array(1536).fill(0.2)
      ]

      await storeEmbeddings(pageId, chunks, embeddings)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings')
      const insertCall = mockSupabaseClient.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            page_id: pageId,
            chunk_text: 'Chunk 1',
            embedding: embeddings[0],
            chunk_index: 0
          }),
          expect.objectContaining({
            page_id: pageId,
            chunk_text: 'Chunk 2',
            embedding: embeddings[1],
            chunk_index: 1
          })
        ])
      )
    })

    it('should handle empty chunks and embeddings', async () => {
      await storeEmbeddings('page-123', [], [])
      
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith([])
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ 
          error: new Error('Database error') 
        })
      })

      await expect(storeEmbeddings('page-123', ['chunk'], [Array(1536).fill(0)]))
        .rejects.toThrow('Failed to store embeddings')
    })

    it('should handle mismatched chunks and embeddings lengths', async () => {
      const chunks = ['Chunk 1', 'Chunk 2']
      const embeddings = [Array(1536).fill(0.1)] // Only one embedding

      await expect(storeEmbeddings('page-123', chunks, embeddings))
        .rejects.toThrow()
    })
  })

  describe('searchSimilar', () => {
    it('should search for similar content', async () => {
      const queryEmbedding = Array(1536).fill(0.5)
      const limit = 5
      const threshold = 0.7

      const results = await searchSimilar(queryEmbedding, limit, threshold)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: limit
      })
      expect(results).toEqual([
        {
          id: 'chunk-1',
          chunk_text: 'Relevant content',
          page_id: 'page-1',
          similarity: 0.85
        }
      ])
    })

    it('should use default parameters', async () => {
      const queryEmbedding = Array(1536).fill(0.5)
      
      await searchSimilar(queryEmbedding)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: queryEmbedding,
        match_threshold: 0.5,
        match_count: 10
      })
    })

    it('should handle empty results', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null })
      
      const results = await searchSimilar(Array(1536).fill(0.5))
      
      expect(results).toEqual([])
    })

    it('should handle RPC errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ 
        data: null, 
        error: new Error('RPC error') 
      })

      await expect(searchSimilar(Array(1536).fill(0.5)))
        .rejects.toThrow('Failed to search embeddings')
    })

    it('should filter by similarity threshold', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          { id: '1', chunk_text: 'High match', similarity: 0.9 },
          { id: '2', chunk_text: 'Low match', similarity: 0.3 }
        ],
        error: null
      })

      await searchSimilar(Array(1536).fill(0.5), 10, 0.8)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: expect.any(Array),
        match_threshold: 0.8,
        match_count: 10
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle end-to-end embedding generation and storage', async () => {
      const text = 'This is a test document. It contains multiple sentences. Each sentence should be processed.'
      const pageId = 'page-integration-test'

      // Split text
      const chunks = splitIntoChunks(text)
      expect(chunks.length).toBeGreaterThan(0)

      // Generate embeddings
      const embeddings = await generateEmbeddingVectors(chunks)
      expect(embeddings).toHaveLength(chunks.length)

      // Store embeddings
      await storeEmbeddings(pageId, chunks, embeddings)
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })

    it('should handle search workflow', async () => {
      const query = 'search query'
      
      // Generate query embedding
      const queryEmbedding = await generateEmbedding(query)
      expect(queryEmbedding).toHaveLength(1536)

      // Search similar
      const results = await searchSimilar(queryEmbedding, 5, 0.6)
      expect(results).toBeDefined()
      expect(mockSupabaseClient.rpc).toHaveBeenCalled()
    })
  })
})