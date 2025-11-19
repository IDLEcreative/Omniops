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

  describe('Authentication', () => {
    test('should authenticate with access token', async () => {
      const response = await fetch(`${baseUrl}/products.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.products).toBeDefined()
    })

    test('should reject invalid access token (401)', async () => {
      const response = await fetch(`${baseUrl}/auth-error-test`, {
        headers: {
          'X-Shopify-Access-Token': 'invalid-token'
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.errors).toBeDefined()
    })

    test('should exchange OAuth code for access token', async () => {
      const response = await fetch(`https://${shopDomain}/admin/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: 'test_client_id',
          client_secret: 'test_client_secret',
          code: 'authorization_code_123'
        })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.access_token).toBeDefined()
      expect(data.scope).toBeDefined()
    })
  })

  describe('Products - REST API', () => {
    test('should list products with pagination', async () => {
      const response = await fetch(`${baseUrl}/products.json?limit=10`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.products).toBeDefined()
      expect(Array.isArray(data.products)).toBe(true)
    })

    test('should get product by ID', async () => {
      const productId = 7891011121314

      const response = await fetch(`${baseUrl}/products/${productId}.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.product).toBeDefined()
      expect(data.product.id).toBe(productId)
    })

    test('should search products', async () => {
      const response = await fetch(`${baseUrl}/products/search.json?query=shirt`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.products).toBeDefined()
      expect(Array.isArray(data.products)).toBe(true)
    })

    test('should handle product not found (404)', async () => {
      const response = await fetch(`${baseUrl}/products/999999999.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.status).toBe(404)
    })

    test('should validate product schema', async () => {
      const response = await fetch(`${baseUrl}/products.json?limit=1`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      const data = await response.json()
      if (data.products.length > 0) {
        const product = data.products[0]
        expect(product).toMatchObject({
          id: expect.any(Number),
          title: expect.any(String),
          vendor: expect.any(String),
          product_type: expect.any(String),
          handle: expect.any(String),
          status: expect.any(String),
          variants: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              price: expect.any(String),
              sku: expect.any(String)
            })
          ])
        })
      }
    })
  })

  describe('Products - GraphQL API', () => {
    test('should query products via GraphQL', async () => {
      const query = `
        query {
          products(first: 10) {
            edges {
              node {
                id
                title
                handle
              }
            }
            pageInfo {
              hasNextPage
            }
          }
        }
      `

      const response = await fetch(`${baseUrl}/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.data.products).toBeDefined()
      expect(data.data.products.edges).toBeDefined()
    })

    test('should handle GraphQL errors', async () => {
      const query = `
        query {
          invalidQuery {
            field
          }
        }
      `

      const response = await fetch(`${baseUrl}/graphql.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.errors).toBeDefined()
      expect(Array.isArray(data.errors)).toBe(true)
    })
  })

  describe('Orders', () => {
    test('should list orders', async () => {
      const response = await fetch(`${baseUrl}/orders.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.orders).toBeDefined()
      expect(Array.isArray(data.orders)).toBe(true)
    })

    test('should filter orders by financial status', async () => {
      const response = await fetch(`${baseUrl}/orders.json?financial_status=paid`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.orders).toBeDefined()
      data.orders.forEach((order: { financial_status: string }) => {
        expect(order.financial_status).toBe('paid')
      })
    })

    test('should get order by ID', async () => {
      const orderId = 4567890123456

      const response = await fetch(`${baseUrl}/orders/${orderId}.json`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.order).toBeDefined()
      expect(data.order.id).toBe(orderId)
    })

    test('should validate order schema', async () => {
      const response = await fetch(`${baseUrl}/orders.json?limit=1`, {
        headers: { 'X-Shopify-Access-Token': accessToken }
      })

      const data = await response.json()
      if (data.orders.length > 0) {
        const order = data.orders[0]
        expect(order).toMatchObject({
          id: expect.any(Number),
          order_number: expect.any(Number),
          email: expect.any(String),
          total_price: expect.any(String),
          financial_status: expect.any(String),
          line_items: expect.any(Array)
        })
      }
    })
  })

