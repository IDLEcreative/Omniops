import { jest } from '@jest/globals'
import OpenAI from 'openai'

// Mock the scraper modules FIRST (jest.mock is hoisted, so this runs before anything else)
jest.mock('@/lib/scraper-api', () => ({
  scrapePage: jest.fn().mockResolvedValue({
    url: 'https://example.com',
    title: 'Example Page',
    content: 'This is the page content. It contains multiple sentences. This helps test chunking.',
    metadata: { description: 'Test description' },
  }),
  crawlWebsite: jest.fn().mockResolvedValue('job-123'),
  checkCrawlStatus: jest.fn().mockResolvedValue({
    status: 'completed',
    data: [],
  }),
  getHealthStatus: jest.fn().mockResolvedValue({
    status: 'ok',
    crawler: 'ready',
  }),
}))

jest.mock('@/lib/scraper-with-cleanup', () => ({
  crawlWebsiteWithCleanup: jest.fn().mockResolvedValue('job-123'),
}))

// NOW import the mocked modules to get references to the mocks
import * as scraperMock from '@/lib/scraper-api'
import * as cleanupMock from '@/lib/scraper-with-cleanup'
import * as supabaseMock from '@/lib/supabase-server'

// Export references to the mocks (these are now proper jest.fn() spies)
export const mockScrapePage = scraperMock.scrapePage as jest.Mock
export const mockCrawlWebsite = scraperMock.crawlWebsite as jest.Mock
export const mockCheckCrawlStatus = scraperMock.checkCrawlStatus as jest.Mock
export const mockGetHealthStatus = scraperMock.getHealthStatus as jest.Mock
export const mockCrawlWebsiteWithCleanup = cleanupMock.crawlWebsiteWithCleanup as jest.Mock

export const mockCreateServiceRoleClient = supabaseMock.createServiceRoleClient as jest.Mock
export const mockCreateClient = supabaseMock.createClient as jest.Mock

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
  // Mock scraper functions are already configured in __mocks__/@/lib/scraper-api.ts
  // via jest.config.js moduleNameMapper, so no additional setup needed here
  // The mocks are already set to return the correct values by default
}
