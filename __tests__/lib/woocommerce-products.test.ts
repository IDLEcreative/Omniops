import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import { z } from 'zod'
import {
  getProducts,
  getProduct,
  getProductStock,
  searchProducts,
} from '@/lib/woocommerce'

// Mock the WooCommerce Rest API
jest.mock('@woocommerce/woocommerce-rest-api')

describe('WooCommerce Products', () => {
  let mockWooCommerceInstance: jest.Mocked<WooCommerceRestApi>

  beforeEach(() => {
    jest.clearAllMocks()

    // Set up environment variables
    process.env.WOOCOMMERCE_URL = 'https://test-store.com'
    process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key'
    process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret'

    // Create mock instance
    mockWooCommerceInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    }

    // Mock the constructor
    ;(WooCommerceRestApi as jest.MockedClass<typeof WooCommerceRestApi>).mockImplementation(
      () => mockWooCommerceInstance
    )
  })

  describe('getProducts', () => {
    const mockProductData = [
      {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        permalink: 'https://test-store.com/product/test-product',
        type: 'simple',
        status: 'publish',
        description: 'Test description',
        short_description: 'Short desc',
        sku: 'TEST-001',
        price: '19.99',
        regular_price: '19.99',
        sale_price: '',
        stock_quantity: 100,
        stock_status: 'instock',
        categories: [{ id: 1, name: 'Test Category', slug: 'test-category' }],
        images: [{ id: 1, src: 'https://example.com/image.jpg', alt: 'Test' }],
        attributes: [],
      },
    ]

    it('should fetch products with default parameters', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockProductData })

      const products = await getProducts()

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('products', {
        per_page: 20,
        page: 1,
      })
      expect(products).toHaveLength(1)
      expect(products[0]).toMatchObject({
        id: 1,
        name: 'Test Product',
        price: '19.99',
      })
    })

    it('should fetch products with custom parameters', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockProductData })

      await getProducts({
        search: 'test',
        category: 5,
        per_page: 10,
        page: 2,
        orderby: 'price',
        order: 'desc',
        status: 'publish',
        stock_status: 'instock',
      })

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('products', {
        search: 'test',
        category: 5,
        per_page: 10,
        page: 2,
        orderby: 'price',
        order: 'desc',
        status: 'publish',
        stock_status: 'instock',
      })
    })

    it('should handle API errors', async () => {
      const error = new Error('API Error')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getProducts()).rejects.toThrow('API Error')
    })

    it('should validate product schema', async () => {
      const invalidProductData = [{ id: 1, name: 'Invalid Product' }] // Missing required fields
      mockWooCommerceInstance.get.mockResolvedValue({ data: invalidProductData })

      await expect(getProducts()).rejects.toThrow(z.ZodError)
    })
  })

  describe('getProduct', () => {
    const mockProductData = {
      id: 1,
      name: 'Test Product',
      slug: 'test-product',
      permalink: 'https://test-store.com/product/test-product',
      type: 'simple',
      status: 'publish',
      description: 'Test description',
      short_description: 'Short desc',
      sku: 'TEST-001',
      price: '19.99',
      regular_price: '19.99',
      sale_price: '',
      stock_quantity: 100,
      stock_status: 'instock',
      categories: [],
      images: [],
      attributes: [],
    }

    it('should fetch a single product by ID', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockProductData })

      const product = await getProduct(1)

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('products/1')
      expect(product.id).toBe(1)
      expect(product.name).toBe('Test Product')
    })

    it('should handle errors when fetching single product', async () => {
      const error = new Error('Product not found')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getProduct(999)).rejects.toThrow('Product not found')
    })
  })

  describe('getProductStock', () => {
    it('should fetch product stock status', async () => {
      const mockProductData = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        permalink: 'https://test-store.com/product/test-product',
        type: 'simple',
        status: 'publish',
        description: 'Test description',
        short_description: 'Short desc',
        price: '19.99',
        regular_price: '19.99',
        stock_quantity: 50,
        stock_status: 'instock',
        categories: [],
        images: [],
        attributes: [],
      }
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockProductData })

      const stock = await getProductStock(1)

      expect(stock).toEqual({
        inStock: true,
        quantity: 50,
        status: 'instock',
      })
    })

    it('should handle out of stock products', async () => {
      const mockProductData = {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        permalink: 'https://test-store.com/product/test-product',
        type: 'simple',
        status: 'publish',
        description: 'Test description',
        short_description: 'Short desc',
        price: '19.99',
        regular_price: '19.99',
        stock_quantity: 0,
        stock_status: 'outofstock',
        categories: [],
        images: [],
        attributes: [],
      }
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockProductData })

      const stock = await getProductStock(1)

      expect(stock).toEqual({
        inStock: false,
        quantity: 0,
        status: 'outofstock',
      })
    })

    it('should handle errors when fetching stock', async () => {
      const error = new Error('Stock check failed')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getProductStock(1)).rejects.toThrow('Stock check failed')
    })
  })

  describe('searchProducts', () => {
    const mockProductData = [
      {
        id: 1,
        name: 'Test Product',
        slug: 'test-product',
        permalink: 'https://test-store.com/product/test-product',
        type: 'simple',
        status: 'publish',
        description: 'Test description',
        short_description: 'Short desc',
        price: '19.99',
        regular_price: '19.99',
        stock_quantity: 100,
        stock_status: 'instock',
        categories: [],
        images: [],
        attributes: [],
      },
    ]

    it('should search products with query', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockProductData })

      const products = await searchProducts('test', 5)

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('products', {
        search: 'test',
        per_page: 5,
        status: 'publish',
      })
      expect(products).toHaveLength(1)
      expect(products[0].name).toBe('Test Product')
    })

    it('should use default limit of 10', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: [] })

      await searchProducts('test')

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('products', {
        search: 'test',
        per_page: 10,
        status: 'publish',
      })
    })

    it('should handle search errors', async () => {
      const error = new Error('Search failed')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(searchProducts('test')).rejects.toThrow('Search failed')
    })
  })
})
