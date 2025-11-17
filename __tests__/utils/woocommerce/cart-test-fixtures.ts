/**
 * Test Fixtures: WooCommerce Cart Test API
 *
 * Shared mocks and utilities for WooCommerce cart test endpoint testing.
 */

// Mock Supabase Client
export const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: {
            id: 'domain-1',
            domain: 'test.com',
            woocommerce_url: 'https://test.com',
          },
          error: null,
        })),
      })),
    })),
  })),
};

// Mock Cart Session Manager
export const mockSessionManager = {
  generateGuestId: jest.fn(() => 'guest-123'),
  getSession: jest.fn(() => Promise.resolve({
    userId: 'guest-123',
    domain: 'test.com',
    nonce: 'test-nonce',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    isGuest: true,
  })),
};

// Mock WooCommerceStoreAPI Instance
export const mockStoreAPIInstance = {
  isAvailable: jest.fn().mockResolvedValue(true),
  addItem: jest.fn(),
  getCart: jest.fn(),
  updateItem: jest.fn(),
  removeItem: jest.fn(),
  applyCoupon: jest.fn(),
  removeCoupon: jest.fn(),
  setNonce: jest.fn(),
};

// Default cart response
export const defaultCartResponse = {
  success: true,
  data: { items: [], totals: { total: '0.00' } },
};

// Reset all mocks to default state
export function resetAllMocks() {
  jest.clearAllMocks();

  // Reset environment
  process.env.WOOCOMMERCE_STORE_API_ENABLED = 'false';

  // Reset Supabase mock
  mockSupabaseClient.from = jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: {
            id: 'domain-1',
            domain: 'test.com',
            woocommerce_url: 'https://test.com',
          },
          error: null,
        })),
      })),
    })),
  }));

  // Reset Store API mock
  mockStoreAPIInstance.isAvailable.mockResolvedValue(true);
  mockStoreAPIInstance.addItem.mockResolvedValue(defaultCartResponse);
  mockStoreAPIInstance.getCart.mockResolvedValue(defaultCartResponse);
  mockStoreAPIInstance.updateItem.mockResolvedValue(defaultCartResponse);
  mockStoreAPIInstance.removeItem.mockResolvedValue(defaultCartResponse);
  mockStoreAPIInstance.applyCoupon.mockResolvedValue({
    success: true,
    data: { items: [], totals: { total: '0.00' }, coupons: [] },
  });
}

// Mock Supabase no config found (for error scenarios)
export function mockSupabaseNoConfig() {
  mockSupabaseClient.from = jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: { message: 'No config found' },
        })),
      })),
    })),
  }));
}

// Cart item factory
export function createCartItem(overrides = {}) {
  return {
    id: 123,
    name: 'Test Product',
    quantity: 2,
    prices: { price: '50.00' },
    ...overrides,
  };
}

// Cart response factory
export function createCartResponse(items = [], total = '0.00', coupons = []) {
  return {
    success: true,
    data: {
      items,
      totals: { total },
      ...(coupons.length > 0 ? { coupons } : {}),
    },
  };
}

// Request factory helpers
const BASE_URL = 'http://localhost:3000/api/woocommerce/cart-test';

export async function createGetRequest() {
  const { NextRequest } = await import('next/server');
  return new NextRequest(BASE_URL);
}

export async function createPostRequest(body: Record<string, any>) {
  const { NextRequest } = await import('next/server');
  return new NextRequest(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
