import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api'
import {
  getOrders,
  getOrder,
} from '@/lib/woocommerce'

// Mock the WooCommerce Rest API
jest.mock('@woocommerce/woocommerce-rest-api')

describe('WooCommerce Orders', () => {
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

    it('should handle API errors when fetching orders', async () => {
      const error = new Error('Orders API Error')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getOrders()).rejects.toThrow('Orders API Error')
    })

    it('should fetch orders with pagination', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      await getOrders({ page: 3, per_page: 15 })

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders', {
        per_page: 15,
        page: 3,
      })
    })

    it('should fetch orders by status', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      await getOrders({ status: ['completed'] })

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders', {
        status: ['completed'],
        per_page: 20,
        page: 1,
      })
    })

    it('should fetch orders by customer ID', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      await getOrders({ customer: 123 })

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders', {
        customer: 123,
        per_page: 20,
        page: 1,
      })
    })

    it('should fetch orders with date range', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      await getOrders({
        after: '2024-01-01T00:00:00',
        before: '2024-06-30T23:59:59',
      })

      expect(mockWooCommerceInstance.get).toHaveBeenCalledWith('orders', {
        after: '2024-01-01T00:00:00',
        before: '2024-06-30T23:59:59',
        per_page: 20,
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

    it('should handle errors when fetching single order', async () => {
      const error = new Error('Order not found')
      mockWooCommerceInstance.get.mockRejectedValue(error)

      await expect(getOrder(999)).rejects.toThrow('Order not found')
    })

    it('should fetch order with all billing information', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      const order = await getOrder(1)

      expect(order.billing).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
      })
    })

    it('should fetch order with shipping information', async () => {
      mockWooCommerceInstance.get.mockResolvedValue({ data: mockOrderData })

      const order = await getOrder(1)

      expect(order.shipping).toEqual({
        first_name: 'John',
        last_name: 'Doe',
        address_1: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        postcode: '12345',
        country: 'US',
      })
    })
  })
})
