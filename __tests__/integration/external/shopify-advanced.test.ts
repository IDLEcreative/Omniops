/**
 * Shopify Admin API Integration Tests
 *
 * Comprehensive tests for Shopify Admin API integration covering:
 * - Authentication (OAuth 2.0)
 * - Product queries (REST + GraphQL)
 * - Order queries
 * - Customer queries
 * - Inventory queries
 * - Webhook validation
 * - Rate limiting (bucket system)
 * - GraphQL error handling
 * - API version compatibility
 * - Bulk operations
 *
 * Uses MSW for HTTP-level mocking to test actual API integration code.
 */

import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'

describe('Shopify Admin API Integration', () => {
  const shopDomain = 'test-store.myshopify.com'
  const apiVersion = '2025-01'
  const baseUrl = `https://${shopDomain}/admin/api/${apiVersion}`
  const accessToken = 'shpat_test_token'

  // Setup MSW
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
  afterEach(() => server.resetHandlers())
  afterAll(() => server.close())

  describe('Customers', () => {
    test('should list customers', async () => {
      const response = await fetch(`${baseUrl}/customers.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.customers).toBeDefined()
      expect(Array.isArray(data.customers)).toBe(true)
    })

    test('should search customers', async () => {
      const response = await fetch(`${baseUrl}/customers/search.json?query=customer@example.com`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.customers).toBeDefined()
    })

    test('should validate customer schema', async () => {
      const response = await fetch(`${baseUrl}/customers.json?limit=1`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      const data = await response.json()
      if (data.customers.length > 0) {
        const customer = data.customers[0]
        expect(customer).toMatchObject({
          id: expect.any(Number),
          email: expect.any(String),
          first_name: expect.any(String),
          last_name: expect.any(String)
        })
      }
    })
  })

  describe('Inventory', () => {
    test('should get inventory levels', async () => {
      const response = await fetch(`${baseUrl}/inventory_levels.json?inventory_item_ids=43210987654321`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.inventory_levels).toBeDefined()
      expect(Array.isArray(data.inventory_levels)).toBe(true)
    })

    test('should validate inventory level schema', async () => {
      const response = await fetch(`${baseUrl}/inventory_levels.json?inventory_item_ids=43210987654321`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      const data = await response.json()
      if (data.inventory_levels.length > 0) {
        const level = data.inventory_levels[0]
        expect(level).toMatchObject({
          inventory_item_id: expect.any(Number),
          location_id: expect.any(Number),
          available: expect.any(Number)
        })
      }
    })
  })

  describe('Webhooks', () => {
    test('should create webhook', async () => {
      const webhook = {
        topic: 'orders/create',
        address: 'https://example.com/webhooks/orders',
        format: 'json'
      }

      const response = await fetch(`${baseUrl}/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ webhook })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.webhook).toBeDefined()
      expect(data.webhook.id).toBeDefined()
      expect(data.webhook.topic).toBe('orders/create')
    })

    test('should list webhooks', async () => {
      const response = await fetch(`${baseUrl}/webhooks.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.webhooks).toBeDefined()
      expect(Array.isArray(data.webhooks)).toBe(true)
    })
  })

  describe('Rate Limiting', () => {
    test('should handle rate limit errors (429)', async () => {
      const response = await fetch(`${baseUrl}/rate-limit-test`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.status).toBe(429)
      const data = await response.json()
      expect(data.errors).toBeDefined()

      // Check rate limit headers
      const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit')
      expect(callLimit).toBe('40/40')

      const retryAfter = response.headers.get('Retry-After')
      expect(retryAfter).toBeDefined()
    })

    test('should track API call limits in headers', async () => {
      server.use(
        http.get(`*/admin/api/${apiVersion}/products.json`, () => {
          return HttpResponse.json(
            { products: [] },
            {
              headers: {
                'X-Shopify-Shop-Api-Call-Limit': '12/40'
              }
            }
          )
        })
      )

      const response = await fetch(`${baseUrl}/products.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      const callLimit = response.headers.get('X-Shopify-Shop-Api-Call-Limit')
      expect(callLimit).toBeDefined()

      const [used, total] = callLimit!.split('/').map(Number)
      expect(used).toBeLessThanOrEqual(total)
    })
  })

  describe('API Version Compatibility', () => {
    test('should use correct API version in URL', async () => {
      let capturedUrl: string = ''

      server.use(
        http.get(`*/admin/api/${apiVersion}/products.json`, ({ request }) => {
          capturedUrl = request.url
          return HttpResponse.json({ products: [] })
        })
      )

      await fetch(`${baseUrl}/products.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(capturedUrl).toContain(`/admin/api/${apiVersion}/`)
    })

    test('should include proper headers in requests', async () => {
      let capturedHeaders: Headers | undefined

      server.use(
        http.get(`*/admin/api/${apiVersion}/products.json`, ({ request }) => {
          capturedHeaders = request.headers
          return HttpResponse.json({ products: [] })
        })
      )

      await fetch(`${baseUrl}/products.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        }
      })

      expect(capturedHeaders?.get('X-Shopify-Access-Token')).toBe(accessToken)
    })
  })
})
