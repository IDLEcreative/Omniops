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

describe('PaginationCrawler - Basic Functionality', () => {
  let mockPage: ReturnType<typeof createMockPage>
  let crawler: PaginationCrawler

  beforeEach(() => {
    jest.clearAllMocks()
    mockPage = createMockPage()
    mockPage.goto.mockResolvedValue(undefined)
    mockPage.content.mockResolvedValue('<html><body><div class="product">Test</div></body></html>')
    mockPage.waitForSelector.mockResolvedValue(true)
    mockExtractEcommerce.mockResolvedValue({
      platform: 'generic-ecommerce',
      pageType: 'category',
      products: [
        { name: 'Test Product 1', sku: 'TEST-001', price: { amount: 29.99, currency: 'USD', formatted: '$29.99' }, scrapedAt: new Date().toISOString() },
        { name: 'Test Product 2', sku: 'TEST-002', price: { amount: 39.99, currency: 'USD', formatted: '$39.99' }, scrapedAt: new Date().toISOString() }
      ],
      pagination: { current: 1, total: 3, nextUrl: 'https://example.com/page/2' },
      totalProducts: 6
    })
  })

  describe('Constructor and Options', () => {
    it('should use default options when none provided', () => {
      const crawler = new PaginationCrawler()
      expect(crawler).toBeDefined()
    })

    it('should accept custom options', () => {
      const options: PaginationOptions = {
        maxPages: 10, delayBetweenPages: 2000, followPagination: false,
        onPageScraped: jest.fn(), onProgress: jest.fn()
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
      mockExtractEcommerce.mockResolvedValue({
        platform: 'woocommerce', pageType: 'category',
        products: [
          { name: 'Product 1', sku: 'P001', scrapedAt: new Date().toISOString() },
          { name: 'Product 2', sku: 'P002', scrapedAt: new Date().toISOString() }
        ],
        pagination: null, totalProducts: 2
      })
      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com/products', { waitUntil: 'domcontentloaded', timeout: 30000 })
      expect(mockPage.waitForSelector).toHaveBeenCalled()
      expect(result.products).toHaveLength(2)
      expect(result.platform).toBe('woocommerce')
      expect(result.totalPages).toBe(1)
      expect(result.baseUrl).toBe('https://example.com/products')
    })

    it('should crawl multiple pages with pagination', async () => {
      const responses = [
        { platform: 'shopify', pageType: 'category',
          products: [
            { name: 'Product 1', sku: 'P001', scrapedAt: new Date().toISOString() },
            { name: 'Product 2', sku: 'P002', scrapedAt: new Date().toISOString() }
          ],
          pagination: { current: 1, total: 3, nextUrl: 'https://example.com/products?page=2' }, totalProducts: 6
        },
        { platform: 'shopify', pageType: 'category',
          products: [
            { name: 'Product 3', sku: 'P003', scrapedAt: new Date().toISOString() },
            { name: 'Product 4', sku: 'P004', scrapedAt: new Date().toISOString() }
          ],
          pagination: { current: 2, total: 3, nextUrl: 'https://example.com/products?page=3' }, totalProducts: 6
        },
        { platform: 'shopify', pageType: 'category',
          products: [
            { name: 'Product 5', sku: 'P005', scrapedAt: new Date().toISOString() },
            { name: 'Product 6', sku: 'P006', scrapedAt: new Date().toISOString() }
          ],
          pagination: { current: 3, total: 3, nextUrl: null }, totalProducts: 6
        }
      ]
      mockExtractEcommerce.mockResolvedValueOnce(responses[0]).mockResolvedValueOnce(responses[1]).mockResolvedValueOnce(responses[2])
      const result = await crawler.crawlCatalog('https://example.com/products', mockPage)
      expect(mockPage.goto).toHaveBeenCalledTimes(3)
      expect(result.products).toHaveLength(6)
      expect(result.totalPages).toBe(3)
      expect(result.totalProducts).toBe(6)
      expect(result.platform).toBe('shopify')
    })

    it('should respect maxPages limit', async () => {
      const limitedCrawler = new PaginationCrawler({ maxPages: 2 })
      mockExtractEcommerce
        .mockResolvedValueOnce({ products: [{ name: 'Product 1', scrapedAt: new Date().toISOString() }], pagination: { current: 1, nextUrl: 'https://example.com/page/2' } })
        .mockResolvedValueOnce({ products: [{ name: 'Product 2', scrapedAt: new Date().toISOString() }], pagination: { current: 2, nextUrl: 'https://example.com/page/3' } })
        .mockResolvedValueOnce({ products: [{ name: 'Product 3', scrapedAt: new Date().toISOString() }], pagination: { current: 3, nextUrl: 'https://example.com/page/4' } })
      const result = await limitedCrawler.crawlCatalog('https://example.com/products', mockPage)
      expect(mockPage.goto).toHaveBeenCalledTimes(2)
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
})
