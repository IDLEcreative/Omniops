import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import {
  createWooCommerceClient,
  getCategories,
  getCustomerByEmail,
} from '@/lib/woocommerce'

// Mock the WooCommerce Rest API
jest.mock('@woocommerce/woocommerce-rest-api')

describe('WooCommerce Client', () => {
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

    it('should handle API errors for categories', async () => {
      const error = new Error('Category API Error')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getCategories()).rejects.toThrow('Category API Error')
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

    it('should handle API errors for customer lookup', async () => {
      const error = new Error('Customer API Error')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getCustomerByEmail('test@example.com')).rejects.toThrow('Customer API Error')
    })
  })
})
