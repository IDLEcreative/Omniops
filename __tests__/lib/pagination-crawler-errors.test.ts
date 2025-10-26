import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { PaginationCrawler } from '@/lib/pagination-crawler'

// Mock the dependencies
const mockExtractEcommerce = jest.fn()

jest.mock('@/lib/ecommerce-extractor', () => ({
  EcommerceExtractor: {
    extractEcommerce: mockExtractEcommerce
  }
}))

// Mock Playwright page object
const createMockPage = () => ({
  goto: jest.fn(),
  content: jest.fn(),
  waitForSelector: jest.fn(),
  $eval: jest.fn(),
  $: jest.fn(),
  click: jest.fn()
})

describe('PaginationCrawler - Error Handling', () => {
  let mockPage: ReturnType<typeof createMockPage>
  let crawler: PaginationCrawler

  beforeEach(() => {
    jest.clearAllMocks()
    mockPage = createMockPage()

    // Default successful navigation
    mockPage.goto.mockResolvedValue(undefined)
    mockPage.content.mockResolvedValue('<html><body><div class="product">Test</div></body></html>')
    mockPage.waitForSelector.mockResolvedValue(true)

    // Default extractor response
    mockExtractEcommerce.mockResolvedValue({
      platform: 'generic-ecommerce',
      pageType: 'category',
      products: [
        {
          name: 'Test Product 1',
          sku: 'TEST-001',
          price: { amount: 29.99, currency: 'USD', formatted: '$29.99' },
          scrapedAt: new Date().toISOString()
        }
      ],
      pagination: {
        current: 1,
        total: 3,
        nextUrl: 'https://example.com/page/2'
      },
      totalProducts: 6
    })

    crawler = new PaginationCrawler()
  })

  describe('Navigation Errors', () => {
    it('should handle navigation errors gracefully', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
      expect(result.totalPages).toBe(1)
    })

    it('should handle timeout errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('Timeout exceeded'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('Selector Errors', () => {
    it('should continue when product selector not found', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('No products found'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })

    it('should handle missing selectors gracefully', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('Selector timeout'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('Extraction Errors', () => {
    it('should handle extraction errors and continue', async () => {
      const responses = [
        {
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { nextUrl: 'https://example.com/page/2' }
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockRejectedValueOnce(new Error('Extraction failed'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(1) // Should have products from successful page
    })

    it('should handle null extraction results', async () => {
      mockExtractEcommerce.mockResolvedValue(null)

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })

    it('should handle undefined extraction results', async () => {
      mockExtractEcommerce.mockResolvedValue(undefined)

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })
  })

  describe('Pagination Errors', () => {
    it('should handle invalid pagination URLs', async () => {
      mockExtractEcommerce.mockResolvedValue({
        products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
        pagination: { nextUrl: 'not-a-valid-url' }
      })

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(1)
      expect(result.totalPages).toBe(1)
    })

    it('should handle malformed pagination objects', async () => {
      mockExtractEcommerce.mockResolvedValue({
        products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
        pagination: { invalid: 'object' } // Missing expected fields
      })

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(1)
    })
  })

  describe('Network Errors', () => {
    it('should handle network failures', async () => {
      mockPage.goto.mockRejectedValue(new Error('net::ERR_CONNECTION_REFUSED'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })

    it('should handle DNS errors', async () => {
      mockPage.goto.mockRejectedValue(new Error('net::ERR_NAME_NOT_RESOLVED'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })
  })

  describe('Content Errors', () => {
    it('should handle empty page content', async () => {
      mockPage.content.mockResolvedValue('')

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result).toBeDefined()
    })

    it('should handle invalid HTML', async () => {
      mockPage.content.mockResolvedValue('<<invalid>>html')

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result).toBeDefined()
    })
  })

  describe('Recovery and Resilience', () => {
    it('should recover from single page failure and continue', async () => {
      const responses = [
        {
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { nextUrl: 'https://example.com/page/2' }
        },
        null, // Failed page
        {
          products: [{ name: 'Product 3', scrapedAt: new Date().toISOString() }],
          pagination: null
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockRejectedValueOnce(new Error('Page 2 failed'))
        .mockResolvedValueOnce(responses[2])

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(1) // Only products from successful pages
    })

    it('should handle mixed success and failure states', async () => {
      mockExtractEcommerce
        .mockResolvedValueOnce({
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { nextUrl: 'https://example.com/page/2' }
        })
        .mockRejectedValueOnce(new Error('Extraction failed'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(1)
      expect(result.totalPages).toBe(1)
    })
  })

  describe('Edge Case Errors', () => {
    it('should handle extremely long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000)

      const result = await crawler.crawlCatalog(longUrl, mockPage)

      expect(result).toBeDefined()
    })

    it('should handle special characters in URLs', async () => {
      const specialUrl = 'https://example.com/products?category=特殊文字&page=1'

      mockExtractEcommerce.mockResolvedValue({
        products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
        pagination: null
      })

      const result = await crawler.crawlCatalog(specialUrl, mockPage)

      expect(result.products).toHaveLength(1)
    })

    it('should handle missing page object', async () => {
      const result = await crawler.crawlCatalog('https://example.com/products', null as any)

      expect(result.products).toHaveLength(0)
    })
  })
})
