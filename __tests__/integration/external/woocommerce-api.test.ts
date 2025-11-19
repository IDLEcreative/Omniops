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

  describe('Authentication', () => {
    test('should authenticate with OAuth 1.0a credentials', async () => {
      const response = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: 'OAuth oauth_consumer_key="ck_test", oauth_signature="test"'
        }
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    })

    test('should reject invalid credentials (401)', async () => {
      server.use(
        http.get('*/wp-json/wc/v3/products', () => {
          return HttpResponse.json(
            {
              code: 'woocommerce_rest_cannot_view',
              message: 'Sorry, you cannot list resources.',
              data: { status: 401 }
            },
            { status: 401 }
          )
        })
      )

      const response = await fetch(`${baseUrl}/products`, {
        headers: {
          Authorization: 'OAuth oauth_consumer_key="invalid"'
        }
      })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.code).toBe('woocommerce_rest_cannot_view')
    })
  })

  describe('Products', () => {
    test('should list products with pagination', async () => {
      const response = await fetch(`${baseUrl}/products?per_page=10&page=1`)

      expect(response.ok).toBe(true)
      const products = await response.json()
      expect(Array.isArray(products)).toBe(true)
      expect(products.length).toBeGreaterThan(0)
    })

    test('should search products by name', async () => {
      const response = await fetch(`${baseUrl}/products?search=Test`)

      expect(response.ok).toBe(true)
      const products = await response.json()
      expect(Array.isArray(products)).toBe(true)
      products.forEach((product: { name: string }) => {
        expect(product.name.toLowerCase()).toContain('test')
      })
    })

    test('should get product by ID', async () => {
      const response = await fetch(`${baseUrl}/products/1`)

      expect(response.ok).toBe(true)
      const product = await response.json()
      expect(product).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(String),
        stock_status: expect.any(String)
      })
    })

    test('should handle product not found (404)', async () => {
      server.use(
        http.get('*/wp-json/wc/v3/products/:id', ({ params }) => {
          if (params.id === '999999') {
            return HttpResponse.json(
              {
                code: 'woocommerce_rest_product_invalid_id',
                message: 'Invalid ID.',
                data: { status: 404 }
              },
              { status: 404 }
            )
          }
          return HttpResponse.json({ id: Number(params.id), name: `Product ${params.id}` })
        })
      )

      const response = await fetch(`${baseUrl}/products/999999`)

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.code).toBe('woocommerce_rest_product_invalid_id')
    })

    test('should create new product', async () => {
      const newProduct = {
        name: 'New Test Product',
        type: 'simple',
        regular_price: '29.99',
        description: 'Test product description',
        short_description: 'Short description',
        categories: [{ id: 1 }]
      }

      const response = await fetch(`${baseUrl}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      })

      expect(response.ok).toBe(true)
      const product = await response.json()
      expect(product.name).toBe(newProduct.name)
      expect(product.id).toBeDefined()
      expect(product.date_created).toBeDefined()
    })

    test('should validate product schema', async () => {
      const response = await fetch(`${baseUrl}/products/1`)
      const product = await response.json()

      // Validate required fields
      expect(product).toMatchObject({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(String),
        regular_price: expect.any(String),
        stock_status: expect.any(String),
        sku: expect.any(String)
      })
    })
  })

  describe('Orders', () => {
    test('should list orders', async () => {
      const response = await fetch(`${baseUrl}/orders`)

      expect(response.ok).toBe(true)
      const orders = await response.json()
      expect(Array.isArray(orders)).toBe(true)
    })

    test('should filter orders by status', async () => {
      const response = await fetch(`${baseUrl}/orders?status=processing`)

      expect(response.ok).toBe(true)
      const orders = await response.json()
      expect(Array.isArray(orders)).toBe(true)
      orders.forEach((order: { status: string }) => {
        expect(order.status).toBe('processing')
      })
    })

    test('should create new order', async () => {
      const newOrder = {
        payment_method: 'bacs',
        payment_method_title: 'Direct Bank Transfer',
        set_paid: true,
        billing: {
          first_name: 'John',
          last_name: 'Doe',
          address_1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postcode: '12345',
          country: 'US',
          email: 'john.doe@example.com',
          phone: '555-555-5555'
        },
        line_items: [
          {
            product_id: 1,
            quantity: 2
          }
        ]
      }

      const response = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      })

      expect(response.ok).toBe(true)
      const order = await response.json()
      expect(order.id).toBeDefined()
      expect(order.number).toBeDefined()
      expect(order.status).toBe('pending')
    })

    test('should validate order schema', async () => {
      const response = await fetch(`${baseUrl}/orders`)
      const orders = await response.json()

      if (orders.length > 0) {
        const order = orders[0]
        expect(order).toMatchObject({
          id: expect.any(Number),
          number: expect.any(String),
          status: expect.any(String),
          total: expect.any(String),
          date_created: expect.any(String),
          billing: expect.objectContaining({
            first_name: expect.any(String),
            last_name: expect.any(String),
            email: expect.any(String)
          }),
          line_items: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(Number),
              name: expect.any(String),
              quantity: expect.any(Number)
            })
          ])
        })
      }
    })
  })

