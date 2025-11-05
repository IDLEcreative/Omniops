/**
 * Shopify Test Helpers
 * Mock factory and setup utilities for Shopify provider tests
 */

import type { ShopifyAPI, ShopifyOrder, ShopifyProduct } from '@/lib/shopify-api';

/**
 * Create a mock Shopify client with default implementations
 * Allows selective overrides of specific methods
 */
export function mockShopifyClient(
  overrides: Partial<jest.Mocked<ShopifyAPI>> = {}
): jest.Mocked<Partial<ShopifyAPI>> {
  const base: jest.Mocked<Partial<ShopifyAPI>> = {
    getProduct: jest.fn(),
    getProducts: jest.fn(),
    searchProducts: jest.fn(),
    getOrder: jest.fn(),
    getOrders: jest.fn(),
    getCustomer: jest.fn(),
    getCustomers: jest.fn(),
    getInventoryLevel: jest.fn(),
  };

  return {
    ...base,
    ...overrides,
  };
}

/**
 * Create a mock Shopify order with reasonable defaults
 */
export function createMockShopifyOrder(
  overrides: Partial<ShopifyOrder> = {}
): ShopifyOrder {
  return {
    id: 1001,
    admin_graphql_api_id: 'gid://shopify/Order/1001',
    app_id: null,
    browser_ip: '192.168.1.1',
    buyer_accepts_marketing: false,
    cancel_reason: null,
    cancelled_at: null,
    cart_token: 'test-cart-token',
    checkout_id: 12345,
    checkout_token: 'test-checkout-token',
    client_details: null,
    closed_at: null,
    confirmed: true,
    contact_email: 'customer@example.com',
    created_at: '2025-01-01T00:00:00Z',
    currency: 'USD',
    current_subtotal_price: '99.99',
    current_total_discounts: '0.00',
    current_total_price: '99.99',
    current_total_tax: '0.00',
    customer_locale: 'en',
    email: 'customer@example.com',
    financial_status: 'paid',
    fulfillment_status: 'unshipped',
    name: '#1001',
    note: null,
    number: 1001,
    order_number: 1001,
    phone: null,
    processed_at: '2025-01-01T00:00:00Z',
    processing_method: 'direct',
    reference: null,
    referring_site: null,
    source_name: 'web',
    subtotal_price: '99.99',
    tags: '',
    total_discounts: '0.00',
    total_line_items_price: '99.99',
    total_price: '99.99',
    total_tax: '0.00',
    total_weight: 0,
    updated_at: '2025-01-01T00:00:00Z',
    line_items: [
      {
        id: 1,
        product_id: 100,
        title: 'Test Product',
        name: 'Test Product - Default Variant',
        quantity: 1,
        price: '99.99',
        total_discount: '0.00',
        sku: 'TEST-SKU-001',
        variant_id: 1,
        variant_title: 'Default Variant',
        vendor: 'Test Vendor',
        fulfillment_service: 'manual',
        requires_shipping: true,
        gift_card: false,
        taxable: true,
      },
    ],
    billing_address: {
      id: 1,
      first_name: 'John',
      last_name: 'Doe',
      company: 'Test Company',
      address1: '123 Main St',
      address2: '',
      city: 'New York',
      province: 'NY',
      country: 'United States',
      zip: '10001',
      phone: '5551234567',
      name: 'John Doe',
      province_code: 'NY',
      country_code: 'US',
      country_name: 'United States',
      default: true,
    },
    shipping_address: {
      id: 2,
      first_name: 'John',
      last_name: 'Doe',
      company: 'Test Company',
      address1: '123 Main St',
      address2: '',
      city: 'New York',
      province: 'NY',
      country: 'United States',
      zip: '10001',
      phone: '5551234567',
      name: 'John Doe',
      province_code: 'NY',
      country_code: 'US',
      country_name: 'United States',
      default: false,
    },
    customer: {
      id: 1,
      email: 'customer@example.com',
      accepts_marketing: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      first_name: 'John',
      last_name: 'Doe',
      orders_count: 1,
      state: 'enabled',
      total_spent: '99.99',
      last_order_id: 1001,
      note: '',
      verified_email: true,
      multipass_identifier: null,
      tax_exempt: false,
      phone: '5551234567',
      tags: '',
      default_address: null,
      addresses: [],
    },
    ...overrides,
  };
}

/**
 * Create a mock Shopify product with reasonable defaults
 */
export function createMockShopifyProduct(
  overrides: Partial<ShopifyProduct> = {}
): ShopifyProduct {
  return {
    id: 100,
    title: 'Test Product',
    handle: 'test-product',
    body_html: '<p>Test product description</p>',
    vendor: 'Test Vendor',
    product_type: 'Test Type',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    published_at: '2025-01-01T00:00:00Z',
    template_suffix: null,
    status: 'active',
    published_scope: 'web',
    tags: 'test',
    admin_graphql_api_id: 'gid://shopify/Product/100',
    variants: [
      {
        id: 1,
        product_id: 100,
        title: 'Default Variant',
        price: '99.99',
        sku: 'TEST-SKU-001',
        position: 1,
        inventory_policy: 'deny',
        compare_at_price: '149.99',
        fulfillment_service: 'manual',
        inventory_management: 'shopify',
        option1: null,
        option2: null,
        option3: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        taxable: true,
        barcode: 'BARCODE123',
        grams: 0,
        image_id: null,
        inventory_item_id: 12345,
        inventory_quantity: 100,
        weight: 0,
        weight_unit: 'lb',
        requires_shipping: true,
        old_inventory_quantity: 100,
      },
    ],
    images: [],
    options: [],
    image: null,
    ...overrides,
  };
}

/**
 * Create a mock Shopify order not found error
 */
export function createOrderNotFoundError(): Error {
  const error = new Error('Not Found');
  (error as any).status = 404;
  return error;
}

/**
 * Create a mock Shopify API error
 */
export function createShopifyAPIError(message: string): Error {
  const error = new Error(message);
  (error as any).status = 500;
  return error;
}
