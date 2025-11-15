import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import {
  splitIntoChunks,
  generateEmbeddingVectors,
  generateEmbedding,
  storeEmbeddings,
  searchSimilar
} from '@/lib/embeddings'
import OpenAI from 'openai'
import { __setMockSupabaseClient } from '@/lib/supabase-server'
import {
  createMockOpenAI,
  createMockSupabaseForEmbeddings,
  testFixtures,
  createEmbeddings,
  createChunks
} from '@/__tests__/utils/embeddings-test-helpers'

// Mock dependencies
jest.mock('openai')

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-api-key'

describe('Embeddings Service', () => {
  let mockOpenAIInstance: jest.Mocked<OpenAI>
  let mockSupabaseClient: ReturnType<typeof createMockSupabaseForEmbeddings>

  beforeEach(() => {
    jest.clearAllMocks()
    mockOpenAIInstance = createMockOpenAI()
    mockSupabaseClient = createMockSupabaseForEmbeddings()
    __setMockSupabaseClient(mockSupabaseClient)
  })

  describe('splitIntoChunks', () => {
    it('should split text into chunks based on sentences', () => {
      const chunks = splitIntoChunks(testFixtures.simpleText, 50)
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.every(chunk => chunk.length <= 50)).toBe(true)
    })

    it('should handle text with various punctuation marks', () => {
      const chunks = splitIntoChunks(testFixtures.punctuationText, 30)
      expect(chunks.length).toBeGreaterThan(1)
      expect(chunks.every(chunk => chunk.includes('?') || chunk.includes('!') || chunk.includes('.'))).toBe(true)
    })

    it('should handle empty text', () => {
      const chunks = splitIntoChunks('', 100)
      expect(chunks).toEqual([])
    })

    it('should handle text without sentence breaks', () => {
      const chunks = splitIntoChunks(testFixtures.longTextNoBreaks, 20)
      expect(chunks).toHaveLength(1)
      expect(chunks[0]).toBe(testFixtures.longTextNoBreaks)
    })

    it('should respect max chunk size', () => {
      const text = 'A'.repeat(2000)
      const chunks = splitIntoChunks(text, 1000)
      expect(chunks).toHaveLength(1)
    })

    it('should handle text with multiple spaces', () => {
      const chunks = splitIntoChunks(testFixtures.multiSpaceText)
      expect(chunks).toBeDefined()
      expect(chunks.every(chunk => !chunk.includes('    '))).toBe(true)
    })
  })

  describe('generateEmbeddingVectors', () => {
    it('should generate embeddings for multiple chunks in batches', async () => {
      const chunks = createChunks(25)
      const embeddings = await generateEmbeddingVectors(chunks)

      expect(embeddings).toHaveLength(25)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(2)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-ada-002',
        input: expect.any(Array)
      })
    })

    it('should handle single chunk', async () => {
      mockOpenAIInstance.embeddings.create.mockResolvedValue({
        data: [{ embedding: testFixtures.sampleEmbedding }]
      })

      const embeddings = await generateEmbeddingVectors(['Single chunk'])
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
      const chunks = createChunks(100)
      let callCount = 0
      mockOpenAIInstance.embeddings.create.mockImplementation(() => {
        callCount++
        const batchSize = callCount <= 5 ? 20 : 10
        return Promise.resolve({
          data: Array(batchSize).fill({ embedding: Array(1536).fill(0.1) })
        })
      })

      const embeddings = await generateEmbeddingVectors(chunks)
      expect(embeddings).toHaveLength(100)
      expect(mockOpenAIInstance.embeddings.create).toHaveBeenCalledTimes(5)
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
      const embeddings = createEmbeddings(2, 0.1)
      await storeEmbeddings(testFixtures.testPageId, testFixtures.sampleChunks, embeddings)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings')
      const insertCall = mockSupabaseClient.from().insert
      expect(insertCall).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            page_id: testFixtures.testPageId,
            chunk_text: testFixtures.sampleChunks[0],
            embedding: embeddings[0],
            chunk_index: 0
          }),
          expect.objectContaining({
            page_id: testFixtures.testPageId,
            chunk_text: testFixtures.sampleChunks[1],
            embedding: embeddings[1],
            chunk_index: 1
          })
        ])
      )
    })

    it('should handle empty chunks and embeddings', async () => {
      await storeEmbeddings(testFixtures.testPageId, [], [])
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('embeddings')
      expect(mockSupabaseClient.from().insert).toHaveBeenCalledWith([])
    })

    it('should handle database errors', async () => {
      mockSupabaseClient.from.mockReturnValue({
        insert: jest.fn().mockResolvedValue({ error: new Error('Database error') })
      })

      await expect(storeEmbeddings(testFixtures.testPageId, ['chunk'], createEmbeddings(1)))
        .rejects.toThrow('Failed to store embeddings')
    })

    it('should handle mismatched chunks and embeddings lengths', async () => {
      await expect(storeEmbeddings(testFixtures.testPageId, testFixtures.sampleChunks, createEmbeddings(1)))
        .rejects.toThrow()
    })
  })

  describe('searchSimilar', () => {
    it('should search for similar content', async () => {
      const results = await searchSimilar(testFixtures.sampleEmbedding, 5, 0.7)

      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: testFixtures.sampleEmbedding,
        match_threshold: 0.7,
        match_count: 5
      })
      expect(results).toEqual([testFixtures.sampleSearchResult])
    })

    it('should use default parameters', async () => {
      await searchSimilar(testFixtures.sampleEmbedding)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: testFixtures.sampleEmbedding,
        match_threshold: 0.5,
        match_count: 10
      })
    })

    it('should handle empty results', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: [], error: null })
      const results = await searchSimilar(testFixtures.sampleEmbedding)
      expect(results).toEqual([])
    })

    it('should handle RPC errors', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({ data: null, error: new Error('RPC error') })
      await expect(searchSimilar(testFixtures.sampleEmbedding)).rejects.toThrow('Failed to search embeddings')
    })

    it('should filter by similarity threshold', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [
          { id: '1', chunk_text: 'High match', similarity: 0.9 },
          { id: '2', chunk_text: 'Low match', similarity: 0.3 }
        ],
        error: null
      })

      await searchSimilar(testFixtures.sampleEmbedding, 10, 0.8)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('match_embeddings', {
        query_embedding: expect.any(Array),
        match_threshold: 0.8,
        match_count: 10
      })
    })
  })

  describe('Integration scenarios', () => {
    it('should handle end-to-end embedding generation and storage', async () => {
      const chunks = splitIntoChunks(testFixtures.integrationText)
      expect(chunks.length).toBeGreaterThan(0)

      const embeddings = await generateEmbeddingVectors(chunks)
      expect(embeddings).toHaveLength(chunks.length)

      await storeEmbeddings(testFixtures.integrationPageId, chunks, embeddings)
      expect(mockSupabaseClient.from).toHaveBeenCalled()
    })

    it('should handle search workflow', async () => {
      const queryEmbedding = await generateEmbedding('search query')
      expect(queryEmbedding).toHaveLength(1536)

      const results = await searchSimilar(queryEmbedding, 5, 0.6)
      expect(results).toBeDefined()
      expect(mockSupabaseClient.rpc).toHaveBeenCalled()
    })
  })
})