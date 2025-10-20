import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import OpenAI from 'openai'

// Mock dependencies
const mockCreateServiceRoleClient = jest.fn()
const mockCreateClient = jest.fn()
const mockScrapePage = jest.fn()
const mockCrawlWebsite = jest.fn()
const mockCheckCrawlStatus = jest.fn()
const mockGetHealthStatus = jest.fn()
const mockCrawlWebsiteWithCleanup = jest.fn()
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
const mockEmbeddingResponse = {
  data: [{ embedding: Array(1536).fill(0.1) }],
}

// Set environment variable for OpenAI
process.env.OPENAI_API_KEY = 'test-openai-key'

describe('/api/scrape', () => {
  let POST: typeof import('@/app/api/scrape/route').POST
  let GET: typeof import('@/app/api/scrape/route').GET
  let mockSupabaseClient: ReturnType<typeof mockCreateServiceRoleClient>

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.resetModules()

    // Mock Supabase client
    mockSupabaseClient = {
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

    // Mock OpenAI
    
    // Mock the OpenAI constructor properly
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    embeddingsCreateMock = jest.fn().mockImplementation(async (params) => {
      return mockEmbeddingResponse
    })
    MockedOpenAI.mockClear()
    MockedOpenAI.mockImplementation(
      () =>
        ({
          embeddings: { create: embeddingsCreateMock },
        } as unknown as OpenAI)
    )

    // Mock scraper functions
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

    ;({ POST, GET } = await import('@/app/api/scrape/route'))
  })

  describe('POST', () => {
    const createRequest = (body: unknown) => {
      return new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
    }

    it('should scrape a single page', async () => {
      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'completed',
        pages_scraped: 1,
        message: 'Successfully scraped and indexed https://example.com',
      })

      // Verify scraper was called
      expect(mockScrapePage).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ turboMode: true })
      )

      // Verify page was saved
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scraped_pages')
      const upsertInvocations = mockSupabaseClient.from.mock.results.flatMap((result) => {
        const upsertFn = result.value?.upsert as jest.Mock | undefined
        return upsertFn?.mock?.calls ?? []
      })
      expect(upsertInvocations.some(([record]) => record?.url === 'https://example.com')).toBe(true)

      // Verify embeddings were generated
      // Verify embeddings were saved
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('page_embeddings')
    })

    it('should handle text chunking for long content', async () => {
      const longContent = 'This is a very long sentence. '.repeat(100)
      mockScrapePage.mockResolvedValue({
        url: 'https://example.com',
        title: 'Long Page',
        content: longContent,
        metadata: {},
      })

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      await response.json()

      expect(response.status).toBe(200)
      
      const embeddingCallIndex = mockSupabaseClient.from.mock.calls.findIndex(
        ([table]) => table === 'page_embeddings'
      )
      expect(embeddingCallIndex).toBeGreaterThanOrEqual(0)
      const insertCalls = (
        mockSupabaseClient.from.mock.results[embeddingCallIndex].value.insert as jest.Mock
      ).mock.calls
      const insertedRecords = insertCalls[0]?.[0] as Array<{ chunk_text: string }>
      expect(Array.isArray(insertedRecords)).toBe(true)
      expect(insertedRecords.length).toBeGreaterThan(1)
    })

    it('should start a website crawl', async () => {
      const requestBody = {
        url: 'https://example.com',
        crawl: true,
        max_pages: 50,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'started',
        job_id: 'job-123',
        turbo_mode: true,
        message: 'Started TURBO crawling https://example.com. This may take a few minutes.',
      })

      // Verify crawl was initiated
      expect(mockCrawlWebsiteWithCleanup).toHaveBeenCalledWith('https://example.com', {
        maxPages: 50,
        excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
        turboMode: true,
        customerId: undefined,
      })
    })

    it('should validate URL format', async () => {
      const requestBody = {
        url: 'not-a-valid-url',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
      expect(data.details).toBeDefined()
    })

    it('should validate max_pages range', async () => {
      const requestBody = {
        url: 'https://example.com',
        crawl: true,
        max_pages: 10001, // Exceeds max allowed value
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle scraper errors', async () => {
      mockScrapePage.mockRejectedValue(new Error('Scraper API error'))

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle database errors when saving page', async () => {
      const defaultFrom = mockSupabaseClient.from.getMockImplementation()
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'scraped_pages') {
          return {
            upsert: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: new Error('Database error'),
            }),
          }
        }
        return defaultFrom ? defaultFrom(table) : {
          upsert: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: { id: 'domain-1' }, error: null }),
        }
      })

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      try {
        const response = await POST(createRequest(requestBody))
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Internal server error')
      } finally {
        if (defaultFrom) {
          mockSupabaseClient.from.mockImplementation(defaultFrom)
        }
      }
    })

    it('should handle embedding batch processing', async () => {
      // Create content that will result in many chunks
      const manyChunks = Array(50).fill('This is a test sentence.').join(' ')
    mockScrapePage.mockResolvedValue({
        url: 'https://example.com',
        title: 'Many Chunks',
        content: manyChunks,
        metadata: {},
      })

      // Mock OpenAI to return embeddings for batches
      embeddingsCreateMock.mockImplementation((params) => ({
        data: (params as { input: string[] }).input.map(() => ({ embedding: Array(1536).fill(0.1) })),
      }))

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      await response.json()

      expect(response.status).toBe(200)
      
      const embeddingCallIndex = mockSupabaseClient.from.mock.calls.findIndex(
        ([table]) => table === 'page_embeddings'
      )
      expect(embeddingCallIndex).toBeGreaterThanOrEqual(0)
      const insertCalls = (
        mockSupabaseClient.from.mock.results[embeddingCallIndex].value.insert as jest.Mock
      ).mock.calls
      const insertedRecords = insertCalls[0]?.[0] as Array<{ chunk_text: string }>
      expect(Array.isArray(insertedRecords)).toBe(true)
      expect(insertedRecords.length).toBeGreaterThan(1)
    })
  })

  describe('GET', () => {
    it('should check crawl status', async () => {
      const request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        status: 'completed',
        data: [],
      })

      const crawlStatusCall = mockCheckCrawlStatus.mock.calls[0]
      expect(crawlStatusCall[0]).toBe('job-123')
    })

    it('should require job_id parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/scrape')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('job_id parameter is required')
    })

    it('should handle crawl status check errors', async () => {
      mockCheckCrawlStatus.mockRejectedValue(
        new Error('Scraper API error')
      )

      const request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check crawl status')
    })

    it('should return different crawl statuses', async () => {
      // Test processing status
      mockCheckCrawlStatus.mockResolvedValue({
        status: 'processing',
        progress: 0.5,
      })

      let request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')
      let response = await GET(request)
      let data = await response.json()

      expect(data.status).toBe('processing')
      expect(data.progress).toBe(0.5)

      // Test failed status
      mockCheckCrawlStatus.mockResolvedValue({
        status: 'failed',
        error: 'Crawl failed',
      })

      request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-456')
      response = await GET(request)
      data = await response.json()

      expect(data.status).toBe('failed')
      expect(data.error).toBe('Crawl failed')
    })
  })
})
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
