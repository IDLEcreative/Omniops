import { describe, it, expect } from '@jest/globals'
import { ProductSchema } from '@/lib/woocommerce-full'
import type { ProductListParams } from '@/lib/woocommerce-types'

describe('WooCommerce Schema Fix - Variation Type Support', () => {
  // Helper to create a minimal valid product for testing
  const createMinimalProduct = (type: string) => ({
    id: 123,
    date_created: "2024-01-01T00:00:00Z",
    date_modified: "2024-01-01T00:00:00Z",
    name: `Test ${type} Product`,
    slug: `test-${type}-product`,
    permalink: `https://example.com/product/test-${type}-product`,
    type: type,
    status: "publish" as const,
    featured: false,
    catalog_visibility: "visible" as const,
    description: `A test ${type} product`,
    short_description: `Test ${type}`,
    sku: `TEST-${type.toUpperCase()}-001`,
    price: "29.99",
    regular_price: "29.99",
    sale_price: "",
    date_on_sale_from: null,
    date_on_sale_to: null,
    virtual: false,
    downloadable: false,
    downloads: [],
    download_limit: 0,
    download_expiry: 0,
    stock_quantity: null,
    stock_status: "instock" as const,
    manage_stock: false,
    backorders: "no" as const,
    sold_individually: false,
    weight: "0.5",
    dimensions: {
      length: "10",
      width: "5",
      height: "2"
    },
    shipping_class: "",
    shipping_class_id: 0,
    reviews_allowed: true,
    average_rating: "0",
    rating_count: 0,
    categories: [],
    tags: [],
    images: [],
    attributes: [],
    default_attributes: [],
    variations: [],
    grouped_products: [],
    related_ids: [],
    upsell_ids: [],
    cross_sell_ids: [],
    parent_id: 0,
    meta_data: []
  })

  describe('ProductSchema type validation', () => {
    it('should accept standard WooCommerce product types', () => {
      const standardTypes = ['simple', 'grouped', 'external', 'variable']
      
      standardTypes.forEach(type => {
        const product = createMinimalProduct(type)
        expect(() => ProductSchema.parse(product)).not.toThrow()
      })
    })

    it('should accept "variation" type (the main fix)', () => {
      const product = createMinimalProduct('variation')
      expect(() => ProductSchema.parse(product)).not.toThrow()
    })

    it('should accept common plugin product types', () => {
      const pluginTypes = ['bundle', 'subscription', 'booking', 'composite']
      
      pluginTypes.forEach(type => {
        const product = createMinimalProduct(type)
        expect(() => ProductSchema.parse(product)).not.toThrow()
      })
    })

    it('should accept unknown custom product types with string fallback', () => {
      const customTypes = ['custom-type', 'special-product', 'membership']
      
      customTypes.forEach(type => {
        const product = createMinimalProduct(type)
        expect(() => ProductSchema.parse(product)).not.toThrow()
      })
    })

    it('should reject non-string types', () => {
      const invalidProduct = {
        ...createMinimalProduct('simple'),
        type: 123 // Invalid: should be string
      }
      
      expect(() => ProductSchema.parse(invalidProduct)).toThrow()
    })
  })

  describe('ProductListParams type compatibility', () => {
    it('should accept standard types in ProductListParams', () => {
      const params: ProductListParams = { type: 'simple' }
      expect(params.type).toBe('simple')
    })

    it('should accept "variation" type in ProductListParams', () => {
      const params: ProductListParams = { type: 'variation' }
      expect(params.type).toBe('variation')
    })

    it('should accept plugin types in ProductListParams', () => {
      const params: ProductListParams = { type: 'bundle' }
      expect(params.type).toBe('bundle')
    })

    it('should accept custom string types in ProductListParams', () => {
      const params: ProductListParams = { type: 'custom-type' }
      expect(params.type).toBe('custom-type')
    })
  })

  describe('Regression test for the original error', () => {
    it('should not throw the original ZodError for variation type', () => {
      const variationProduct = createMinimalProduct('variation')
      
      // This should NOT throw: 
      // "Invalid enum value. Expected 'simple' | 'grouped' | 'external' | 'variable', received 'variation'"
      expect(() => {
        ProductSchema.parse(variationProduct)
      }).not.toThrow(/Invalid enum value.*received 'variation'/)
    })
  })
})