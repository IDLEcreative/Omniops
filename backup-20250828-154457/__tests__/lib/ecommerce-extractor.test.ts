import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals'
import { EcommerceExtractor, EcommerceExtractedContent } from '@/lib/ecommerce-extractor'
import * as cheerio from 'cheerio'

// Mock the dependencies
const mockContentExtractor = {
  extractWithReadability: jest.fn()
}

const mockPatternLearner = {
  applyPatterns: jest.fn(),
  learnFromExtraction: jest.fn()
}

const mockProductNormalizer = {
  normalizeProduct: jest.fn()
}

// Mock the imports
jest.mock('@/lib/content-extractor', () => ({
  ContentExtractor: mockContentExtractor
}))

jest.mock('@/lib/pattern-learner', () => ({
  PatternLearner: mockPatternLearner
}))

jest.mock('@/lib/product-normalizer', () => ({
  ProductNormalizer: mockProductNormalizer
}))

describe('EcommerceExtractor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock returns
    mockContentExtractor.extractWithReadability.mockReturnValue({
      title: 'Test Page',
      content: 'Test content',
      url: 'https://example.com',
      timestamp: new Date().toISOString()
    })

    mockProductNormalizer.normalizeProduct.mockImplementation((product) => ({
      name: product.name || 'Normalized Product',
      scrapedAt: new Date().toISOString(),
      ...product
    }))

    mockPatternLearner.applyPatterns.mockResolvedValue(null)
    mockPatternLearner.learnFromExtraction.mockResolvedValue(undefined)
  })

  describe('Platform Detection', () => {
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

    it('should detect Shopify platform', async () => {
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

    it('should detect Magento platform', async () => {
      const html = `
        <html>
          <body class="catalog-product-view">
            <div class="magento-init">Product</div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://magento.example.com')
      
      expect(result.platform).toBe('magento')
    })

    it('should detect generic e-commerce based on schema.org', async () => {
      const html = `
        <html>
          <body>
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Product Name</span>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://generic.example.com')
      
      expect(result.platform).toBe('generic-ecommerce')
    })

    it('should return undefined platform when no e-commerce indicators found', async () => {
      const html = `
        <html>
          <body>
            <div>Just a regular website</div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://blog.example.com')
      
      expect(result.platform).toBeUndefined()
    })
  })

  describe('Page Type Detection', () => {
    it('should detect product page from URL patterns', async () => {
      const html = '<html><body></body></html>'
      
      const productUrls = [
        'https://example.com/product/awesome-widget',
        'https://example.com/p/123456',
        'https://shop.example.com/products/widget'
      ]
      
      for (const url of productUrls) {
        const result = await EcommerceExtractor.extractEcommerce(html, url)
        expect(result.pageType).toBe('product')
      }
    })

    it('should detect category page from URL patterns', async () => {
      const html = '<html><body></body></html>'
      
      const categoryUrls = [
        'https://example.com/category/electronics',
        'https://example.com/shop/clothing',
        'https://example.com/collection/summer'
      ]
      
      for (const url of categoryUrls) {
        const result = await EcommerceExtractor.extractEcommerce(html, url)
        expect(result.pageType).toBe('category')
      }
    })

    it('should detect search page from URL patterns', async () => {
      const html = '<html><body></body></html>'
      
      const searchUrls = [
        'https://example.com/search?q=laptop',
        'https://example.com?s=phone',
        'https://example.com/search'
      ]
      
      for (const url of searchUrls) {
        const result = await EcommerceExtractor.extractEcommerce(html, url)
        expect(result.pageType).toBe('search')
      }
    })

    it('should detect product page from content structure', async () => {
      const html = `
        <html>
          <body>
            <div itemtype="https://schema.org/Product">
              <span itemprop="name">Single Product</span>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/some-page')
      
      expect(result.pageType).toBe('product')
    })

    it('should detect category page from content structure', async () => {
      const html = `
        <html>
          <body>
            <div class="product-grid">
              <div class="product">Product 1</div>
              <div class="product">Product 2</div>
              <div class="product">Product 3</div>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/some-page')
      
      expect(result.pageType).toBe('category')
    })
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
          price: expect.objectContaining({
            current: '29.99',
            currency: 'USD'
          }),
          availability: expect.objectContaining({
            inStock: true
          }),
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
          price: expect.objectContaining({
            current: '15.99',
            currency: 'EUR'
          })
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
          price: expect.objectContaining({
            current: '39.99',
            currency: 'USD'
          })
        })
      )
    })
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
            current: '£45.99'
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
  })

  describe('Product Listing Extraction', () => {
    beforeEach(() => {
      mockProductNormalizer.normalizeProduct.mockImplementation((product, index) => ({
        name: product.name,
        price: { amount: parseFloat(product.price?.current?.replace(/[^0-9.]/g, '') || '0'), currency: 'USD', formatted: product.price?.current || '$0' },
        scrapedAt: new Date().toISOString()
      }))
    })

    it('should extract multiple products from listing page', async () => {
      const html = `
        <html>
          <body>
            <div class="product-grid">
              <div class="product">
                <h3>Product 1</h3>
                <span class="price">$19.99</span>
                <img src="product1.jpg" alt="Product 1">
              </div>
              <div class="product">
                <h3>Product 2</h3>
                <span class="price">$29.99</span>
                <img src="product2.jpg" alt="Product 2">
              </div>
              <div class="product">
                <h3>Product 3</h3>
                <span class="price">$39.99</span>
                <img src="product3.jpg" alt="Product 3">
              </div>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category/products')
      
      expect(result.pageType).toBe('category')
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledTimes(3)
      expect(mockPatternLearner.learnFromExtraction).toHaveBeenCalled()
    })

    it('should handle listing with missing product information', async () => {
      const html = `
        <html>
          <body>
            <div class="product-grid">
              <div class="product">
                <h3>Valid Product</h3>
                <span class="price">$19.99</span>
              </div>
              <div class="product">
                <!-- Product without name -->
                <span class="price">$29.99</span>
              </div>
              <div class="product">
                <h3>Another Valid Product</h3>
                <span class="price">$39.99</span>
              </div>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category/mixed')
      
      // Should only process products with names
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledTimes(2)
    })
  })

  describe('Pagination Extraction', () => {
    it('should extract pagination information', async () => {
      const html = `
        <html>
          <body>
            <div class="product-grid">
              <div class="product"><h3>Product</h3></div>
            </div>
            <nav class="pagination">
              <a href="/page/1">1</a>
              <span class="current">2</span>
              <a href="/page/3">3</a>
              <a href="/page/4">4</a>
              <a href="/page/5">5</a>
              <a class="next" href="/page/3">Next</a>
            </nav>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category?page=2')
      
      expect(result.pagination).toBeDefined()
      expect(result.pagination?.current).toBe(2)
      expect(result.pagination?.total).toBe(5)
      expect(result.pagination?.nextUrl).toBe('https://example.com/page/3')
    })

    it('should handle pagination without total pages', async () => {
      const html = `
        <html>
          <body>
            <div class="product-grid">
              <div class="product"><h3>Product</h3></div>
            </div>
            <nav class="pagination">
              <span class="current">1</span>
              <a class="next" href="/page/2">Next</a>
            </nav>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category')
      
      expect(result.pagination?.current).toBe(1)
      expect(result.pagination?.total).toBeUndefined()
      expect(result.pagination?.nextUrl).toBe('https://example.com/page/2')
    })
  })

  describe('Breadcrumb Extraction', () => {
    it('should extract breadcrumbs', async () => {
      const html = `
        <html>
          <body>
            <nav class="breadcrumb">
              <a href="/">Home</a>
              <span class="separator">/</span>
              <a href="/category">Category</a>
              <span class="separator">/</span>
              <span>Current Page</span>
            </nav>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category/current')
      
      expect(result.breadcrumbs).toHaveLength(3)
      expect(result.breadcrumbs?.[0]).toEqual({ name: 'Home', url: '/' })
      expect(result.breadcrumbs?.[1]).toEqual({ name: 'Category', url: '/category' })
      expect(result.breadcrumbs?.[2]).toEqual({ name: 'Current Page', url: undefined })
    })

    it('should filter out separator symbols', async () => {
      const html = `
        <html>
          <body>
            <div class="breadcrumbs">
              <a href="/">Home</a>
              <span>></span>
              <a href="/cat">Products</a>
              <span>></span>
              <span>Item</span>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/cat/item')
      
      expect(result.breadcrumbs).toHaveLength(3)
      expect(result.breadcrumbs?.some(b => b.name === '>')).toBe(false)
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
      
      // The extraction would call ProductNormalizer.normalizeProduct with specifications
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
  })

  describe('Total Product Count Extraction', () => {
    it('should extract total product count from result text', async () => {
      const html = `
        <html>
          <body>
            <div class="woocommerce-result-count">Showing 1–12 of 48 results</div>
            <div class="product-grid">
              <div class="product"><h3>Product</h3></div>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category')
      
      expect(result.totalProducts).toBe(48)
    })

    it('should fall back to counting products on page', async () => {
      const html = `
        <html>
          <body>
            <div class="product-grid">
              <div class="product"><h3>Product 1</h3></div>
              <div class="product"><h3>Product 2</h3></div>
              <div class="product"><h3>Product 3</h3></div>
            </div>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/category')
      
      expect(result.totalProducts).toBe(3)
    })
  })

  describe('Pattern Learning Integration', () => {
    it('should try learned patterns first', async () => {
      const mockLearnedProduct = { name: 'Learned Product', price: '$99.99' }
      mockPatternLearner.applyPatterns.mockResolvedValue(mockLearnedProduct)
      
      const html = `
        <html>
          <body>
            <h1>Different Product Name</h1>
            <span class="price">$50.00</span>
          </body>
        </html>
      `
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/learned')
      
      expect(mockPatternLearner.applyPatterns).toHaveBeenCalledWith('https://example.com/product/learned', expect.any(Object))
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining(mockLearnedProduct)
      )
    })

    it('should learn from successful extractions', async () => {
      const html = `
        <html>
          <body class="woocommerce-page">
            <h1 class="product-title">Learning Product</h1>
            <span class="price">$75.00</span>
          </body>
        </html>
      `
      
      mockProductNormalizer.normalizeProduct.mockReturnValue({
        name: 'Learning Product',
        price: { amount: 75, currency: 'USD', formatted: '$75.00' },
        scrapedAt: new Date().toISOString()
      })
      
      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/learning')
      
      expect(mockPatternLearner.learnFromExtraction).toHaveBeenCalledWith(
        'https://example.com/product/learning',
        expect.arrayContaining([
          expect.objectContaining({ name: 'Learning Product' })
        ]),
        expect.objectContaining({
          platform: 'woocommerce'
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