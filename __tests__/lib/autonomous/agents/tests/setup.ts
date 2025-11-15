/**
 * Shared test setup for shopify-setup-agent tests
 */

// Mock dependencies - must come before imports
export const mockGetCredentialFn = jest.fn();
export const mockStoreCredentialFn = jest.fn();
export const mockDeleteCredentialFn = jest.fn();

// Setup all mocks
export function setupMocks() {
  jest.clearAllMocks();
}

// Helper to create mock locator
export function createMockLocator(overrides: any = {}) {
  const mockLocator: any = {
    first: jest.fn(),
    inputValue: jest.fn().mockRejectedValue(new Error('Not found')),
    textContent: jest.fn().mockRejectedValue(new Error('Not found')),
    all: jest.fn().mockResolvedValue([]),
    allTextContents: jest.fn().mockResolvedValue([]),
    getAttribute: jest.fn(),
    ...overrides
  };

  mockLocator.first.mockReturnValue(mockLocator);
  return mockLocator;
}

export function createMockPage() {
  return {
    locator: jest.fn((selector: string) => createMockLocator())
  };
}
