/**
 * Test helpers for embeddings tests
 *
 * Provides reusable mocks, fixtures, and setup functions for embeddings service tests.
 */

import { jest } from '@jest/globals'
import OpenAI from 'openai'
import { createServiceRoleMockClient } from '@/test-utils/supabase-test-helpers'

/**
 * Creates a mock OpenAI instance with embeddings API
 */
export function createMockOpenAI() {
  const mockInstance = {
    embeddings: {
      create: jest.fn().mockImplementation((params: any) => {
        const input = Array.isArray(params.input) ? params.input : [params.input]
        return Promise.resolve({
          data: input.map((_, index) => ({
            embedding: Array(1536).fill(index % 2 === 0 ? 0.1 : 0.2)
          }))
        })
      })
    }
  } as any

  const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
  MockedOpenAI.mockClear()
  MockedOpenAI.mockImplementation(() => mockInstance)

  return mockInstance
}

/**
 * Creates a mock Supabase client configured for embeddings tests
 */
export function createMockSupabaseForEmbeddings() {
  const mockClient = createServiceRoleMockClient()

  // Mock chain for database operations
  const mockInsert = jest.fn().mockResolvedValue({ error: null })
  const mockSelect = jest.fn().mockReturnThis()
  const mockEq = jest.fn().mockReturnThis()
  const mockSingle = jest.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null })
  const mockUpdate = jest.fn().mockReturnThis()
  const mockDelete = jest.fn().mockResolvedValue({ error: null })

  const chainMock = {
    insert: mockInsert,
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    update: mockUpdate,
    delete: mockDelete,
  }

  mockClient.from = jest.fn(() => chainMock) as any

  mockClient.rpc = jest.fn().mockResolvedValue({
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

  return mockClient
}

/**
 * Test data fixtures
 */
export const testFixtures = {
  // Sample texts for chunking tests
  simpleText: 'First sentence. Second sentence. Third sentence. Fourth sentence.',
  punctuationText: 'Question? Exclamation! Normal. Another? Yes! Of course.',
  multiSpaceText: 'First sentence.    Second sentence.   Third sentence.',
  longTextNoBreaks: 'This is a long text without any sentence breaks that should still be chunked properly',
  integrationText: 'This is a test document. It contains multiple sentences. Each sentence should be processed.',

  // Sample embeddings
  sampleEmbedding: Array(1536).fill(0.5),

  // Sample chunks
  sampleChunks: ['Chunk 1', 'Chunk 2'],

  // Sample search result
  sampleSearchResult: {
    id: 'chunk-1',
    chunk_text: 'Relevant content',
    page_id: 'page-1',
    similarity: 0.85
  },

  // Page IDs
  testPageId: 'page-123',
  integrationPageId: 'page-integration-test'
}

/**
 * Helper to create embeddings array
 */
export function createEmbeddings(count: number, fillValue = 0.1): number[][] {
  return Array(count).fill(null).map(() => Array(1536).fill(fillValue))
}

/**
 * Helper to create test chunks
 */
export function createChunks(count: number, prefix = 'Test chunk'): string[] {
  return Array(count).fill(null).map((_, i) => `${prefix} ${i + 1}`)
}
