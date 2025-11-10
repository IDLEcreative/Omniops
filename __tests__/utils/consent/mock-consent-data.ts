/**
 * Mock consent data for testing
 * Purpose: Provides reusable consent record fixtures
 */

import type { ConsentRequest } from '@/lib/autonomous/security/consent-types';

export const validConsentRequest: ConsentRequest = {
  service: 'woocommerce',
  operation: 'api_key_generation',
  permissions: ['read_products', 'create_api_keys']
};

export const invalidEmptyPermissionsRequest: ConsentRequest = {
  service: 'woocommerce',
  operation: 'api_key_generation',
  permissions: []
};

export const consentWithExpiryRequest: ConsentRequest = {
  ...validConsentRequest,
  expiresAt: new Date('2025-12-31')
};

export const mockConsentRecord = {
  id: 'consent-123',
  organization_id: 'org-123',
  user_id: 'user-456',
  service: 'woocommerce',
  operation: 'api_key_generation',
  permissions: ['read_products', 'create_api_keys'],
  granted_at: new Date().toISOString(),
  expires_at: null,
  revoked_at: null,
  is_active: true,
  consent_version: '1.0',
  created_at: new Date().toISOString()
};

export const mockExpiredConsentRecord = {
  id: 'consent-expired',
  organization_id: 'org-123',
  user_id: 'user-456',
  service: 'woocommerce',
  operation: 'api_key_generation',
  permissions: ['read_products'],
  granted_at: (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  })(),
  expires_at: (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  })(),
  revoked_at: null,
  is_active: true,
  consent_version: '1.0',
  created_at: (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString();
  })()
};

export const mockFutureConsentRecord = {
  id: 'consent-future',
  organization_id: 'org-123',
  user_id: 'user-456',
  service: 'woocommerce',
  operation: 'api_key_generation',
  permissions: ['read_products'],
  granted_at: new Date().toISOString(),
  expires_at: (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString();
  })(),
  revoked_at: null,
  is_active: true,
  consent_version: '1.0',
  created_at: new Date().toISOString()
};

export const mockConsentList = [
  {
    id: 'consent-1',
    organization_id: 'org-123',
    user_id: 'user-456',
    service: 'woocommerce',
    operation: 'api_key_generation',
    permissions: ['read_products'],
    granted_at: new Date().toISOString(),
    expires_at: null,
    revoked_at: null,
    is_active: true,
    consent_version: '1.0',
    created_at: new Date().toISOString()
  },
  {
    id: 'consent-2',
    organization_id: 'org-123',
    user_id: 'user-789',
    service: 'shopify',
    operation: 'product_import',
    permissions: ['read', 'write'],
    granted_at: new Date().toISOString(),
    expires_at: null,
    revoked_at: new Date().toISOString(),
    is_active: false,
    consent_version: '1.0',
    created_at: new Date().toISOString()
  }
];
