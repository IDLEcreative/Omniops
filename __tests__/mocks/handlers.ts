import { http, HttpResponse } from 'msw'

export const handlers = [
  // OpenAI API mock
  http.post('https://api.openai.com/v1/chat/completions', () => {
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
    })
  }),

  // OpenAI Embeddings API mock
  http.post('https://api.openai.com/v1/embeddings', () => {
    return HttpResponse.json({
      object: 'list',
      data: [
        {
          object: 'embedding',
          index: 0,
          embedding: Array(1536).fill(0.1), // Mock embedding vector
        },
      ],
      model: 'text-embedding-ada-002',
    })
  }),

  // Note: Firecrawl mock removed - now using Crawlee with Playwright for scraping

  // WooCommerce API mocks
  http.get('*/wp-json/wc/v3/products', () => {
    return HttpResponse.json([
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
      },
    ])
  }),

  http.get('*/wp-json/wc/v3/orders', () => {
    return HttpResponse.json([
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
        },
        line_items: [
          {
            id: 1,
            name: 'Test Product',
            quantity: 1,
            total: '19.99',
          },
        ],
      },
    ])
  }),

  http.get('*/wp-json/wc/v3/system_status', () => {
    return HttpResponse.json({
      environment: {
        site_url: 'https://test-store.com',
        wp_version: '6.0',
        wc_version: '8.0',
      },
    })
  }),
]