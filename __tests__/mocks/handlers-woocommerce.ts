import { http, HttpResponse } from 'msw'

/**
 * WooCommerce REST API Mock Handlers
 *
 * Handles:
 * - Products (list, create, get)
 * - Orders (list, create)
 * - Customers (list, search)
 * - Coupons (list)
 * - System status
 * - Reports (sales, top sellers)
 * - Abandoned carts
 */

// Mock data constants
const MOCK_PRODUCTS = [
  {
    id: 1, name: 'Test Product', price: '19.99', regular_price: '19.99', sale_price: '',
    description: 'Test product description', short_description: 'Test short description',
    sku: 'TEST-001', stock_status: 'instock', stock_quantity: 100,
    images: [{ src: 'https://example.com/image.jpg', alt: 'Product image' }],
    categories: [{ id: 1, name: 'Test Category' }]
  },
  {
    id: 2, name: 'Another Product', price: '29.99', regular_price: '29.99', sale_price: '24.99',
    description: 'Another product description', short_description: 'Another short description',
    sku: 'TEST-002', stock_status: 'instock', stock_quantity: 50
  }
]

export const woocommerceHandlers = [
  // Products - List with search
  http.get('*/wp-json/wc/v3/products', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const products = search
      ? MOCK_PRODUCTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      : MOCK_PRODUCTS
    return HttpResponse.json(products)
  }),

  // Products - Create
  http.post('*/wp-json/wc/v3/products', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: Date.now(),
      ...body,
      date_created: new Date().toISOString(),
      date_modified: new Date().toISOString()
    })
  }),

  // Products - Get by ID
  http.get('*/wp-json/wc/v3/products/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: `Product ${params.id}`,
      price: '19.99',
      stock_status: 'instock'
    })
  }),

  // Orders - List with status filter
  http.get('*/wp-json/wc/v3/orders', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const orders = [
      {
        id: 1, number: '1001', status: 'processing', date_created: '2024-01-01T00:00:00', total: '19.99',
        billing: { first_name: 'John', last_name: 'Doe', email: 'john@example.com', phone: '+1234567890' },
        shipping: { first_name: 'John', last_name: 'Doe', address_1: '123 Test St', city: 'Test City', state: 'TS', postcode: '12345', country: 'US' },
        line_items: [{ id: 1, name: 'Test Product', product_id: 1, quantity: 1, total: '19.99' }]
      },
      { id: 2, number: '1002', status: 'completed', date_created: '2024-01-02T00:00:00', total: '29.99' }
    ]
    return HttpResponse.json(status ? orders.filter(o => o.status === status) : orders)
  }),

  // Orders - Create
  http.post('*/wp-json/wc/v3/orders', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: Date.now(),
      number: String(1000 + Date.now() % 1000),
      status: 'pending',
      ...body,
      date_created: new Date().toISOString()
    })
  }),

  // Customers - List with email filter
  http.get('*/wp-json/wc/v3/customers', ({ request }) => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const customers = [
      { id: 1, email: 'customer1@example.com', first_name: 'Alice', last_name: 'Smith', username: 'alice', billing: { email: 'customer1@example.com', phone: '+1234567890' } },
      { id: 2, email: 'customer2@example.com', first_name: 'Bob', last_name: 'Jones', username: 'bob' }
    ]
    return HttpResponse.json(email ? customers.filter(c => c.email === email) : customers)
  }),

  // Coupons - List
  http.get('*/wp-json/wc/v3/coupons', () => HttpResponse.json([
    { id: 1, code: 'SAVE10', amount: '10.00', discount_type: 'fixed_cart', usage_limit: 100, usage_count: 25, date_expires: null },
    { id: 2, code: 'PERCENT20', amount: '20.00', discount_type: 'percent', usage_limit: null, usage_count: 0, date_expires: '2025-12-31T23:59:59' }
  ])),

  // System Status
  http.get('*/wp-json/wc/v3/system_status', () => {
    return HttpResponse.json({
      environment: {
        home_url: 'https://test-store.com',
        site_url: 'https://test-store.com',
        wp_version: '6.3.0',
        wc_version: '8.2.0',
        wp_memory_limit: 268435456,
        wp_debug_mode: false,
        wp_cron: true,
        language: 'en_US',
        server_info: 'nginx/1.18.0',
        php_version: '8.1.0',
        mysql_version: '8.0.30'
      },
      database: {
        wc_database_version: '8.2.0',
        database_prefix: 'wp_',
        database_tables: {
          woocommerce: {
            wp_woocommerce_sessions: true,
            wp_woocommerce_api_keys: true,
            wp_woocommerce_attribute_taxonomies: true
          }
        }
      },
      active_plugins: [
        {
          plugin: 'woocommerce/woocommerce.php',
          name: 'WooCommerce',
          version: '8.2.0',
          author_name: 'Automattic'
        }
      ],
      security: {
        secure_connection: true,
        hide_errors: true
      }
    })
  }),

  // Reports - Sales
  http.get('*/wp-json/wc/v3/reports/sales', () => HttpResponse.json({
    total_sales: '5000.00', net_sales: '4500.00', average_sales: '500.00', total_orders: 100,
    total_items: 150, total_tax: '500.00', total_shipping: '200.00', total_refunds: 2,
    total_discount: '100.00', totals_grouped_by: 'day'
  })),

  // Reports - Top Sellers
  http.get('*/wp-json/wc/v3/reports/top_sellers', () => HttpResponse.json([
    { product_id: 1, product_name: 'Test Product', quantity: 50, total: '999.50' },
    { product_id: 2, product_name: 'Another Product', quantity: 30, total: '899.70' }
  ])),

  // Abandoned Carts
  http.get('*/wp-json/wc/v3/orders/abandoned', () => HttpResponse.json([{
    id: 99, status: 'pending', date_created: new Date(Date.now() - 7200000).toISOString(),
    billing: { email: 'abandoned@example.com', first_name: 'Abandoned', last_name: 'Cart' },
    line_items: [{ name: 'Abandoned Product', quantity: 2, total: '39.98' }],
    total: '39.98'
  }]))
]
