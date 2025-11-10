/**
 * Operation Service Convenience Functions
 *
 * Standalone helper functions for autonomous operation management.
 * These wrap the OperationService class for simplified usage.
 *
 * @module lib/autonomous/core/operation-helpers
 */

import { getOperationService } from './operation-service';
import type { CreateOperationRequest, OperationRecord, OperationService } from './operation-service';

/**
 * Create operation (convenience function)
 */
export async function createOperation(request: CreateOperationRequest): Promise<OperationRecord> {
  const service = getOperationService();
  return service.create(request);
}

/**
 * Get operation (convenience function)
 */
export async function getOperation(operationId: string): Promise<OperationRecord | null> {
  const service = getOperationService();
  return service.get(operationId);
}

/**
 * List operations (convenience function)
 */
export async function listOperations(
  organizationId: string,
  options?: Parameters<OperationService['list']>[1]
): Promise<OperationRecord[]> {
  const service = getOperationService();
  return service.list(organizationId, options);
}
