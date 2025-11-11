/**
 * Create mock organization data
 */
export function createMockOrganization(overrides: Partial<any> = {}) {
  return {
    id: 'org-123',
    name: 'Test Organization',
    slug: 'test-org',
    settings: {},
    plan_type: 'free',
    seat_limit: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create mock user data
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'user-123',
    email: 'test@example.com',
    created_at: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

/**
 * Create mock WooCommerce order
 */
export function createMockOrder(overrides: Partial<any> = {}) {
  return {
    id: 123,
    number: '123',
    status: 'completed',
    date_created: '2025-01-01T00:00:00',
    total: '99.99',
    currency: 'USD',
    line_items: [
      {
        name: 'Test Product',
        quantity: 1,
        total: '99.99',
      },
    ],
    billing: {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    },
    shipping: {
      address_1: '123 Main St',
      city: 'Test City',
      state: 'TS',
      postcode: '12345',
      country: 'US',
    },
    ...overrides,
  };
}

/**
 * Create mock WooCommerce product
 */
export function createMockProduct(overrides: Partial<any> = {}) {
  return {
    id: 1,
    name: 'Test Product',
    slug: 'test-product',
    price: '29.99',
    regular_price: '29.99',
    sale_price: '',
    status: 'publish',
    stock_status: 'instock',
    stock_quantity: 100,
    manage_stock: true,
    description: 'A test product',
    short_description: 'Test product',
    categories: [{ id: 1, name: 'Test Category', slug: 'test-category' }],
    images: [
      {
        src: 'https://example.com/image.jpg',
        alt: 'Test Product',
      },
    ],
    ...overrides,
  };
}
