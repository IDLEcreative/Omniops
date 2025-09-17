import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import { z } from 'zod'
import {
  createWooCommerceClient,
  getProducts,
  getProduct,
  getOrders,
  getOrder,
  getCustomerByEmail,
  getCategories,
  getProductStock,
  searchProducts,
} from '@/lib/woocommerce'

// Mock the WooCommerce Rest API
jest.mock('@woocommerce/woocommerce-rest-api')

describe('WooCommerce Integration', () => {
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

  describe('createWooCommerceClient', () => {
    it('should create a WooCommerce client with proper configuration', () => {
      createWooCommerceClient()
      
      expect(WooCommerceRestApi).toHaveBeenCalledWith({
        url: 'https://test-store.com',
        consumerKey: 'test-consumer-key',
        consumerSecret: 'test-consumer-secret',
        version: 'wc/v3',
        queryStringAuth: true,
      })
    })

    it('should return null when credentials are missing in test environment', () => {
      delete process.env.WOOCOMMERCE_URL
      
      const client = createWooCommerceClient()
      expect(client).toBeNull()
    })
    
    it('should throw error when credentials are missing in production', () => {
      const originalNodeEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      delete process.env.WOOCOMMERCE_URL
      
      expect(() => createWooCommerceClient()).toThrow(
        'WooCommerce credentials are not properly configured'
      )
      
      process.env.NODE_ENV = originalNodeEnv
    })
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
  })

  describe('getOrders', () => {
    const mockOrderData = [
      {
        id: 1,
        status: 'processing',
        currency: 'USD',
        total: '19.99',
        date_created: '2024-01-01T00:00:00',
        date_modified: '2024-01-01T00:00:00',
        customer_id: 1,
        billing: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '123-456-7890',
        },
        shipping: {
          first_name: 'John',
          last_name: 'Doe',
          address_1: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          postcode: '12345',
          country: 'US',
        },
        line_items: [
          {
            id: 1,
            name: 'Test Product',
            product_id: 1,
            quantity: 1,
            total: '19.99',
          },
        ],
      },
    ]

    it('should fetch orders with default parameters', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      const orders = await getOrders()

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders', {
        per_page: 20,
        page: 1,
      })
      expect(orders).toHaveLength(1)
      expect(orders[0].id).toBe(1)
    })

    it('should fetch orders with filters', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      await getOrders({
        customer: 1,
        status: ['processing', 'completed'],
        after: '2024-01-01T00:00:00',
        before: '2024-12-31T23:59:59',
        per_page: 50,
      })

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders', {
        customer: 1,
        status: ['processing', 'completed'],
        after: '2024-01-01T00:00:00',
        before: '2024-12-31T23:59:59',
        per_page: 50,
        page: 1,
      })
    })
  })

  describe('getOrder', () => {
    const mockOrderData = {
      id: 1,
      status: 'processing',
      currency: 'USD',
      total: '19.99',
      date_created: '2024-01-01T00:00:00',
      date_modified: '2024-01-01T00:00:00',
      customer_id: 1,
      billing: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      },
      shipping: {
        first_name: 'John',
        last_name: 'Doe',
        address_1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postcode: '12345',
        country: 'US',
      },
      line_items: [],
    }

    it('should fetch a single order by ID', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      const order = await getOrder(1)

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders/1')
      expect(order.id).toBe(1)
      expect(order.status).toBe('processing')
    })
  })

  describe('getCustomerByEmail', () => {
    const mockCustomerData = {
      id: 1,
      email: 'john@example.com',
      first_name: 'John',
      last_name: 'Doe',
      username: 'johndoe',
      date_created: '2024-01-01T00:00:00',
      date_modified: '2024-01-01T00:00:00',
      billing: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      },
      shipping: {
        first_name: 'John',
        last_name: 'Doe',
      },
    }

    it('should fetch customer by email', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: [mockCustomerData] })

      const customer = await getCustomerByEmail('john@example.com')

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('customers', {
        email: 'john@example.com',
        per_page: 1,
      })
      expect(customer?.email).toBe('john@example.com')
    })

    it('should return null when customer not found', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: [] })

      const customer = await getCustomerByEmail('notfound@example.com')

      expect(customer).toBeNull()
    })
  })

  describe('getCategories', () => {
    it('should fetch product categories', async () => {
      const mockCategories = [
        { id: 1, name: 'Category 1', slug: 'category-1' },
        { id: 2, name: 'Category 2', slug: 'category-2' },
      ]
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockCategories })

      const categories = await getCategories()

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('products/categories', {
        per_page: 100,
      })
      expect(categories).toHaveLength(2)
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
  })
})