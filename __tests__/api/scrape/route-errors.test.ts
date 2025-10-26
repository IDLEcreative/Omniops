import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { NextRequest } from 'next/server'
import {
  mockCreateServiceRoleClient,
  mockScrapePage,
  mockCheckCrawlStatus,
  setupSupabaseMock,
  setupOpenAIMock,
  setupDefaultMocks,
} from './test-setup'

describe('/api/scrape - Error Handling', () => {
  let POST: typeof import('@/app/api/scrape/route').POST
  let GET: typeof import('@/app/api/scrape/route').GET
  let mockSupabaseClient: ReturnType<typeof mockCreateServiceRoleClient>

  beforeEach(async () => {
    jest.clearAllMocks()
    jest.resetModules()

    mockSupabaseClient = setupSupabaseMock()
    setupOpenAIMock()
    setupDefaultMocks()

    ;({ POST, GET } = await import('@/app/api/scrape/route'))
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

  describe('POST Error Handling', () => {
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

    it('should handle timeout errors', async () => {
      mockScrapePage.mockRejectedValue(new Error('Request timeout'))

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle network errors', async () => {
      mockScrapePage.mockRejectedValue(new Error('Network error'))

      const requestBody = {
        url: 'https://example.com',
        crawl: false,
      }

      const response = await POST(createRequest(requestBody))
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })
  })

  describe('GET Error Handling', () => {
    it('should handle crawl status check errors', async () => {
      mockCheckCrawlStatus.mockRejectedValue(new Error('Scraper API error'))

      const request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check crawl status')
    })

    it('should return different crawl statuses', async () => {
      mockCheckCrawlStatus.mockResolvedValue({
        status: 'processing',
        progress: 0.5,
      })

      let request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')
      let response = await GET(request)
      let data = await response.json()

      expect(data.status).toBe('processing')
      expect(data.progress).toBe(0.5)

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

    it('should handle database connection errors', async () => {
      mockCheckCrawlStatus.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/scrape?job_id=job-123')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to check crawl status')
    })

    it('should handle non-existent job IDs gracefully', async () => {
      mockCheckCrawlStatus.mockResolvedValue({
        status: 'not_found',
        error: 'Job not found',
      })

      const request = new NextRequest('http://localhost:3000/api/scrape?job_id=non-existent')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('not_found')
    })
  })
})
