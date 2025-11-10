// Mock for @/lib/autonomous/security/consent-manager

// Create a proxy function that jest.fn() can properly handle
// This allows tests to spy on verifyConsent and override its implementation
export const verifyConsent = jest.fn();

// Create a mock ConsentManager class
export class ConsentManager {
  constructor(supabaseClient?: any, operations?: any) {
    // Accept supabaseClient and operations but don't use them in mock
  }

  grant = jest.fn();
  verify = jest.fn();
  revoke = jest.fn();
  revokeById = jest.fn();
  list = jest.fn();
  getById = jest.fn();
  hasPermission = jest.fn();
  extend = jest.fn();
  getStats = jest.fn();
  revokeAllForService = jest.fn();
}

export const getConsentManager = jest.fn();