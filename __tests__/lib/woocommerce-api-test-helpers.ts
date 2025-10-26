import { jest } from '@jest/globals'

export interface MockWooClient {
  get: jest.Mock
  post: jest.Mock
  put: jest.Mock
  delete: jest.Mock
}

export function createMockWooClient(): MockWooClient {
  return {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}

export const testConfig = {
  url: 'https://example.com',
  consumerKey: 'ck_test123',
  consumerSecret: 'cs_test456'
}

// Helper to inject mock client into WooCommerceAPI instance
export function injectMockClient(apiInstance: any, mockClient: MockWooClient): void {
  // Directly set the private wc property to our mock
  apiInstance['wc'] = mockClient
}
