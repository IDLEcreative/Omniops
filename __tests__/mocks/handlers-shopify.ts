import { http, HttpResponse } from 'msw'

/**
 * Shopify Admin API Mock Handlers
 *
 * Handles:
 * - Products (list, get, search)
 * - Orders (list, get)
 * - Customers (list, get, search)
 * - Inventory (levels)
 * - GraphQL queries
 * - OAuth flow
 * - Webhooks
 * - Rate limiting (bucket system)
 */

// Mock data constants
const MOCK_SHOPIFY_PRODUCTS = [
  {
    id: 7891011121314,
    title: 'Sample T-Shirt',
    body_html: '<p>High quality cotton t-shirt</p>',
    vendor: 'Test Vendor',
    product_type: 'Apparel',
    handle: 'sample-t-shirt',
    status: 'active',
    variants: [
      {
        id: 43210987654321,
        product_id: 7891011121314,
        title: 'Small / Blue',
        price: '19.99',
        sku: 'TSH-SM-BLU',
        inventory_quantity: 100,
        inventory_management: 'shopify'
      }
    ],
    images: [
      {
        id: 98765432109876,
        product_id: 7891011121314,
        src: 'https://cdn.shopify.com/test-image.jpg',
        alt: 'Blue t-shirt'
      }
    ]
  },
  {
    id: 7891011121315,
    title: 'Sample Jeans',
    body_html: '<p>Comfortable denim jeans</p>',
    vendor: 'Test Vendor',
    product_type: 'Apparel',
    handle: 'sample-jeans',
    status: 'active',
    variants: [
      {
        id: 43210987654322,
        product_id: 7891011121315,
        title: 'Medium / Black',
        price: '49.99',
        sku: 'JNS-MD-BLK',
        inventory_quantity: 50,
        inventory_management: 'shopify'
      }
    ]
  }
]

const MOCK_SHOPIFY_ORDERS = [
  {
    id: 4567890123456,
    order_number: 1001,
    email: 'customer@example.com',
    created_at: '2024-01-01T00:00:00Z',
    total_price: '69.98',
    financial_status: 'paid',
    fulfillment_status: 'fulfilled',
    line_items: [
      {
        id: 11122233344455,
        product_id: 7891011121314,
        variant_id: 43210987654321,
        title: 'Sample T-Shirt',
        quantity: 2,
        price: '19.99'
      }
    ],
    customer: {
      id: 5678901234567,
      email: 'customer@example.com',
      first_name: 'John',
      last_name: 'Doe'
    }
  }
]

const MOCK_SHOPIFY_CUSTOMERS = [
  {
    id: 5678901234567,
    email: 'customer@example.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1234567890',
    created_at: '2024-01-01T00:00:00Z',
    orders_count: 5,
    total_spent: '349.95'
  }
]

export const shopifyHandlers = [
  // Products - List with pagination
  http.get('*/admin/api/:version/products.json', ({ request, params }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const since_id = url.searchParams.get('since_id')

    let products = MOCK_SHOPIFY_PRODUCTS
    if (since_id) {
      products = products.filter(p => p.id > parseInt(since_id))
    }

    return HttpResponse.json({
      products: products.slice(0, limit)
    })
  }),

  // Products - Get by ID
  http.get('*/admin/api/:version/products/:id.json', ({ params }) => {
    const product = MOCK_SHOPIFY_PRODUCTS.find(p => p.id === parseInt(params.id as string))

    if (!product) {
      return HttpResponse.json(
        { errors: 'Not Found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ product })
  }),

  // Products - Search
  http.get('*/admin/api/:version/products/search.json', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')

    const products = query
      ? MOCK_SHOPIFY_PRODUCTS.filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.body_html.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK_SHOPIFY_PRODUCTS

    return HttpResponse.json({ products })
  }),

  // Orders - List with status filter
  http.get('*/admin/api/:version/orders.json', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const financial_status = url.searchParams.get('financial_status')

    let orders = MOCK_SHOPIFY_ORDERS

    if (financial_status) {
      orders = orders.filter(o => o.financial_status === financial_status)
    }

    return HttpResponse.json({ orders })
  }),

  // Orders - Get by ID
  http.get('*/admin/api/:version/orders/:id.json', ({ params }) => {
    const order = MOCK_SHOPIFY_ORDERS.find(o => o.id === parseInt(params.id as string))

    if (!order) {
      return HttpResponse.json(
        { errors: 'Not Found' },
        { status: 404 }
      )
    }

    return HttpResponse.json({ order })
  }),

  // Customers - List
  http.get('*/admin/api/:version/customers.json', ({ request }) => {
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')

    return HttpResponse.json({
      customers: MOCK_SHOPIFY_CUSTOMERS.slice(0, limit)
    })
  }),

  // Customers - Search
  http.get('*/admin/api/:version/customers/search.json', ({ request }) => {
    const url = new URL(request.url)
    const query = url.searchParams.get('query')

    const customers = query
      ? MOCK_SHOPIFY_CUSTOMERS.filter(c =>
          c.email.includes(query) ||
          c.first_name.toLowerCase().includes(query.toLowerCase()) ||
          c.last_name.toLowerCase().includes(query.toLowerCase())
        )
      : MOCK_SHOPIFY_CUSTOMERS

    return HttpResponse.json({ customers })
  }),

  // GraphQL endpoint
  http.post('*/admin/api/:version/graphql.json', async ({ request }) => {
    const body = await request.json() as { query: string; variables?: Record<string, unknown> }

    // Parse query to determine response
    if (body.query.includes('products')) {
      return HttpResponse.json({
        data: {
          products: {
            edges: MOCK_SHOPIFY_PRODUCTS.map(p => ({
              node: p
            })),
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        }
      })
    }

    if (body.query.includes('orders')) {
      return HttpResponse.json({
        data: {
          orders: {
            edges: MOCK_SHOPIFY_ORDERS.map(o => ({
              node: o
            })),
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false
            }
          }
        }
      })
    }

    return HttpResponse.json({
      data: {},
      errors: [{ message: 'Unknown query' }]
    })
  }),

  // Inventory Levels
  http.get('*/admin/api/:version/inventory_levels.json', ({ request }) => {
    const url = new URL(request.url)
    const inventory_item_ids = url.searchParams.get('inventory_item_ids')

    return HttpResponse.json({
      inventory_levels: [
        {
          inventory_item_id: 43210987654321,
          location_id: 987654321,
          available: 100,
          updated_at: '2024-01-01T00:00:00Z'
        }
      ]
    })
  }),

  // OAuth - Access Token Exchange
  http.post('*/admin/oauth/access_token', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>

    if (!body.code || !body.client_id || !body.client_secret) {
      return HttpResponse.json(
        { error: 'invalid_request' },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      access_token: 'shpat_test_access_token_12345',
      scope: 'read_products,write_products,read_orders'
    })
  }),

  // Webhooks - Create
  http.post('*/admin/api/:version/webhooks.json', async ({ request }) => {
    const body = await request.json() as { webhook: Record<string, unknown> }

    return HttpResponse.json({
      webhook: {
        id: Date.now(),
        ...body.webhook,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    })
  }),

  // Webhooks - List
  http.get('*/admin/api/:version/webhooks.json', () => {
    return HttpResponse.json({
      webhooks: [
        {
          id: 123456789,
          address: 'https://example.com/webhooks/orders',
          topic: 'orders/create',
          format: 'json',
          created_at: '2024-01-01T00:00:00Z'
        }
      ]
    })
  }),

  // Rate Limit Error (simulate bucket exhaustion)
  http.get('*/admin/api/:version/rate-limit-test', () => {
    return HttpResponse.json(
      {
        errors: 'Exceeded 40 calls per second for api client. Reduce request rates to resume uninterrupted service.'
      },
      {
        status: 429,
        headers: {
          'X-Shopify-Shop-Api-Call-Limit': '40/40',
          'Retry-After': '2.0'
        }
      }
    )
  }),

  // API Error (401 Unauthorized)
  http.get('*/admin/api/:version/auth-error-test', () => {
    return HttpResponse.json(
      { errors: '[API] Invalid API key or access token (unrecognized login or wrong password)' },
      { status: 401 }
    )
  })
]
