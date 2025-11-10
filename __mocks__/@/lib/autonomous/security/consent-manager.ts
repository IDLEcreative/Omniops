// Mock for @/lib/autonomous/security/consent-manager

// Create jest mock objects that can be configured in tests
const verifyConsentMock = jest.fn();
const getConsentManagerMock = jest.fn();

// Create a mock ConsentManager class with jest.fn() methods
class ConsentManager {
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

  constructor(supabaseClient?: any, operations?: any) {
    // Accept supabaseClient and operations but don't use them in mock
  }
}

// Export the mocks - these are jest.fn() objects that tests can configure
export { verifyConsentMock as verifyConsent };
export { getConsentManagerMock as getConsentManager };
export { ConsentManager };