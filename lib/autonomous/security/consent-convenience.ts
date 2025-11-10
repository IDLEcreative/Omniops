/**
 * Autonomous Consent Convenience Functions
 * Simplified API for common consent operations
 */

import { getConsentManager } from './consent-manager';
import type { ConsentRequest, ConsentRecord, ConsentVerification } from './consent-types';

/**
 * Grant consent (convenience function)
 */
export async function grantConsent(
  organizationId: string,
  userId: string,
  request: ConsentRequest
): Promise<ConsentRecord> {
  const consent = getConsentManager();
  return consent.grant(organizationId, userId, request);
}

/**
 * Verify consent (convenience function)
 */
export async function verifyConsent(
  organizationId: string,
  service: string,
  operation: string
): Promise<ConsentVerification> {
  const consent = getConsentManager();
  return consent.verify(organizationId, service, operation);
}

/**
 * Revoke consent (convenience function)
 */
export async function revokeConsent(
  organizationId: string,
  service: string,
  operation: string
): Promise<void> {
  const consent = getConsentManager();
  return consent.revoke(organizationId, service, operation);
}

/**
 * Check if customer has consent (simplified boolean check)
 */
export async function hasConsent(
  organizationId: string,
  service: string,
  operation: string
): Promise<boolean> {
  const consent = getConsentManager();
  const verification = await consent.verify(organizationId, service, operation);
  return verification.hasConsent;
}
