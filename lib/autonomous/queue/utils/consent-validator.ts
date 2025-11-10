/**
 * Consent Validator Utility
 *
 * Validates user consent before executing autonomous operations.
 *
 * @module lib/autonomous/queue/utils/consent-validator
 */

import { verifyConsent } from '../../security/consent-manager';
import { OperationJobData } from '../types';

/**
 * Validate that user has provided consent for the operation
 *
 * @param data - Job data containing organization, service, and operation details
 * @throws Error if consent is not found or has expired
 */
export async function validateConsent(data: OperationJobData): Promise<void> {
  const hasConsent = await verifyConsent(
    data.organizationId,
    data.service,
    data.operation
  );

  if (!hasConsent) {
    throw new Error('User consent not found or expired');
  }
}
