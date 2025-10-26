import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { WooCommerceAPI } from '@/lib/woocommerce-api'
import {
  createMockWooClient,
  injectMockClient,
  testConfig,
  type MockWooClient
} from './woocommerce-api-test-helpers'

describe('WooCommerceAPI - Configuration & System', () => {
  let wooApi: WooCommerceAPI
  let mockWooClient: MockWooClient

  beforeEach(() => {
    jest.clearAllMocks()
    mockWooClient = createMockWooClient()
    wooApi = new WooCommerceAPI(testConfig)
    injectMockClient(wooApi, mockWooClient)
  })

  describe('Configuration', () => {
    it('should create API instance with config', () => {
      expect(() => new WooCommerceAPI(testConfig)).not.toThrow()
    })

    it('should accept optional config', () => {
      expect(() => new WooCommerceAPI()).not.toThrow()
    })

    it('should throw error when client is not configured', () => {
      const badApi = new WooCommerceAPI()
      // Don't inject mock client - let it fail naturally

      // Try to use a method that requires the client
      expect(async () => {
        await badApi.getProducts()
      }).rejects.toThrow('WooCommerce is not configured')
    })
  })

  describe('Product Variations', () => {
    it('should list product variations', async () => {
      const mockVariations = [
        { id: 1, price: '10.00', attributes: [] }
      ]

      mockWooClient.get.mockResolvedValue({ data: mockVariations })

      const variations = await wooApi.getProductVariations(1)

      expect(variations).toEqual(mockVariations)
      expect(mockWooClient.get).toHaveBeenCalledWith('products/1/variations', undefined)
    })

    it('should get single variation', async () => {
      const mockVariation = { id: 1, price: '10.00' }
      mockWooClient.get.mockResolvedValue({ data: mockVariation })

      const variation = await wooApi.getProductVariation(1, 1)

      expect(variation).toEqual(mockVariation)
      expect(mockWooClient.get).toHaveBeenCalledWith('products/1/variations/1')
    })

    it('should create product variation', async () => {
      const newVariation = {
        regular_price: '15.00',
        attributes: [{ id: 1, option: 'Red' }]
      }

      const createdVariation = { id: 3, ...newVariation }
      mockWooClient.post.mockResolvedValue({ data: createdVariation })

      const result = await wooApi.createProductVariation(1, newVariation)

      expect(result).toEqual(createdVariation)
      expect(mockWooClient.post).toHaveBeenCalledWith('products/1/variations', newVariation)
    })
  })

  describe('Reports', () => {
    it('should get sales report', async () => {
      const mockSalesReport = [{ total_sales: '5000.00' }]
      mockWooClient.get.mockResolvedValue({ data: mockSalesReport })

      const report = await wooApi.getSalesReport()

      expect(report).toEqual(mockSalesReport)
      expect(mockWooClient.get).toHaveBeenCalledWith('reports/sales', undefined)
    })

    it('should get top sellers report', async () => {
      const mockTopSellers = [{ product_id: 1, quantity: 50 }]
      mockWooClient.get.mockResolvedValue({ data: mockTopSellers })

      const report = await wooApi.getTopSellersReport()

      expect(report).toEqual(mockTopSellers)
      expect(mockWooClient.get).toHaveBeenCalledWith('reports/top_sellers', undefined)
    })
  })

  describe('System', () => {
    it('should get system status', async () => {
      const mockStatus = {
        environment: { wc_version: '8.2' }
      }

      mockWooClient.get.mockResolvedValue({ data: mockStatus })

      const status = await wooApi.getSystemStatus()

      expect(status).toEqual(mockStatus)
      expect(mockWooClient.get).toHaveBeenCalledWith('system_status')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockWooClient.get.mockRejectedValue(new Error('API Error'))

      await expect(wooApi.getProducts()).rejects.toThrow('API Error')
    })
  })
})
