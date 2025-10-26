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

describe('PaginationCrawler - Advanced Features', () => {
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
  })

  describe('Fallback Pagination Detection', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler({ followPagination: false })
    })

    it('should find next page using common selectors', async () => {
      mockExtractEcommerce
        .mockResolvedValueOnce({
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: null // No pagination detected by extractor
        })
        .mockResolvedValueOnce({
          products: [{ name: 'Product 2', scrapedAt: new Date().toISOString() }],
          pagination: null
        })

      // Mock finding next page link
      mockPage.$eval
        .mockRejectedValueOnce(new Error('Selector not found'))
        .mockRejectedValueOnce(new Error('Selector not found'))
        .mockResolvedValueOnce('https://example.com/products?page=2') // Found next link
        .mockRejectedValue(new Error('No more pages'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(mockPage.goto).toHaveBeenCalledTimes(2)
      expect(result.products).toHaveLength(2)
    })

    it('should handle load more buttons', async () => {
      mockExtractEcommerce
        .mockResolvedValueOnce({
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: null
        })
        .mockResolvedValueOnce({
          products: [{ name: 'Product 2', scrapedAt: new Date().toISOString() }],
          pagination: null
        })

      // Mock finding load more button
      mockPage.$eval.mockRejectedValue(new Error('No next link'))
      mockPage.$.mockResolvedValueOnce(true) // Load more button found
      mockPage.click.mockResolvedValue(undefined)

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(mockPage.click).toHaveBeenCalled()
      expect(result.products).toHaveLength(2)
    })
  })

  describe('URL Deduplication', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler()
    })

    it('should not visit the same URL twice', async () => {
      const responses = [
        {
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { nextUrl: 'https://example.com/products' } // Same URL
        }
      ]

      mockExtractEcommerce.mockResolvedValue(responses[0])

      await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(mockPage.goto).toHaveBeenCalledTimes(1) // Should only visit once
    })
  })

  describe('Reset Functionality', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler()
    })

    it('should reset crawler state', async () => {
      // First crawl
      mockExtractEcommerce.mockResolvedValue({
        products: [
          { name: 'Product 1', sku: 'P001', scrapedAt: new Date().toISOString() }
        ],
        pagination: null
      })

      await crawler.crawlCatalog('https://example.com/first', mockPage)

      // Reset crawler
      crawler.reset()

      // Second crawl with same product should not be deduplicated
      await crawler.crawlCatalog('https://example.com/second', mockPage)

      // Should have made 2 separate crawls
      expect(mockPage.goto).toHaveBeenCalledTimes(2)
    })
  })

  describe('Delay Between Pages', () => {
    it('should respect delayBetweenPages option', async () => {
      const startTime = Date.now()
      const crawler = new PaginationCrawler({ delayBetweenPages: 500 })

      const responses = [
        {
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { nextUrl: 'https://example.com/page/2' }
        },
        {
          products: [{ name: 'Product 2', scrapedAt: new Date().toISOString() }],
          pagination: null
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])

      await crawler.crawlCatalog('https://example.com/products', mockPage)

      const endTime = Date.now()
      const elapsed = endTime - startTime

      // Should have taken at least 500ms due to delay
      expect(elapsed).toBeGreaterThanOrEqual(500)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler()
    })

    it('should handle empty product arrays', async () => {
      mockExtractEcommerce.mockResolvedValue({
        products: [], // Empty products
        pagination: null
      })

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })

    it('should handle missing pagination object', async () => {
      mockExtractEcommerce.mockResolvedValue({
        products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }]
        // Missing pagination property
      })

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(1)
      expect(result.totalPages).toBe(1)
    })

    it('should handle invalid URLs gracefully', async () => {
      const result = await crawler.crawlCatalog('not-a-valid-url', mockPage)

      expect(result.products).toHaveLength(0)
    })
  })
})
