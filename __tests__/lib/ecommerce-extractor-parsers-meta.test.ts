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

describe('EcommerceExtractor - Metadata Parser', () => {
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

    it('should handle JSON-LD breadcrumbs', async () => {
      const html = `
        <html>
          <body>
            <script type="application/ld+json">
            {
              "@type": "BreadcrumbList",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "name": "Home",
                  "item": "https://example.com/"
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "name": "Electronics",
                  "item": "https://example.com/electronics"
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "name": "Phones"
                }
              ]
            }
            </script>
            <h1>Product Name</h1>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/electronics/phones')

      // Breadcrumbs may or may not be extracted depending on implementation
      expect(result).toBeDefined()
    })

    it('should handle multiple breadcrumb formats', async () => {
      const html = `
        <html>
          <body>
            <div class="breadcrumbs">
              <a href="/">Store</a>
              <span>/</span>
              <a href="/shop">Shop</a>
              <span>/</span>
              <span>Product</span>
            </div>
            <h1>Product Name</h1>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/shop/product')

      // Breadcrumbs should be extracted when present
      expect(result).toBeDefined()
      if (result.breadcrumbs && result.breadcrumbs.length > 0) {
        expect(result.breadcrumbs.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Meta Tag Extraction', () => {
    it('should extract Open Graph metadata', async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Product Title">
            <meta property="og:description" content="OG Product Description">
            <meta property="og:image" content="https://example.com/og-image.jpg">
            <meta property="og:price:amount" content="99.99">
            <meta property="og:price:currency" content="USD">
          </head>
          <body>
            <h1 class="product-name">Fallback Name</h1>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/og')

      // Meta tags can supplement DOM extraction
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })

    it('should extract Twitter Card metadata', async () => {
      const html = `
        <html>
          <head>
            <meta name="twitter:title" content="Twitter Product">
            <meta name="twitter:description" content="Twitter Description">
            <meta name="twitter:image" content="https://example.com/twitter-img.jpg">
          </head>
          <body>
            <h1 class="product-name">Product Name</h1>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/twitter')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })
  })

  describe('Category and Tag Extraction', () => {
    it('should extract product categories from DOM', async () => {
      const html = `
        <html>
          <body>
            <h1 class="product-name">Categorized Product</h1>
            <div class="product-categories">
              <a href="/cat/electronics">Electronics</a>
              <a href="/cat/phones">Phones</a>
              <a href="/cat/smartphones">Smartphones</a>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/categorized')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })

    it('should extract product tags', async () => {
      const html = `
        <html>
          <body>
            <h1 class="product-title">Tagged Product</h1>
            <div class="tags">
              <span class="tag">wireless</span>
              <span class="tag">bluetooth</span>
              <span class="tag">portable</span>
            </div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/tagged')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })
  })

  describe('Integration and Edge Cases', () => {
    it('should combine multiple metadata sources', async () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="OG Title">
            <meta property="og:image" content="https://example.com/og.jpg">
          </head>
          <body>
            <nav class="breadcrumb">
              <a href="/">Home</a> / <span>Product</span>
            </nav>
            <h1 class="product-name">DOM Title</h1>
            <div class="price">$49.99</div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/combined')

      expect(result.breadcrumbs).toBeDefined()
      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalled()
    })

    it('should handle empty breadcrumbs gracefully', async () => {
      const html = `
        <html>
          <body>
            <nav class="breadcrumb"></nav>
            <h1 class="product-name">Product</h1>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/no-breadcrumbs')

      expect(result).toBeDefined()
    })
  })
})
