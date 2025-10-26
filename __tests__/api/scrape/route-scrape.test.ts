import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import {
  mockCreateServiceRoleClient,
  mockScrapePage,
  mockCrawlWebsiteWithCleanup,
  setupSupabaseMock,
  setupOpenAIMock,
  setupDefaultMocks,
  embeddingsCreateMock,
} from './test-setup'

describe('/api/scrape - Scraping Operations', () => {
  let POST: typeof import('@/app/api/scrape/route').POST
  let mockSupabaseClient: ReturnType<typeof mockCreateServiceRoleClient>

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.resetModules()

    mockSupabaseClient = setupSupabaseMock()
    setupOpenAIMock()
    setupDefaultMocks()

    ;({ POST } = await import('@/app/api/scrape/route'))
  })

  const createRequest = (body: unknown) => {
    return new NextRequest('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  }

  describe('Single Page Scraping', () => {
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

      expect(mockScrapePage).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ turboMode: true })
      )

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scraped_pages')
      const upsertInvocations = mockSupabaseClient.from.mock.results.flatMap((result) => {
        const upsertFn = result.value?.upsert as jest.Mock | undefined
        return upsertFn?.mock?.calls ?? []
      })
      expect(upsertInvocations.some(([record]) => record?.url === 'https://example.com')).toBe(true)

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

    it('should handle embedding batch processing', async () => {
      const manyChunks = Array(50).fill('This is a test sentence.').join(' ')
      mockScrapePage.mockResolvedValue({
        url: 'https://example.com',
        title: 'Many Chunks',
        content: manyChunks,
        metadata: {},
      })

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

  describe('Website Crawling', () => {
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

      expect(mockCrawlWebsiteWithCleanup).toHaveBeenCalledWith('https://example.com', {
        maxPages: 50,
        excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
        turboMode: true,
        customerId: undefined,
      })
    })

    it('should start crawl with default max pages', async () => {
      const requestBody = {
        url: 'https://example.com',
        crawl: true,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('started')
      expect(data.job_id).toBe('job-123')

      expect(mockCrawlWebsiteWithCleanup).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({
          turboMode: true,
        })
      )
    })
  })
})
