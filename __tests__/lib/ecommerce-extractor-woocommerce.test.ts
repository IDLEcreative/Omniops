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

describe('EcommerceExtractor - WooCommerce', () => {
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

  describe('Platform Detection - WooCommerce', () => {
    it('should detect WooCommerce platform', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <div class="woocommerce-product">Product</div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com')

      expect(result.platform).toBe('woocommerce')
    })
  })

  describe('WooCommerce Product Extraction', () => {
    it('should extract WooCommerce product from standard structure', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <h1 class="product_title entry-title">WooCommerce Product</h1>
            <p class="price"><span class="amount">$99.99</span></p>
            <div class="woocommerce-product-details__short-description">
              A great WooCommerce product
            </div>
            <button class="single_add_to_cart_button">Add to cart</button>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/woo')

      expect(result.platform).toBe('woocommerce')
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'WooCommerce Product'
        })
      )
    })

    it('should extract WooCommerce variations', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Variable WooCommerce Product</span>
            </div>
            <form class="variations_form cart">
              <table class="variations">
                <tr>
                  <td class="label"><label>Color</label></td>
                  <td class="value">
                    <select name="attribute_pa_color">
                      <option>Choose an option</option>
                      <option value="red">Red</option>
                      <option value="blue">Blue</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td class="label"><label>Size</label></td>
                  <td class="value">
                    <select name="attribute_pa_size">
                      <option>Select Size</option>
                      <option value="small">Small</option>
                      <option value="large">Large</option>
                    </select>
                  </td>
                </tr>
              </table>
            </form>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/variable')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({ type: 'pa_color' }),
            expect.objectContaining({ type: 'pa_size' })
          ])
        })
      )
    })
  })

  describe('WooCommerce Category Pages', () => {
    beforeEach(() => {
      mockProductNormalizer.normalizeProduct.mockImplementation((product) => ({
        name: product.name,
        price: { amount: parseFloat(product.price?.current?.replace(/[^0-9.]/g, '') || '0'), currency: 'USD', formatted: product.price?.current || '$0' },
        scrapedAt: new Date().toISOString()
      }))
    })

    it('should extract WooCommerce product listing', async () => {
      const html = `
        <html>
          <body class="woocommerce-page archive">
            <ul class="products columns-3">
              <li class="product">
                <h2 class="woocommerce-loop-product__title">Product One</h2>
                <span class="price"><span class="amount">$29.99</span></span>
              </li>
              <li class="product">
                <h2 class="woocommerce-loop-product__title">Product Two</h2>
                <span class="price"><span class="amount">$39.99</span></span>
              </li>
              <li class="product">
                <h2 class="woocommerce-loop-product__title">Product Three</h2>
                <span class="price"><span class="amount">$49.99</span></span>
              </li>
            </ul>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/shop')

      expect(result.platform).toBe('woocommerce')
      expect(result.pageType).toBe('category')
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledTimes(3)
    })

    it('should extract WooCommerce total products count', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <p class="woocommerce-result-count">Showing 1–12 of 48 results</p>
            <ul class="products">
              <li class="product"><h2>Product</h2></li>
            </ul>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/shop')

      expect(result.totalProducts).toBe(48)
    })
  })

  describe('WooCommerce Pagination', () => {
    it('should extract WooCommerce pagination', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <ul class="products">
              <li class="product"><h2>Product</h2></li>
            </ul>
            <nav class="woocommerce-pagination">
              <ul class="page-numbers">
                <li><a class="page-numbers" href="/shop/page/1">1</a></li>
                <li><span class="page-numbers current">2</span></li>
                <li><a class="page-numbers" href="/shop/page/3">3</a></li>
                <li><a class="next page-numbers" href="/shop/page/3">→</a></li>
              </ul>
            </nav>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/shop/page/2')

      expect(result.pagination).toBeDefined()
      expect(result.pagination?.current).toBe(2)
      expect(result.pagination?.nextUrl).toBe('https://example.com/shop/page/3')
    })
  })

  describe('WooCommerce Pattern Learning', () => {
    it('should learn from WooCommerce extraction patterns', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <h1 class="product_title">Learning WooCommerce Product</h1>
            <span class="price"><span class="amount">$75.00</span></span>
          </body>
        </html>
      `

      mockProductNormalizer.normalizeProduct.mockReturnValue({
        name: 'Learning WooCommerce Product',
        price: { amount: 75, currency: 'USD', formatted: '$75.00' },
        scrapedAt: new Date().toISOString()
      })

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/woo-learning')

      expect(mockPatternLearner.learnFromExtraction).toHaveBeenCalledWith(
        'https://example.com/product/woo-learning',
        expect.arrayContaining([
          expect.objectContaining({ name: 'Learning WooCommerce Product' })
        ]),
        expect.objectContaining({
          platform: 'woocommerce'
        })
      )
    })
  })
})
