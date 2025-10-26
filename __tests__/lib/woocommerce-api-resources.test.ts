import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { WooCommerceAPI } from '@/lib/woocommerce-api'
import {
  createMockWooClient,
  injectMockClient,
  testConfig,
  type MockWooClient
} from './woocommerce-api-test-helpers'

describe('WooCommerceAPI - Resource Operations', () => {
  let wooApi: WooCommerceAPI
  let mockWooClient: MockWooClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockWooClient = createMockWooClient()
    wooApi = new WooCommerceAPI(testConfig)
    injectMockClient(wooApi, mockWooClient)
  })

  describe('Products', () => {
    it('should list products', async () => {
      const mockProducts = [
        { id: 1, name: 'Product 1', price: '10.00' },
        { id: 2, name: 'Product 2', price: '20.00' }
      ]
      mockWooClient.get.mockResolvedValue({ data: mockProducts })
      const products = await wooApi.getProducts()
      expect(products).toEqual(mockProducts)
      expect(mockWooClient.get).toHaveBeenCalledWith('products', undefined)
    })

    it('should list products with filters', async () => {
      const filters = { per_page: 10, page: 2, search: 'test' }
      mockWooClient.get.mockResolvedValue({ data: [] })
      await wooApi.getProducts(filters)
      expect(mockWooClient.get).toHaveBeenCalledWith('products', filters)
    })

    it('should get single product', async () => {
      const mockProduct = { id: 1, name: 'Test Product', price: '15.00' }
      mockWooClient.get.mockResolvedValue({ data: mockProduct })
      const product = await wooApi.getProduct(1)
      expect(product).toEqual(mockProduct)
      expect(mockWooClient.get).toHaveBeenCalledWith('products/1')
    })

    it('should create product', async () => {
      const newProduct = { name: 'New Product', regular_price: '25.00', description: 'Test description' }
      const createdProduct = { id: 3, ...newProduct }
      mockWooClient.post.mockResolvedValue({ data: createdProduct })
      const result = await wooApi.createProduct(newProduct)
      expect(result).toEqual(createdProduct)
      expect(mockWooClient.post).toHaveBeenCalledWith('products', newProduct)
    })

    it('should update product', async () => {
      const updates = { price: '30.00', stock_quantity: 50 }
      const updatedProduct = { id: 1, name: 'Product 1', ...updates }

      mockWooClient.put.mockResolvedValue({ data: updatedProduct })

      const result = await wooApi.updateProduct(1, updates)

      expect(result).toEqual(updatedProduct)
      expect(mockWooClient.put).toHaveBeenCalledWith('products/1', updates)
    })

    it('should delete product', async () => {
      mockWooClient.delete.mockResolvedValue({ data: { id: 1, name: 'Deleted Product' } })

      const result = await wooApi.deleteProduct(1)

      expect(result).toEqual({ id: 1, name: 'Deleted Product' })
      expect(mockWooClient.delete).toHaveBeenCalledWith('products/1', { force: false })
    })

    it('should search products using params', async () => {
      const mockSearchResults = [
        { id: 10, name: 'Gaming Laptop', price: '999.00' }
      ]

      mockWooClient.get.mockResolvedValue({ data: mockSearchResults })

      const results = await wooApi.getProducts({
        search: 'laptop',
        per_page: 5
      })

      expect(results).toEqual(mockSearchResults)
      expect(mockWooClient.get).toHaveBeenCalledWith('products', {
        search: 'laptop',
        per_page: 5
      })
    })

    it('should batch products', async () => {
      const batchData = {
        create: [{ name: 'New Product' }],
        update: [{ id: 1, price: '15.00' }],
        delete: [3]
      }

      const mockBatchResponse = {
        create: [{ id: 5, name: 'New Product' }],
        update: [{ id: 1, price: '15.00' }],
        delete: [{ id: 3 }]
      }

      mockWooClient.post.mockResolvedValue({ data: mockBatchResponse })

      const result = await wooApi.batchProducts(batchData)

      expect(result).toEqual(mockBatchResponse)
      expect(mockWooClient.post).toHaveBeenCalledWith('products/batch', batchData)
    })
  })

  describe('Product Categories', () => {
    it('should list categories', async () => {
      const mockCategories = [{ id: 1, name: 'Category 1' }]
      mockWooClient.get.mockResolvedValue({ data: mockCategories })

      const categories = await wooApi.getProductCategories()

      expect(categories).toEqual(mockCategories)
      expect(mockWooClient.get).toHaveBeenCalledWith('products/categories', undefined)
    })

    it('should get single category', async () => {
      const mockCategory = { id: 1, name: 'Category 1' }
      mockWooClient.get.mockResolvedValue({ data: mockCategory })

      const category = await wooApi.getProductCategory(1)

      expect(category).toEqual(mockCategory)
      expect(mockWooClient.get).toHaveBeenCalledWith('products/categories/1')
    })
  })

  describe('Orders', () => {
    it('should list orders', async () => {
      const mockOrders = [
        { id: 1, number: '1001', status: 'processing' }
      ]

      mockWooClient.get.mockResolvedValue({ data: mockOrders })

      const orders = await wooApi.getOrders()

      expect(orders).toEqual(mockOrders)
      expect(mockWooClient.get).toHaveBeenCalledWith('orders', undefined)
    })

    it('should get single order', async () => {
      const mockOrder = {
        id: 1,
        number: '1001',
        status: 'processing'
      }

      mockWooClient.get.mockResolvedValue({ data: mockOrder })

      const order = await wooApi.getOrder(1)

      expect(order).toEqual(mockOrder)
      expect(mockWooClient.get).toHaveBeenCalledWith('orders/1')
    })

    it('should create order', async () => {
      const newOrder = {
        payment_method: 'stripe',
        billing: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        }
      }

      const createdOrder = { id: 3, ...newOrder }
      mockWooClient.post.mockResolvedValue({ data: createdOrder })

      const result = await wooApi.createOrder(newOrder)

      expect(result).toEqual(createdOrder)
      expect(mockWooClient.post).toHaveBeenCalledWith('orders', newOrder)
    })

    it('should update order', async () => {
      const updates = { status: 'completed' }
      const updatedOrder = { id: 1, ...updates }

      mockWooClient.put.mockResolvedValue({ data: updatedOrder })

      const result = await wooApi.updateOrder(1, updates)

      expect(result).toEqual(updatedOrder)
      expect(mockWooClient.put).toHaveBeenCalledWith('orders/1', updates)
    })
  })

  describe('Refunds', () => {
    it('should list refunds', async () => {
      const mockRefunds = [{ id: 1, amount: '10.00' }]
      mockWooClient.get.mockResolvedValue({ data: mockRefunds })

      const refunds = await wooApi.getOrderRefunds(1)

      expect(refunds).toEqual(mockRefunds)
      expect(mockWooClient.get).toHaveBeenCalledWith('orders/1/refunds', undefined)
    })

    it('should create refund', async () => {
      const refundData = { amount: '10.00', reason: 'Customer request' }
      const createdRefund = { id: 1, ...refundData }

      mockWooClient.post.mockResolvedValue({ data: createdRefund })

      const result = await wooApi.createOrderRefund(1, refundData)

      expect(result).toEqual(createdRefund)
      expect(mockWooClient.post).toHaveBeenCalledWith('orders/1/refunds', refundData)
    })
  })

  describe('Customers', () => {
    it('should list customers', async () => {
      const mockCustomers = [
        { id: 1, email: 'customer1@example.com' }
      ]

      mockWooClient.get.mockResolvedValue({ data: mockCustomers })

      const customers = await wooApi.getCustomers()

      expect(customers).toEqual(mockCustomers)
      expect(mockWooClient.get).toHaveBeenCalledWith('customers', undefined)
    })

    it('should get single customer', async () => {
      const mockCustomer = { id: 1, email: 'test@example.com' }
      mockWooClient.get.mockResolvedValue({ data: mockCustomer })

      const customer = await wooApi.getCustomer(1)

      expect(customer).toEqual(mockCustomer)
      expect(mockWooClient.get).toHaveBeenCalledWith('customers/1')
    })

    it('should create customer', async () => {
      const newCustomer = {
        email: 'new@example.com',
        first_name: 'New'
      }

      const createdCustomer = { id: 3, ...newCustomer }
      mockWooClient.post.mockResolvedValue({ data: createdCustomer })

      const result = await wooApi.createCustomer(newCustomer)

      expect(result).toEqual(createdCustomer)
      expect(mockWooClient.post).toHaveBeenCalledWith('customers', newCustomer)
    })
  })

  describe('Coupons', () => {
    it('should list coupons', async () => {
      const mockCoupons = [
        { id: 1, code: 'SAVE10', amount: '10.00' }
      ]

      mockWooClient.get.mockResolvedValue({ data: mockCoupons })

      const coupons = await wooApi.getCoupons()

      expect(coupons).toEqual(mockCoupons)
      expect(mockWooClient.get).toHaveBeenCalledWith('coupons', undefined)
    })

    it('should get single coupon', async () => {
      const mockCoupon = { id: 1, code: 'TESTCODE' }
      mockWooClient.get.mockResolvedValue({ data: mockCoupon })

      const coupon = await wooApi.getCoupon(1)

      expect(coupon).toEqual(mockCoupon)
      expect(mockWooClient.get).toHaveBeenCalledWith('coupons/1')
    })
  })
})
