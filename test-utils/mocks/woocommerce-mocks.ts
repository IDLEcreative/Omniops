import { jest } from '@jest/globals';

/**
 * Creates a properly configured mock WooCommerce client for testing
 */
export function mockWooCommerceClient(overrides?: any) {
  const defaultClient = {
    get: jest.fn<any>().mockImplementation((endpoint: string, params?: any) => {
      // Provide sensible default responses based on endpoint
      if (endpoint.startsWith('products/')) {
        const idString = endpoint.split('/')[1];
        const id = idString ? parseInt(idString) : 1;
        return Promise.resolve({
          data: {
            id,
            name: `Product ${id}`,
            slug: `product-${id}`,
            permalink: `https://store.com/product-${id}`,
            type: 'simple',
            status: 'publish',
            description: 'Product description',
            short_description: 'Short description',
            sku: `SKU-${id}`,
            price: '19.99',
            regular_price: '19.99',
            sale_price: '',
            stock_quantity: 100,
            stock_status: 'instock',
            categories: [],
            images: [],
            attributes: []
          }
        });
      }

      if (endpoint === 'products') {
        return Promise.resolve({
          data: [{
            id: 1,
            name: 'Test Product',
            slug: 'test-product',
            permalink: 'https://store.com/test-product',
            type: 'simple',
            status: 'publish',
            description: 'Test description',
            short_description: 'Short desc',
            sku: 'TEST-001',
            price: '19.99',
            regular_price: '19.99',
            sale_price: '',
            stock_quantity: 100,
            stock_status: 'instock',
            categories: [],
            images: [],
            attributes: []
          }]
        });
      }

      if (endpoint === 'orders') {
        return Promise.resolve({ data: [] });
      }

      if (endpoint === 'customers') {
        return Promise.resolve({ data: [] });
      }

      return Promise.resolve({ data: [] });
    }),
    post: jest.fn<any>().mockResolvedValue({ data: {} }),
    put: jest.fn<any>().mockResolvedValue({ data: {} }),
    delete: jest.fn<any>().mockResolvedValue({ data: { deleted: true } }),
  };

  return { ...defaultClient, ...overrides };
}

/**
 * Helper to create mock product data
 */
export function createMockProduct(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    permalink: 'https://store.com/test-product',
    type: 'simple',
    status: 'publish',
    description: 'Test product description',
    short_description: 'Short description',
    sku: 'TEST-001',
    price: '19.99',
    regular_price: '19.99',
    sale_price: '',
    stock_quantity: 100,
    stock_status: 'instock',
    categories: [{ id: 1, name: 'Test Category', slug: 'test-category' }],
    images: [{ id: 1, src: 'https://example.com/image.jpg', alt: 'Test' }],
    attributes: [],
    ...overrides
  };
}

/**
 * Helper to create mock order data
 */
export function createMockOrder(overrides?: Partial<any>) {
  return {
    id: 1,
    status: 'processing',
    currency: 'USD',
    total: '19.99',
    date_created: '2024-01-01T00:00:00',
    date_modified: '2024-01-01T00:00:00',
    customer_id: 1,
    billing: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      address_1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      postcode: '12345',
      country: 'US'
    },
    shipping: {
      first_name: 'John',
      last_name: 'Doe',
      address_1: '123 Main St',
      city: 'Anytown',
      state: 'CA',
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
      }
    ],
    ...overrides
  };
}

/**
 * Helper to create mock customer data
 */
export function createMockCustomer(overrides?: Partial<any>) {
  return {
    id: 1,
    email: 'customer@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    username: 'janedoe',
    date_created: '2024-01-01T00:00:00',
    date_modified: '2024-01-01T00:00:00',
    billing: {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'customer@example.com',
      phone: '555-0123',
      address_1: '456 Oak St',
      city: 'Somewhere',
      state: 'NY',
      postcode: '54321',
      country: 'US'
    },
    shipping: {
      first_name: 'Jane',
      last_name: 'Doe',
      address_1: '456 Oak St',
      city: 'Somewhere',
      state: 'NY',
      postcode: '54321',
      country: 'US'
    },
    ...overrides
  };
}
