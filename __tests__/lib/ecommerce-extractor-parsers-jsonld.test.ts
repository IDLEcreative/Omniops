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

describe('EcommerceExtractor - JSON-LD Parser', () => {
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

  describe('JSON-LD Product Extraction', () => {
    it('should extract product from JSON-LD schema', async () => {
      const html = `
        <html>
          <body>
            <script type="application/ld+json">
            {
              "@type": "Product",
              "name": "Amazing Widget",
              "sku": "WIDGET-123",
              "description": "An amazing widget for all your needs",
              "brand": {
                "name": "WidgetCorp"
              },
              "offers": {
                "price": "29.99",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock"
              },
              "image": ["https://example.com/widget1.jpg", "https://example.com/widget2.jpg"],
              "aggregateRating": {
                "ratingValue": "4.5",
                "reviewCount": "100"
              }
            }
            </script>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/widget')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Amazing Widget',
          sku: 'WIDGET-123',
          description: 'An amazing widget for all your needs',
          brand: 'WidgetCorp',
          // Price and currency are flattened by normalizeProductSafely
          price: 29.99,
          currency: 'USD',
          // Availability is flattened by normalizeProductSafely
          availability: 'https://schema.org/InStock',
          inStock: true,
          images: expect.arrayContaining([
            expect.objectContaining({ url: 'https://example.com/widget1.jpg' })
          ]),
          rating: expect.objectContaining({
            value: 4.5,
            count: 100
          })
        })
      )
    })

    it('should handle array of JSON-LD objects', async () => {
      const html = `
        <html>
          <body>
            <script type="application/ld+json">
            [{
              "@type": "WebPage",
              "name": "Product Page"
            }, {
              "@type": "Product",
              "name": "Second Product",
              "offers": {
                "price": "15.99",
                "priceCurrency": "EUR"
              }
            }]
            </script>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/second')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Second Product',
          // Price and currency are flattened by normalizeProductSafely
          price: 15.99,
          currency: 'EUR'
        })
      )
    })

    it('should handle malformed JSON-LD gracefully', async () => {
      const html = `
        <html>
          <body>
            <script type="application/ld+json">
            { invalid json }
            </script>
            <h1>Product Name</h1>
            <span class="price">$25.00</span>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/fallback')
      // Should fallback to DOM extraction
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })
  })

  describe('Microdata Product Extraction', () => {
    it('should extract product from microdata', async () => {
      const html = `
        <html>
          <body>
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Microdata Product</span>
              <span itemprop="sku">MD-123</span>
              <span itemprop="description">A product with microdata</span>
              <span itemprop="brand">MicroBrand</span>
              <span itemprop="price" content="39.99">$39.99</span>
              <span itemprop="priceCurrency" content="USD"></span>
              <span itemprop="availability" content="https://schema.org/InStock"></span>
              <img itemprop="image" src="https://example.com/micro.jpg" alt="Product">
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/microdata')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Microdata Product',
          sku: 'MD-123',
          description: 'A product with microdata',
          brand: 'MicroBrand',
          // Price and currency are flattened by normalizeProductSafely
          price: 39.99,
          currency: 'USD',
          // Availability is flattened
          availability: 'https://schema.org/InStock',
          inStock: true
        })
      )
    })

    it('should handle microdata with missing optional fields', async () => {
      const html = `
        <html>
          <body>
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Minimal Product</span>
              <span itemprop="price" content="19.99">$19.99</span>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/minimal')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Minimal Product',
          // Price is flattened by normalizeProductSafely
          price: 19.99
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle errors gracefully and continue processing', async () => {
      const html = `
        <html>
          <body>
            <script type="application/ld+json">{ "invalid": json }</script>
            <h1 class="product-title">Fallback Product</h1>
            <span class="price">$25.00</span>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/error-handling')

      // Should still extract using DOM fallback
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })
  })
})
