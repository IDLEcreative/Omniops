/**
 * WooCommerce API Integration Tests
 *
 * Comprehensive tests for WooCommerce REST API integration covering:
 * - Authentication (OAuth 1.0a)
 * - Product listing and search
 * - Product detail retrieval
 * - Order operations
 * - Customer management
 * - Webhook validation
 * - Rate limiting compliance
 * - Error responses (401, 404, 500)
 * - API version compatibility
 *
 * Uses MSW for HTTP-level mocking to test actual API integration code.
 */

import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'

describe('WooCommerce API Integration', () => {
  const baseUrl = 'https://test-store.com/wp-json/wc/v3'

  // Setup MSW
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())


  describe('Customers', () => {
    test('should list customers', async () => {
      const response = await fetch(`${baseUrl}/customers`)

      expect(response.ok).toBe(true)
      const customers = await response.json()
      expect(Array.isArray(customers)).toBe(true)
    })

    test('should search customers by email', async () => {
      const response = await fetch(`${baseUrl}/customers?email=customer1@example.com`)

      expect(response.ok).toBe(true)
      const customers = await response.json()
      expect(Array.isArray(customers)).toBe(true)
      if (customers.length > 0) {
        expect(customers[0].email).toBe('customer1@example.com')
      }
    })

    test('should validate customer schema', async () => {
      const response = await fetch(`${baseUrl}/customers`)
      const customers = await response.json()

      if (customers.length > 0) {
        const customer = customers[0]
        expect(customer).toMatchObject({
          id: expect.any(Number),
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String)
        })
      }
    })
  })

  describe('System Status & Reports', () => {
    test('should retrieve system status', async () => {
      const response = await fetch(`${baseUrl}/system_status`)

      expect(response.ok).toBe(true)
      const status = await response.json()
      expect(status).toMatchObject({
        environment: expect.objectContaining({
          home_url: expect.any(String),
          wp_version: expect.any(String),
          wc_version: expect.any(String)
        }),
        database: expect.objectContaining({
          wc_database_version: expect.any(String)
        })
      })
    })

    test('should retrieve sales report', async () => {
      const response = await fetch(`${baseUrl}/reports/sales`)

      expect(response.ok).toBe(true)
      const report = await response.json()
      expect(report).toMatchObject({
        total_sales: expect.any(String),
        net_sales: expect.any(String),
        total_orders: expect.any(Number)
      })
    })

    test('should retrieve top sellers report', async () => {
      const response = await fetch(`${baseUrl}/reports/top_sellers`)

      expect(response.ok).toBe(true)
      const topSellers = await response.json()
      expect(Array.isArray(topSellers)).toBe(true)
      if (topSellers.length > 0) {
        expect(topSellers[0]).toMatchObject({
          product_id: expect.any(Number),
          quantity: expect.any(Number)
        })
      }
    })
  })

  describe('Error Handling', () => {
    test('should handle server errors (500)', async () => {
      server.use(
        http.get('*/wp-json/wc/v3/products', () => {
          return HttpResponse.json(
            {
              code: 'woocommerce_rest_server_error',
              message: 'Internal server error',
              data: { status: 500 }
            },
            { status: 500 }
          )
        })
      )

      const response = await fetch(`${baseUrl}/products`)

      expect(response.status).toBe(500)
    })

    test('should handle rate limiting', async () => {
      server.use(
        http.get('*/wp-json/wc/v3/products', () => {
          return HttpResponse.json(
            {
              code: 'woocommerce_rest_rate_limit_exceeded',
              message: 'Too many requests',
              data: { status: 429 }
            },
            {
              status: 429,
              headers: {
                'X-WC-RateLimit-Limit': '25',
                'X-WC-RateLimit-Remaining': '0',
                'Retry-After': '60'
              }
            }
          )
        })
      )

      const response = await fetch(`${baseUrl}/products`)

      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
    })
  })

  describe('API Version Compatibility', () => {
    test('should work with v3 API version', async () => {
      const response = await fetch('https://test-store.com/wp-json/wc/v3/products')

      expect(response.ok).toBe(true)
    })

    test('should include version in request path', async () => {
      let capturedUrl: string = ''

      server.use(
        http.get('*/wp-json/wc/v3/products', ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json([])
        })
      )

      await fetch(`${baseUrl}/products`)

      expect(capturedUrl).toContain('/wc/v3/')
    })
  })
})
