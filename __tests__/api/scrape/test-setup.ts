import { jest } from '@jest/globals'
import OpenAI from 'openai'

// Create mock functions directly here - these will be used by jest.mock() factories in the main test file
export const mockScrapePage = jest.fn<any>()
export const mockCrawlWebsite = jest.fn<any>()
export const mockCheckCrawlStatus = jest.fn<any>()
export const mockGetHealthStatus = jest.fn<any>()
export const mockCrawlWebsiteWithCleanup = jest.fn<any>()

// Import supabase module (not mocked in this setup)
import * as supabaseModule from '@/lib/supabase-server'
export const mockCreateServiceRoleClient = supabaseModule.createServiceRoleClient as jest.Mock<any>
export const mockCreateClient = supabaseModule.createClient as jest.Mock<any>

// Mock OpenAI embedding response
export const mockEmbeddingResponse = {
  data: [{ embedding: Array(1536).fill(0.1) }],
}

// Set environment variable for OpenAI
process.env.OPENAI_API_KEY = 'test-openai-key'

export let embeddingsCreateMock: jest.Mock

export function setupSupabaseMock() {
  // Return a properly mocked Supabase client that tests can use
  const mockClient = {
    from: jest.fn().mockImplementation((table: string) => {
      const chain = {
        upsert: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: `${table}-test-id`, domain: 'example.com' },
          error: null
        }),
      }
      return chain
    }),
  }
  return mockClient as any
}

export function setupOpenAIMock() {
  const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
  embeddingsCreateMock = jest.fn().mockImplementation(async () => mockEmbeddingResponse)

  MockedOpenAI.mockClear()
  MockedOpenAI.mockImplementation(
    () =>
      ({
        embeddings: { create: embeddingsCreateMock },
      } as unknown as OpenAI)
  )
}

export function setupDefaultMocks() {
  // Configure default mock implementations for scraper functions
  mockScrapePage.mockResolvedValue({
    url: 'https://example.com',
    title: 'Example Page',
    content: 'This is the page content. It contains multiple sentences. This helps test chunking.',
    metadata: { description: 'Test description' },
  })

  mockCrawlWebsite.mockResolvedValue('job-123')

  mockCheckCrawlStatus.mockResolvedValue({
    status: 'completed',
    data: [],
  })

  mockGetHealthStatus.mockResolvedValue({
    status: 'ok',
    crawler: 'ready',
  })

  mockCrawlWebsiteWithCleanup.mockResolvedValue('job-123')
}
