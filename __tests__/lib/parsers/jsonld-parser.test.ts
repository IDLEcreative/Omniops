import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals'
import { EcommerceExtractor } from '@/lib/ecommerce-extractor'
import {
  mockProductNormalizer,
  setupMockDefaults,
  verifyMocksInitialized
} from './test-utils'

beforeAll(() => {
  verifyMocksInitialized()
})

describe('EcommerceExtractor - JSON-LD Parser', () => {
  beforeEach(() => {
    setupMockDefaults()
  })

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
        price: 29.99,
        currency: 'USD',
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

  it('should extract complete product data from JSON-LD', async () => {
    const html = `
      <html>
        <body>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "name": "Complete Product",
            "sku": "CP-999",
            "description": "A complete product with all fields",
            "brand": { "name": "BrandName" },
            "offers": {
              "price": "99.99",
              "priceCurrency": "GBP",
              "availability": "https://schema.org/InStock"
            },
            "image": "https://example.com/image.jpg",
            "aggregateRating": {
              "ratingValue": "4.8",
              "reviewCount": "250"
            }
          }
          </script>
        </body>
      </html>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/complete')

    expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Complete Product',
        sku: 'CP-999',
        description: 'A complete product with all fields',
        brand: 'BrandName',
        price: 99.99,
        currency: 'GBP',
        availability: 'https://schema.org/InStock',
        inStock: true,
        rating: expect.objectContaining({
          value: 4.8,
          count: 250
        })
      })
    )
  })

  it('should handle JSON-LD with multiple products and select first', async () => {
    const html = `
      <html>
        <body>
          <script type="application/ld+json">
          [{
            "@type": "Product",
            "name": "First Product",
            "offers": {
              "price": "49.99",
              "priceCurrency": "USD"
            }
          }, {
            "@type": "Product",
            "name": "Second Product",
            "offers": {
              "price": "39.99",
              "priceCurrency": "EUR"
            }
          }]
          </script>
        </body>
      </html>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/multi')

    // Should extract the first product from the array
    expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
  })

  it('should handle JSON-LD with string image instead of array', async () => {
    const html = `
      <html>
        <body>
          <script type="application/ld+json">
          {
            "@type": "Product",
            "name": "Single Image Product",
            "image": "https://example.com/single-image.jpg",
            "offers": {
              "price": "19.99",
              "priceCurrency": "USD"
            }
          }
          </script>
        </body>
      </html>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/single-image')

    expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Single Image Product',
        images: expect.arrayContaining([
          expect.objectContaining({ url: 'https://example.com/single-image.jpg' })
        ])
      })
    )
  })
})
