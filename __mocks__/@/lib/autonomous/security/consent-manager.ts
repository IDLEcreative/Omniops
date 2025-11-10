// Mock for @/lib/autonomous/security/consent-manager

export const verifyConsent = jest.fn();

// Create a mock ConsentManager class
export class ConsentManager {
  constructor(supabaseClient?: any) {
    // Accept supabaseClient but don't use it in mock
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