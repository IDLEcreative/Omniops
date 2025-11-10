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

describe('EcommerceExtractor - Microdata Parser', () => {
  beforeEach(() => {
    setupMockDefaults()
  })

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
        price: 39.99,
        currency: 'USD',
        availability: 'https://schema.org/InStock',
        inStock: true
      })
    )
  })

  it('should extract basic microdata with price currency', async () => {
    const html = `
      <html>
        <body>
          <div itemtype="https://schema.org/Product">
            <span itemprop="name">Priced Microdata Product</span>
            <span itemprop="price" content="59.99">$59.99</span>
            <meta itemprop="priceCurrency" content="EUR">
          </div>
        </body>
      </html>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/priced-microdata')

    expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Priced Microdata Product',
        price: 59.99,
        currency: 'EUR'
      })
    )
  })

  it('should handle microdata with multiple images', async () => {
    const html = `
      <html>
        <body>
          <div itemtype="https://schema.org/Product">
            <span itemprop="name">Multi-Image Product</span>
            <img itemprop="image" src="https://example.com/img1.jpg">
            <img itemprop="image" src="https://example.com/img2.jpg">
            <img itemprop="image" src="https://example.com/img3.jpg">
          </div>
        </body>
      </html>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/multi-image')

    expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Multi-Image Product',
        images: expect.arrayContaining([
          expect.objectContaining({ url: 'https://example.com/img1.jpg' }),
          expect.objectContaining({ url: 'https://example.com/img2.jpg' }),
          expect.objectContaining({ url: 'https://example.com/img3.jpg' })
        ])
      })
    )
  })

  it('should extract brand from nested itemscope', async () => {
    const html = `
      <html>
        <body>
          <div itemtype="https://schema.org/Product">
            <span itemprop="name">Brand Test Product</span>
            <div itemprop="brand" itemtype="https://schema.org/Brand">
              <span itemprop="name">Premium Brand</span>
            </div>
          </div>
        </body>
      </html>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/brand-test')

    expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Brand Test Product',
        brand: 'Premium Brand'
      })
    )
  })
})

describe('EcommerceExtractor - Error Handling', () => {
  beforeEach(() => {
    setupMockDefaults()
  })

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

  it('should handle empty HTML gracefully', async () => {
    const html = '<html><body></body></html>'

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/empty')

    expect(result).toBeDefined()
    expect(result.products).toEqual([])
  })

  it('should handle malformed HTML structure', async () => {
    const html = `
      <html>
        <body>
          <div class="product">
            <h1>Unclosed Product
            <span class="price">$99.99
          </div>
        </body>
    `

    const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/malformed')

    expect(result).toBeDefined()
  })
})
