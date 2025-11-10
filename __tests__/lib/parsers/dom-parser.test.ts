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

describe('EcommerceExtractor - DOM Parser', () => {
  beforeEach(() => {
    setupMockDefaults()
  })

  describe('Basic DOM Extraction', () => {
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
          price: 45.99,
          currency: 'GBP',
          availability: 'In Stock',
          inStock: true,
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

  describe('Specification Extraction', () => {
    it('should extract product specifications from tables', async () => {
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

    it('should extract specifications from definition lists', async () => {
      const html = `
        <html>
          <body>
            <h1>Product with DL Specs</h1>
            <dl class="product-specs">
              <dt>Dimensions</dt>
              <dd>10x20x30 cm</dd>
              <dt>Weight</dt>
              <dd>1.5kg</dd>
            </dl>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/dl-specs')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          specifications: expect.arrayContaining([
            expect.objectContaining({ name: 'Dimensions', value: '10x20x30 cm' }),
            expect.objectContaining({ name: 'Weight', value: '1.5kg' })
          ])
        })
      )
    })
  })

  describe('Variant Extraction', () => {
    it('should extract product variants from select elements', async () => {
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

    it('should handle product page without variants', async () => {
      const html = `
        <html>
          <body>
            <h1>Simple Product</h1>
            <div class="price">$29.99</div>
            <div class="description">No variants available</div>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/product/simple')

      expect(mockProductNormalizer.normalizeProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Simple Product',
          variants: []
        })
      )
    })
  })

  describe('Breadcrumb Extraction', () => {
    it('should extract breadcrumbs from navigation', async () => {
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

    it('should extract breadcrumbs from lists with links', async () => {
      const html = `
        <html>
          <body>
            <ol class="breadcrumb">
              <li><a href="/">Home</a></li>
              <li><a href="/shop">Shop</a></li>
            </ol>
          </body>
        </html>
      `

      const result = await EcommerceExtractor.extractEcommerce(html, 'https://example.com/shop/product')

      expect(result.breadcrumbs).toBeDefined()
      expect(result.breadcrumbs?.length).toBeGreaterThanOrEqual(2)
      expect(result.breadcrumbs?.[0].name).toBe('Home')
      expect(result.breadcrumbs?.[1].name).toBe('Shop')
    })
  })
})
