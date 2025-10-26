import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { EcommerceExtractor } from '@/lib/ecommerce-extractor'

// Mock the dependencies
const mockExtractWithReadability = jest.fn();

const mockPatternLearner = {
  applyPatterns: jest.fn(),
  learnFromExtraction: jest.fn()
}

const mockProductNormalizer = {
  normalizeProduct: jest.fn()
}

// Mock the imports - ContentExtractor must be a real class for inheritance to work
jest.mock('@/lib/content-extractor', () => ({
  ContentExtractor: class ContentExtractor {
    static extractWithReadability = mockExtractWithReadability
  }
}))

jest.mock('@/lib/pattern-learner', () => ({
  PatternLearner: mockPatternLearner
}))

jest.mock('@/lib/product-normalizer', () => ({
  ProductNormalizer: mockProductNormalizer
}))

beforeAll(() => {
  // Ensure mocks are initialized before tests run
  expect(typeof mockProductNormalizer.normalizeProduct).toBe('function')
})

describe('EcommerceExtractor - Shopify', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock returns
    mockExtractWithReadability.mockReturnValue({
      title: 'Test Page',
      content: 'Test content',
      url: 'https://example.com',
      timestamp: new Date().toISOString(),
      metadata: {}
    })

    mockProductNormalizer.normalizeProduct.mockImplementation((product) => ({
      name: product.name || 'Normalized Product',
      scrapedAt: new Date().toISOString(),
      ...product
    }))

    mockPatternLearner.applyPatterns.mockResolvedValue(null)
    mockPatternLearner.learnFromExtraction.mockResolvedValue(undefined)
  })

  describe('Platform Detection - Shopify', () => {
    it('should detect Shopify platform from meta tag', async () => {
      const html = `
        <html>
          <head>
            <meta name="shopify-digital-wallet" content="1234">
          </head>
          <body>
            <div class="shopify-section">Product</div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://shop.example.com')

      expect(result.platform).toBe('shopify')
    })

    it('should detect Shopify platform from class names', async () => {
      const html = `
        <html>
          <body>
            <div class="shopify-section shopify-section--product">
              <div class="product-single">Product</div>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://store.example.com')

      expect(result.platform).toBe('shopify')
    })
  })

  describe('Shopify Product Extraction', () => {
    it('should extract Shopify product from standard structure', async () => {
      const html = `
        <html>
          <head>
            <meta name="shopify-digital-wallet" content="1234">
          </head>
          <body>
            <div class="product-single">
              <h1 class="product-single__title">Shopify Product</h1>
              <div class="product-single__price">$149.99</div>
              <div class="product-single__description">
                An amazing Shopify product
              </div>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://shop.example.com/products/shopify')

      expect(result.platform).toBe('shopify')
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Shopify Product'
        })
      )
    })

    it('should extract Shopify product with variant selectors', async () => {
      const html = `
        <html>
          <head>
            <meta name="shopify-digital-wallet" content="1234">
          </head>
          <body>
            <div class="product-single">
              <h1>Variant Shopify Product</h1>
              <div class="variations">
                <select name="attribute_color">
                  <option>Choose color</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                </select>
                <select name="attribute_size">
                  <option>Choose size</option>
                  <option value="s">S</option>
                  <option value="m">M</option>
                </select>
              </div>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://shop.example.com/products/variant')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Variant Shopify Product'
        })
      )
    })
  })

  describe('Shopify Collection Pages', () => {
    beforeEach(() => {
      mockProductNormalizer.normalizeProduct.mockImplementation((product) => ({
        name: product.name,
        price: { amount: parseFloat(product.price?.current?.replace(/[^0-9.]/g, '') || '0'), currency: 'USD', formatted: product.price?.current || '$0' },
        scrapedAt: new Date().toISOString()
      }))
    })

    it('should extract Shopify collection products', async () => {
      const html = `
        <html>
          <head>
            <meta name="shopify-digital-wallet" content="1234">
          </head>
          <body>
            <div class="collection">
              <div class="grid grid--uniform">
                <div class="grid__item product-card">
                  <h3 class="product-card__title">Shopify Product 1</h3>
                  <span class="product-card__price">$99.99</span>
                </div>
                <div class="grid__item product-card">
                  <h3 class="product-card__title">Shopify Product 2</h3>
                  <span class="product-card__price">$149.99</span>
                </div>
                <div class="grid__item product-card">
                  <h3 class="product-card__title">Shopify Product 3</h3>
                  <span class="product-card__price">$199.99</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://shop.example.com/collections/all')

      expect(result.platform).toBe('shopify')
      expect(result.pageType).toBe('category')
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledTimes(3)
    })
  })

  describe('Shopify Pagination', () => {
    it('should extract Shopify pagination', async () => {
      const html = `
        <html>
          <head>
            <meta name="shopify-digital-wallet" content="1234">
          </head>
          <body>
            <div class="collection">
              <div class="product-card"><h3>Product</h3></div>
            </div>
            <div class="pagination">
              <span class="page current">1</span>
              <a class="page" href="/collections/all?page=2">2</a>
              <a class="page" href="/collections/all?page=3">3</a>
              <a class="next" href="/collections/all?page=2">Next</a>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://shop.example.com/collections/all')

      expect(result.pagination).toBeDefined()
      expect(result.pagination?.current).toBe(1)
      expect(result.pagination?.nextUrl).toBe('https://shop.example.com/collections/all?page=2')
    })
  })
})
