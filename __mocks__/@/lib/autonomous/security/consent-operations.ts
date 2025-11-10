// Mock for @/lib/autonomous/security/consent-operations

export const insertConsent = jest.fn();
export const selectConsent = jest.fn();
export const updateConsentRevoked = jest.fn();
export const updateConsentRevokedById = jest.fn();
export const updateConsentExpiry = jest.fn();
export const bulkRevokeForService = jest.fn();
export const mapToConsentRecord = jest.fn((data: any) => ({
  id: data.id,
  organizationId: data.organization_id,
  userId: data.user_id,
  service: data.service,
  operation: data.operation,
  permissions: data.permissions,
  grantedAt: data.granted_at,
  expiresAt: data.expires_at,
  revokedAt: data.revoked_at,
  isActive: data.is_active,
  consentVersion: data.consent_version,
  createdAt: data.created_at
}));