import { http, HttpResponse, passthrough } from 'msw'

export const handlers = [
  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
    // Can vary response based on request content for more realistic testing
    return HttpResponse.json({
      id: 'chatcmpl-test',
      object: 'chat.completion',
      created: Date.now(),
      model: 'gpt-4',
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: 'This is a test response from the AI assistant.',
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150
      }
    })
  }),

  // OpenAI Embeddings API mock
  http.post('https://api.openai.com/v1/embeddings', async ({ request }) => {
    const body = await request.json() as { input: string | string[]; model?: string }
    const input = Array.isArray(body.input) ? body.input : [body.input]
    
    return HttpResponse.json({
      object: 'list',
      data: input.map((_, index) => ({
        object: 'embedding',
        index,
        embedding: Array(1536).fill(0.1), // Mock embedding vector
      })),
      model: body.model || 'text-embedding-ada-002',
      usage: {
        prompt_tokens: input.length * 10,
        total_tokens: input.length * 10
      }
    })
  }),

  // Supabase Auth mocks
  http.post('*/auth/v1/token', () => {
    // For integration tests, let real Supabase handle authentication
    // For unit tests, this will be overridden with mocks
    return passthrough()
  }),

  // Supabase Auth Admin API - Allow passthrough for RLS testing
  http.post('*/auth/v1/admin/users', () => {
    // Let the request pass through to real Supabase for RLS tests
    return passthrough()
  }),

  http.delete('*/auth/v1/admin/users/*', () => {
    // Let the request pass through to real Supabase for RLS tests
    return passthrough()
  }),

  http.post('*/auth/v1/signup', async ({ request }) => {
    const body = await request.json() as { email: string; password?: string }
    return HttpResponse.json({
      user: {
        id: 'new-user-id',
        email: body.email,
        email_confirmed_at: null,
        created_at: new Date().toISOString()
      },
      session: null // Requires email confirmation
    })
  }),

  http.get('*/auth/v1/user', ({ request }) => {
    // Default to authenticated for tests (override in specific test cases)
    // Supabase SSR client doesn't send cookies in unit tests, so we can't rely on them
    return HttpResponse.json({
      id: 'mock-user-id',
      email: 'test@example.com',
      email_confirmed_at: new Date().toISOString(),
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      role: 'authenticated'
    })
  }),

  // Supabase Database mocks - Allow passthrough for integration tests
  // For RLS testing, we need real database calls
  http.all('*/rest/v1/*', () => {
    // Let requests pass through to real Supabase for integration tests
    // Unit tests can override with specific mocks if needed
    return passthrough()
  }),

  // Note: Supabase REST API requests now use passthrough() above for integration tests
  // Unit tests can add specific mocks by prepending handlers to override passthrough

  // WooCommerce API mocks
  http.get('*/wp-json/wc/v3/products', ({ request }) => {
    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    
    let products = [
      {
        id: 1,
        name: 'Test Product',
        price: '19.99',
        regular_price: '19.99',
        sale_price: '',
        description: 'Test product description',
        short_description: 'Test short description',
        sku: 'TEST-001',
        stock_status: 'instock',
        stock_quantity: 100,
        images: [{ src: 'https://example.com/image.jpg', alt: 'Product image' }],
        categories: [{ id: 1, name: 'Test Category' }]
      },
      {
        id: 2,
        name: 'Another Product',
        price: '29.99',
        regular_price: '29.99',
        sale_price: '24.99',
        description: 'Another product description',
        short_description: 'Another short description',
        sku: 'TEST-002',
        stock_status: 'instock',
        stock_quantity: 50
      }
    ]

    if (search) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(search.toLowerCase())
      )
    }

    return HttpResponse.json(products)
  }),

  http.post('*/wp-json/wc/v3/products', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: Date.now(),
      ...body,
      date_created: new Date().toISOString(),
      date_modified: new Date().toISOString()
    })
  }),

  http.get('*/wp-json/wc/v3/products/:id', ({ params }) => {
    return HttpResponse.json({
      id: Number(params.id),
      name: `Product ${params.id}`,
      price: '19.99',
      stock_status: 'instock'
    })
  }),

  http.get('*/wp-json/wc/v3/orders', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    
    let orders = [
      {
        id: 1,
        number: '1001',
        status: 'processing',
        date_created: '2024-01-01T00:00:00',
        total: '19.99',
        billing: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890'
        },
        shipping: {
          first_name: 'John',
          last_name: 'Doe',
          address_1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postcode: '12345',
          country: 'US'
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
      {
        id: 2,
        number: '1002',
        status: 'completed',
        date_created: '2024-01-02T00:00:00',
        total: '29.99'
      }
    ]

    if (status) {
      orders = orders.filter(o => o.status === status)
    }

    return HttpResponse.json(orders)
  }),

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

  http.get('*/wp-json/wc/v3/customers', ({ request }) => {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    
    const customers = [
      {
        id: 1,
        email: 'customer1@example.com',
        first_name: 'Alice',
        last_name: 'Smith',
        username: 'alice',
        billing: {
          email: 'customer1@example.com',
          phone: '+1234567890'
        }
      },
      {
        id: 2,
        email: 'customer2@example.com',
        first_name: 'Bob',
        last_name: 'Jones',
        username: 'bob'
      }
    ]

    if (email) {
      return HttpResponse.json(
        customers.filter(c => c.email === email)
      )
    }

    return HttpResponse.json(customers)
  }),

  http.get('*/wp-json/wc/v3/coupons', () => {
    return HttpResponse.json([
      {
        id: 1,
        code: 'SAVE10',
        amount: '10.00',
        discount_type: 'fixed_cart',
        usage_limit: 100,
        usage_count: 25,
        date_expires: null
      },
      {
        id: 2,
        code: 'PERCENT20',
        amount: '20.00',
        discount_type: 'percent',
        usage_limit: null,
        usage_count: 0,
        date_expires: '2025-12-31T23:59:59'
      }
    ])
  }),

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

  // Reports endpoints
  http.get('*/wp-json/wc/v3/reports/sales', () => {
    return HttpResponse.json({
      total_sales: '5000.00',
      net_sales: '4500.00',
      average_sales: '500.00',
      total_orders: 100,
      total_items: 150,
      total_tax: '500.00',
      total_shipping: '200.00',
      total_refunds: 2,
      total_discount: '100.00',
      totals_grouped_by: 'day'
    })
  }),

  http.get('*/wp-json/wc/v3/reports/top_sellers', () => {
    return HttpResponse.json([
      {
        product_id: 1,
        product_name: 'Test Product',
        quantity: 50,
        total: '999.50'
      },
      {
        product_id: 2,
        product_name: 'Another Product',
        quantity: 30,
        total: '899.70'
      }
    ])
  }),

  // Abandoned cart endpoint
  http.get('*/wp-json/wc/v3/orders/abandoned', () => {
    return HttpResponse.json([
      {
        id: 99,
        status: 'pending',
        date_created: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        billing: {
          email: 'abandoned@example.com',
          first_name: 'Abandoned',
          last_name: 'Cart'
        },
        line_items: [
          {
            name: 'Abandoned Product',
            quantity: 2,
            total: '39.98'
          }
        ],
        total: '39.98'
      }
    ])
  })
]