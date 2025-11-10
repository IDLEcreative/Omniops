/**
 * Audit Logger Convenience Functions
 *
 * Standalone helper functions for audit logging operations.
 * These wrap the AuditLogger class for simplified usage.
 *
 * @module lib/autonomous/security/audit-logger-helpers
 */

import { getAuditLogger } from './audit-logger';
import type { AuditStepData, AuditRecord, OperationSummary } from './audit-logger-types';

/**
 * Log step (convenience function)
 */
export async function logAuditStep(data: AuditStepData): Promise<AuditRecord> {
  const logger = getAuditLogger();
  return logger.logStep(data);
}

/**
 * Get operation logs (convenience function)
 */
export async function getOperationAuditLogs(operationId: string): Promise<AuditRecord[]> {
  const logger = getAuditLogger();
  return logger.getOperationLogs(operationId);
}

/**
 * Get operation summary (convenience function)
 */
export async function getOperationAuditSummary(operationId: string): Promise<OperationSummary> {
  const logger = getAuditLogger();
  return logger.getOperationSummary(operationId);
}
