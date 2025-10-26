import { jest } from '@jest/globals'
import OpenAI from 'openai'

// Mock dependencies
export const mockCreateServiceRoleClient = jest.fn()
export const mockCreateClient = jest.fn()
export const mockScrapePage = jest.fn()
export const mockCrawlWebsite = jest.fn()
export const mockCheckCrawlStatus = jest.fn()
export const mockGetHealthStatus = jest.fn()
export const mockCrawlWebsiteWithCleanup = jest.fn()

jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: mockCreateServiceRoleClient,
  createClient: mockCreateClient,
}))

jest.mock('@/lib/scraper-api', () => ({
  scrapePage: mockScrapePage,
  crawlWebsite: mockCrawlWebsite,
  checkCrawlStatus: mockCheckCrawlStatus,
  getHealthStatus: mockGetHealthStatus,
}))

jest.mock('@/lib/scraper-with-cleanup', () => ({
  crawlWebsiteWithCleanup: mockCrawlWebsiteWithCleanup,
}))

jest.mock('openai')

// Mock OpenAI embedding response
export const mockEmbeddingResponse = {
  data: [{ embedding: Array(1536).fill(0.1) }],
}

// Set environment variable for OpenAI
process.env.OPENAI_API_KEY = 'test-openai-key'

// Mock NextResponse
class MockNextResponse {
  private readonly body: any
  private readonly init?: { status?: number }

  constructor(body: any, init?: { status?: number }) {
    this.body = body
    this.init = init
  }

  static json(body: any, init?: { status?: number }) {
    return new MockNextResponse(body, init)
  }

  get status() {
    return this.init?.status ?? 200
  }

  async json() {
    return this.body
  }
}

jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextResponse: MockNextResponse,
  }
})

export let embeddingsCreateMock: jest.Mock

export function setupSupabaseMock() {
  const mockSupabaseClient = {
    from: jest.fn(() => ({
      upsert: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'page-123', url: 'https://example.com' },
        error: null,
      }),
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null })
    },
  }

  mockCreateServiceRoleClient.mockReturnValue(mockSupabaseClient)
  mockCreateClient.mockReturnValue(mockSupabaseClient)

  return mockSupabaseClient
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
  mockScrapePage.mockResolvedValue({
    url: 'https://example.com',
    title: 'Example Page',
    content: 'This is the page content. It contains multiple sentences. This helps test chunking.',
    metadata: { description: 'Test description' },
  })

  mockCrawlWebsite.mockResolvedValue('job-123')
  mockCrawlWebsiteWithCleanup.mockResolvedValue('job-123')

  mockCheckCrawlStatus.mockResolvedValue({
    status: 'completed',
    data: [],
  })
}
