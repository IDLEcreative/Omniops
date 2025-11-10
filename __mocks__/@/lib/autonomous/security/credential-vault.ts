// Mock for @/lib/autonomous/security/credential-vault

export class CredentialVault {
  constructor(supabaseClient?: any) {
    // Accept supabaseClient but don't use it in mock
  }

  store = jest.fn();
  retrieve = jest.fn();
  update = jest.fn();
  delete = jest.fn();
  list = jest.fn();
  rotate = jest.fn();
  markForRotation = jest.fn();
  getRotationRequired = jest.fn();
  deleteExpired = jest.fn();
}

// Export any types that might be imported
export type CredentialData = any;