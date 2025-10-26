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

describe('EcommerceExtractor - DOM Parser', () => {
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

  describe('DOM-based Product Extraction', () => {
    it('should extract product from common DOM selectors', async () => {
      const html = `
        <html>
          <body>
            <h1 class="product-title">DOM Product</h1>
            <span class="sku">DOM-456</span>
            <div class="price">£45.99</div>
            <div class="stock in-stock">In Stock</div>
            <div class="description">A product extracted from DOM</div>
            <img class="product-image" src="https://example.com/dom.jpg" alt="DOM Product">
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/dom')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'DOM Product',
          sku: 'DOM-456',
          price: expect.objectContaining({
            value: 45.99,
            currency: 'GBP'
          }),
          availability: expect.objectContaining({
            availabilityText: 'In Stock',
            inStock: true
          }),
          description: 'A product extracted from DOM'
        })
      )
    })

    it('should return null when no product name found', async () => {
      const html = `
        <html>
          <body>
            <div class="price">$25.00</div>
            <div class="description">Product without name</div>
          </body>
        </html>
      `

      mockProductNormalizer.normalizeProduct.mockImplementation(() => {
        throw new Error('No product name found')
      })

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/invalid-product')

      expect(result.products).toEqual([])
    })

    it('should extract product with multiple image formats', async () => {
      const html = `
        <html>
          <body>
            <h1 class="product-name">Multi-Image Product</h1>
            <div class="product-images">
              <img src="https://example.com/img1.jpg" alt="Image 1" class="product-image">
              <img src="https://example.com/img2.jpg" alt="Image 2" class="product-image">
              <img src="https://example.com/img3.jpg" alt="Image 3" class="product-image">
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/images')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Multi-Image Product',
          images: expect.any(Array)
        })
      )
    })
  })

  describe('Specification and Variant Extraction', () => {
    it('should extract product specifications', async () => {
      const html = `
        <html>
          <body>
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Product with Specs</span>
            </div>
            <table class="specifications">
              <tr><td>Weight</td><td>2.5kg</td></tr>
              <tr><td>Material</td><td>Aluminum</td></tr>
              <tr><td>Color</td><td>Black</td></tr>
            </table>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/specs')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          specifications: expect.arrayContaining([
            expect.objectContaining({ name: 'Weight', value: '2.5kg' })
          ])
        })
      )
    })

    it('should extract product variants', async () => {
      const html = `
        <html>
          <body>
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Variant Product</span>
            </div>
            <div class="variations">
              <select name="attribute_color">
                <option>Choose an option</option>
                <option value="red">Red</option>
                <option value="blue">Blue</option>
              </select>
              <select name="attribute_size">
                <option>Select Size</option>
                <option value="s">Small</option>
                <option value="m">Medium</option>
                <option value="l">Large</option>
              </select>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/variants')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          variants: expect.arrayContaining([
            expect.objectContaining({ type: 'color', value: 'Red' }),
            expect.objectContaining({ type: 'size', value: 'Small' })
          ])
        })
      )
    })

    it('should handle nested variant structures', async () => {
      const html = `
        <html>
          <body>
            <h1 class="product-title">Complex Variant Product</h1>
            <div class="variations">
              <select name="attribute_material">
                <option>Choose option</option>
                <option value="cotton">Cotton</option>
                <option value="polyester">Polyester</option>
              </select>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/complex')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Complex Variant Product'
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should return base content even when product extraction fails', async () => {
      mockProductNormalizer.normalizeProduct.mockImplementation(() => {
        throw new Error('Normalization failed')
      })

      const html = `
        <html>
          <body>
            <h1>Some Product</h1>
            <span class="price">$25.00</span>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/fails')

      expect(result).toBeDefined()
      expect(result.products).toEqual([])
    })
  })
})
