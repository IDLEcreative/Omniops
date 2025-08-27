import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import { POST, GET } from '@/app/api/scrape/route'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { scrapePage, crawlWebsite, checkCrawlStatus } from '@/lib/scraper-api'
import OpenAI from 'openai'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/scraper-api')
jest.mock('openai')

// Mock OpenAI embedding response
const mockEmbeddingResponse = {
  data: [{ embedding: Array(1536).fill(0.1) }],
}

// Set environment variable for OpenAI
process.env.OPENAI_API_KEY = 'test-openai-key'

describe('/api/scrape', () => {
  let mockSupabaseClient: any

  beforeEach(() => {
    jest.clearAllMocks()

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
    }
    ;(createServiceRoleClient as jest.Mock).mockResolvedValue(mockSupabaseClient)

    // Mock OpenAI
    
    // Mock the OpenAI constructor properly
    const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
    MockedOpenAI.mockClear()
    MockedOpenAI.prototype.embeddings = {
      create: jest.fn().mockResolvedValue(mockEmbeddingResponse),
    } as any

    // Mock scraper functions
    ;(scrapePage as jest.Mock).mockResolvedValue({
      url: 'https://example.com',
      title: 'Example Page',
      content: 'This is the page content. It contains multiple sentences. This helps test chunking.',
      metadata: { description: 'Test description' },
    })
    ;(crawlWebsite as jest.Mock).mockResolvedValue('job-123')
    ;(checkCrawlStatus as jest.Mock).mockResolvedValue({
      status: 'completed',
      data: [],
    })
  })

  describe('POST', () => {
    const createRequest = (body: any) => {
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
      expect(scrapePage).toHaveBeenCalledWith('https://example.com')

      // Verify page was saved
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('scraped_pages')
      const fromCall = mockSupabaseClient.from.mock.results[0].value
      expect(fromCall.upsert).toHaveBeenCalledWith({
        url: 'https://example.com',
        title: 'Example Page',
        content: expect.any(String),
        metadata: { description: 'Test description' },
        last_scraped_at: expect.any(String),
      })

      // Verify embeddings were generated
      const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
      expect(MockedOpenAI.prototype.embeddings.create).toHaveBeenCalled()

      // Verify embeddings were saved
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('page_embeddings')
    })

    it('should handle text chunking for long content', async () => {
      const longContent = 'This is a very long sentence. '.repeat(100)
      ;(scrapePage as jest.Mock).mockResolvedValue({
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
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Should create multiple embeddings for long content
      const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
      expect(MockedOpenAI.prototype.embeddings.create).toHaveBeenCalled()
      
      // Check that embeddings were created
      const createCalls = (MockedOpenAI.prototype.embeddings.create as jest.Mock).mock.calls
      expect(createCalls.length).toBeGreaterThan(0)
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
        message: 'Started crawling https://example.com. This may take a few minutes.',
      })

      // Verify crawl was initiated
      expect(crawlWebsite).toHaveBeenCalledWith('https://example.com', {
        maxPages: 50,
        excludePaths: ['/wp-admin', '/admin', '/login', '/cart', '/checkout'],
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
        max_pages: 150, // Exceeds max of 100
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request data')
    })

    it('should handle scraper errors', async () => {
      ;(scrapePage as jest.Mock).mockRejectedValue(new Error('Scraper API error'))

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
      mockSupabaseClient.from.mockImplementation(() => ({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: new Error('Database error'),
        }),
      }))

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle OpenAI API errors', async () => {
      const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
      ;(MockedOpenAI.prototype.embeddings.create as jest.Mock).mockRejectedValue(
        new Error('OpenAI API error')
      )

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle embedding batch processing', async () => {
      // Create content that will result in many chunks
      const manyChunks = Array(50).fill('This is a test sentence.').join(' ')
      ;(scrapePage as jest.Mock).mockResolvedValue({
        url: 'https://example.com',
        title: 'Many Chunks',
        content: manyChunks,
        metadata: {},
      })

      // Mock OpenAI to return embeddings for batches
      const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>
      ;(MockedOpenAI.prototype.embeddings.create as jest.Mock).mockImplementation((params) => ({
        data: params.input.map(() => ({ embedding: Array(1536).fill(0.1) })),
      }))

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(200)
      
      // Should have made multiple embedding calls due to batching
      expect(MockedOpenAI.prototype.embeddings.create).toHaveBeenCalled()
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

      expect(checkCrawlStatus).toHaveBeenCalledWith('job-123')
    })

    it('should require job_id parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/scrape')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('job_id parameter is required')
    })

    it('should handle crawl status check errors', async () => {
      ;(checkCrawlStatus as jest.Mock).mockRejectedValue(
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
      ;(checkCrawlStatus as jest.Mock).mockResolvedValue({
        status: 'processing',
        progress: 0.5,
      })

      let request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')
      let response = await GET(request)
      let data = await response.json()

      expect(data.status).toBe('processing')
      expect(data.progress).toBe(0.5)

      // Test failed status
      ;(checkCrawlStatus as jest.Mock).mockResolvedValue({
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