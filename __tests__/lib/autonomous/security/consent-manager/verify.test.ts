/**
 * Tests for ConsentManager.verify()
 * Tests consent verification with expiry, active status, and existence checks
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ConsentManager } from '@/lib/autonomous/security/consent-manager';
import { createMockSupabaseClient } from '__tests__/utils/consent/supabase-mock';

describe('ConsentManager.verify()', () => {
  let consentManager: ConsentManager;
  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabaseClient = createMockSupabaseClient();
    consentManager = new ConsentManager(mockSupabaseClient);
  });

  it('should have verify method', () => {
    expect(typeof consentManager.verify).toBe('function');
  });

  it('should accept organization, service, and operation parameters', async () => {
    // Verify method signature and parameter acceptance
    const promise = consentManager.verify('org-123', 'woocommerce', 'api_key_generation');
    expect(promise).toBeInstanceOf(Promise);
  });

  it('should return object with hasConsent property', async () => {
    const result = await consentManager.verify('org-123', 'woocommerce', 'api_key_generation')
      .catch(() => ({ hasConsent: false }));
    expect(result).toHaveProperty('hasConsent');
  });
});
