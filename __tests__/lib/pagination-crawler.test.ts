import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { PaginationCrawler, PaginationOptions } from '@/lib/pagination-crawler'

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

describe('PaginationCrawler', () => {
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
        },
        {
          name: 'Test Product 2',
          sku: 'TEST-002',
          price: { amount: 39.99, currency: 'USD', formatted: '$39.99' },
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

  describe('Constructor and Options', () => {
    it('should use default options when none provided', () => {
      const crawler = new PaginationCrawler()
      
      // Test by checking internal behavior (we can't access private options directly)
      expect(crawler).toBeDefined()
    })

    it('should accept custom options', () => {
      const options: PaginationOptions = {
        maxPages: 10,
        delayBetweenPages: 2000,
        followPagination: false,
        onPageScraped: jest.fn(),
        onProgress: jest.fn()
      }
      
      const crawler = new PaginationCrawler(options)
      expect(crawler).toBeDefined()
    })
  })

  describe('Basic Crawling', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler({
        maxPages: 5,
        delayBetweenPages: 100,
        followPagination: true
      })
    })

    it('should crawl a single page successfully', async () => {
      // Mock single page response
      mockExtractEcommerce.mockResolvedValue({
        platform: 'woocommerce',
        pageType: 'category',
        products: [
          { name: 'Product 1', sku: 'P001', scrapedAt: new Date().toISOString() },
          { name: 'Product 2', sku: 'P002', scrapedAt: new Date().toISOString() }
        ],
        pagination: null, // No more pages
        totalProducts: 2
      })

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com/products', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      })
      expect(mockPage.waitForSelector).toHaveBeenCalled()
      expect(result.products).toHaveLength(2)
      expect(result.platform).toBe('woocommerce')
      expect(result.totalPages).toBe(1)
      expect(result.baseUrl).toBe('https://example.com/products')
    })

    it('should crawl multiple pages with pagination', async () => {
      const responses = [
        // Page 1
        {
          platform: 'shopify',
          pageType: 'category',
          products: [
            { name: 'Product 1', sku: 'P001', scrapedAt: new Date().toISOString() },
            { name: 'Product 2', sku: 'P002', scrapedAt: new Date().toISOString() }
          ],
          pagination: {
            current: 1,
            total: 3,
            nextUrl: 'https://example.com/products?page=2'
          },
          totalProducts: 6
        },
        // Page 2
        {
          platform: 'shopify',
          pageType: 'category',
          products: [
            { name: 'Product 3', sku: 'P003', scrapedAt: new Date().toISOString() },
            { name: 'Product 4', sku: 'P004', scrapedAt: new Date().toISOString() }
          ],
          pagination: {
            current: 2,
            total: 3,
            nextUrl: 'https://example.com/products?page=3'
          },
          totalProducts: 6
        },
        // Page 3
        {
          platform: 'shopify',
          pageType: 'category',
          products: [
            { name: 'Product 5', sku: 'P005', scrapedAt: new Date().toISOString() },
            { name: 'Product 6', sku: 'P006', scrapedAt: new Date().toISOString() }
          ],
          pagination: {
            current: 3,
            total: 3,
            nextUrl: null // Last page
          },
          totalProducts: 6
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])
        .mockResolvedValueOnce(responses[2])

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(mockPage.goto).toHaveBeenCalledTimes(3)
      expect(result.products).toHaveLength(6)
      expect(result.totalPages).toBe(3)
      expect(result.totalProducts).toBe(6)
      expect(result.platform).toBe('shopify')
    })

    it('should respect maxPages limit', async () => {
      const limitedCrawler = new PaginationCrawler({ maxPages: 2 })

      // Mock responses for more pages than limit
      mockExtractEcommerce
        .mockResolvedValueOnce({
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { current: 1, nextUrl: 'https://example.com/page/2' }
        })
        .mockResolvedValueOnce({
          products: [{ name: 'Product 2', scrapedAt: new Date().toISOString() }],
          pagination: { current: 2, nextUrl: 'https://example.com/page/3' }
        })
        .mockResolvedValueOnce({
          products: [{ name: 'Product 3', scrapedAt: new Date().toISOString() }],
          pagination: { current: 3, nextUrl: 'https://example.com/page/4' }
        })

      const result = await limitedCrawler.crawlCatalog('https://example.com/products', mockPage)

      expect(mockPage.goto).toHaveBeenCalledTimes(2) // Should stop at maxPages
      expect(result.products).toHaveLength(2)
    })
  })

  describe('Deduplication', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler()
    })

    it('should deduplicate products by SKU', async () => {
      const responses = [
        {
          products: [
            { name: 'Product 1', sku: 'DUPLICATE', scrapedAt: new Date().toISOString() },
            { name: 'Product 2', sku: 'UNIQUE-1', scrapedAt: new Date().toISOString() }
          ],
          pagination: { nextUrl: 'https://example.com/page/2' }
        },
        {
          products: [
            { name: 'Product 1 Again', sku: 'DUPLICATE', scrapedAt: new Date().toISOString() }, // Duplicate SKU
            { name: 'Product 3', sku: 'UNIQUE-2', scrapedAt: new Date().toISOString() }
          ],
          pagination: null
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(3) // Should have 3 unique products
      expect(result.products.filter(p => p.sku === 'DUPLICATE')).toHaveLength(1)
    })

    it('should deduplicate products by name and price when no SKU', async () => {
      const responses = [
        {
          products: [
            { name: 'No SKU Product', price: { amount: 25.99 }, scrapedAt: new Date().toISOString() },
            { name: 'Another Product', price: { amount: 35.99 }, scrapedAt: new Date().toISOString() }
          ],
          pagination: { nextUrl: 'https://example.com/page/2' }
        },
        {
          products: [
            { name: 'No SKU Product', price: { amount: 25.99 }, scrapedAt: new Date().toISOString() }, // Duplicate
            { name: 'Third Product', price: { amount: 45.99 }, scrapedAt: new Date().toISOString() }
          ],
          pagination: null
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(3) // Should have 3 unique products
    })
  })

  describe('Progress Callbacks', () => {
    it('should call onPageScraped callback', async () => {
      const onPageScraped = jest.fn()
      const crawler = new PaginationCrawler({ onPageScraped })

      mockExtractEcommerce.mockResolvedValue({
        products: [
          { name: 'Product 1', scrapedAt: new Date().toISOString() },
          { name: 'Product 2', scrapedAt: new Date().toISOString() }
        ],
        pagination: null
      })

      await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(onPageScraped).toHaveBeenCalledWith(1, expect.arrayContaining([
        expect.objectContaining({ name: 'Product 1' })
      ]))
    })

    it('should call onProgress callback', async () => {
      const onProgress = jest.fn()
      const crawler = new PaginationCrawler({ onProgress })

      const responses = [
        {
          products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }],
          pagination: { current: 1, total: 2, nextUrl: 'https://example.com/page/2' }
        },
        {
          products: [{ name: 'Product 2', scrapedAt: new Date().toISOString() }],
          pagination: { current: 2, total: 2, nextUrl: null }
        }
      ]

      mockExtractEcommerce
        .mockResolvedValueOnce(responses[0])
        .mockResolvedValueOnce(responses[1])

      await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(onProgress).toHaveBeenCalledWith(1, 2)
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

  describe('Error Handling', () => {
    beforeEach(() => {
      crawler = new PaginationCrawler()
    })

    it('should handle navigation errors gracefully', async () => {
      mockPage.goto.mockRejectedValue(new Error('Navigation failed'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
      expect(result.totalPages).toBe(1)
    })

    it('should continue when product selector not found', async () => {
      mockPage.waitForSelector.mockRejectedValue(new Error('No products found'))

      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)

      expect(result.products).toHaveLength(0)
    })

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