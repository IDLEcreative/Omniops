import { jest } from '@jest/globals'
import OpenAI from 'openai'

// Import the actual mock functions from the mock module
// These are the same instances that will be used by the route handlers
import * as scraperApiMock from '../../../__mocks__/@/lib/scraper-api'
import * as scraperWithCleanupMock from '../../../__mocks__/@/lib/scraper-with-cleanup'

// Re-export for convenience in tests - these are the ACTUAL mocks used by route handlers
export const mockScrapePage = scraperApiMock.scrapePage
export const mockCrawlWebsite = scraperApiMock.crawlWebsite
export const mockCheckCrawlStatus = scraperApiMock.checkCrawlStatus
export const mockGetHealthStatus = scraperApiMock.getHealthStatus
export const mockCrawlWebsiteWithCleanup = scraperWithCleanupMock.crawlWebsiteWithCleanup

// Import supabase module (not mocked in this setup)
import * as supabaseModule from '@/lib/supabase-server'
export const mockCreateServiceRoleClient = supabaseModule.createServiceRoleClient as jest.Mock<any>
export const mockCreateClient = supabaseModule.createClient as jest.Mock<any>

// Mock OpenAI embedding response
export const mockEmbeddingResponse = {
  data: [{ embedding: Array(1536).fill(0.1) }],
}

// Set environment variables for testing
process.env.OPENAI_API_KEY = 'test-openai-key'
// Ensure we're NOT in serverless mode so scrapePage mock is actually called
delete process.env.VERCEL
delete process.env.NETLIFY

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

// Note: setupDefaultMocks is called by tests to configure the mocks
// The test file will pass in the mock references since they're created by jest.mock()
export function setupDefaultMocks(mocks?: {
  mockScrapePage?: any
  mockCrawlWebsite?: any
  mockCheckCrawlStatus?: any
  mockGetHealthStatus?: any
  mockCrawlWebsiteWithCleanup?: any
}) {
  // If mocks are provided, configure them
  // Otherwise, use the shared instances from this file (backward compatibility)
  const scrapePage = mocks?.mockScrapePage || mockScrapePage
  const crawlWebsite = mocks?.mockCrawlWebsite || mockCrawlWebsite
  const checkStatus = mocks?.mockCheckCrawlStatus || mockCheckCrawlStatus
  const healthStatus = mocks?.mockGetHealthStatus || mockGetHealthStatus
  const crawlWithCleanup = mocks?.mockCrawlWebsiteWithCleanup || mockCrawlWebsiteWithCleanup

  // Configure default mock implementations for scraper functions
  scrapePage.mockResolvedValue({
    url: 'https://example.com',
    title: 'Example Page',
    content: 'This is the page content. It contains multiple sentences. This helps test chunking.',
    metadata: { description: 'Test description' },
  })

  crawlWebsite.mockResolvedValue('job-123')

  checkStatus.mockResolvedValue({
    status: 'completed',
    data: [],
  })

  healthStatus.mockResolvedValue({
    status: 'ok',
    crawler: 'ready',
  })

  crawlWithCleanup.mockResolvedValue('job-123')
}
