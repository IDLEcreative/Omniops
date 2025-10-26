/**
 * API layer for WooCommerce order modifications
 * Coordinates validation, operations, and logging
 */

import { WooCommerceAPI } from './woocommerce-api';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  OrderModificationRequest,
  ModificationResult,
  ModificationStatusCheck,
  ModificationType,
  ModificationStatus,
  MODIFICATION_ALLOWED_STATUSES,
  MODIFICATION_ERRORS,
} from './woocommerce-order-modifications-types';
import {
  verifyOrderOwnership,
  executeCancelOrder,
  executeUpdateShippingAddress,
  executeAddOrderNote,
  executeRequestRefund,
} from './woocommerce-order-modifications-operations';

// Re-export for backward compatibility
export { verifyOrderOwnership } from './woocommerce-order-modifications-operations';

/**
 * Check if modification is allowed based on order status
 */
export async function checkModificationAllowed(
  wc: WooCommerceAPI,
  orderId: number,
  modificationType: ModificationType
): Promise<ModificationStatusCheck> {
  try {
    const order = await wc.getOrder(orderId);
    const currentStatus = order.status;
    const allowedStatuses = MODIFICATION_ALLOWED_STATUSES[modificationType];

    if (allowedStatuses.includes('any')) {
      return { allowed: true, currentStatus };
    }

    if (!allowedStatuses.includes(currentStatus)) {
      return {
        allowed: false,
        currentStatus,
        reason: `Order cannot be modified because it is in "${currentStatus}" status. Modifications are only allowed for orders in: ${allowedStatuses.join(', ')}`
      };
    }

    return { allowed: true, currentStatus };
  } catch (error) {
    console.error('Error checking modification allowed:', error);
    return {
      allowed: false,
      currentStatus: 'unknown',
      reason: 'Unable to verify order status'
    };
  }
}

/**
 * Cancel an order
 */
export async function cancelOrder(
  wc: WooCommerceAPI,
  request: OrderModificationRequest,
  domain: string,
  logFn: (req: OrderModificationRequest, status: ModificationStatus, error?: any) => Promise<void>
): Promise<ModificationResult> {
  // Verify ownership
  if (!await verifyOrderOwnership(wc, request.orderId, request.customerEmail)) {
    return {
      success: false,
      message: 'You are not authorized to cancel this order. The email address does not match our records.',
      error: MODIFICATION_ERRORS.UNAUTHORIZED
    };
  }

  // Check if cancellation is allowed
  const statusCheck = await checkModificationAllowed(wc, request.orderId, 'cancel');
  if (!statusCheck.allowed) {
    return {
      success: false,
      message: statusCheck.reason || 'Order cannot be cancelled at this time.',
      error: MODIFICATION_ERRORS.INVALID_STATUS
    };
  }

  // Log the modification attempt
  await logFn(request, 'attempted');

  const result = await executeCancelOrder(wc, request);

  if (result.success) {
    await logFn(request, 'completed');
  } else {
    await logFn(request, 'failed');
  }

  return result;
}

/**
 * Update shipping address
 */
export async function updateShippingAddress(
  wc: WooCommerceAPI,
  request: OrderModificationRequest,
  domain: string,
  logFn: (req: OrderModificationRequest, status: ModificationStatus, error?: any) => Promise<void>
): Promise<ModificationResult> {
  // Verify ownership
  if (!await verifyOrderOwnership(wc, request.orderId, request.customerEmail)) {
    return {
      success: false,
      message: 'You are not authorized to update this order.',
      error: MODIFICATION_ERRORS.UNAUTHORIZED
    };
  }

  // Check if update is allowed
  const statusCheck = await checkModificationAllowed(wc, request.orderId, 'update_address');
  if (!statusCheck.allowed) {
    return {
      success: false,
      message: statusCheck.reason || 'Shipping address cannot be updated at this time.',
      error: MODIFICATION_ERRORS.INVALID_STATUS
    };
  }

  // Validate address data
  if (!request.data?.address || typeof request.data.address !== 'object') {
    return {
      success: false,
      message: 'Please provide the complete new shipping address.',
      error: MODIFICATION_ERRORS.INVALID_ADDRESS
    };
  }

  await logFn(request, 'attempted');

  const result = await executeUpdateShippingAddress(wc, request);

  if (result.success) {
    await logFn(request, 'completed');
  } else {
    await logFn(request, 'failed');
  }

  return result;
}

/**
 * Add a note to an order
 */
export async function addOrderNote(
  wc: WooCommerceAPI,
  request: OrderModificationRequest
): Promise<ModificationResult> {
  // Verify ownership
  if (!await verifyOrderOwnership(wc, request.orderId, request.customerEmail)) {
    return {
      success: false,
      message: 'You are not authorized to add notes to this order.',
      error: MODIFICATION_ERRORS.UNAUTHORIZED
    };
  }

  if (!request.data?.note) {
    return {
      success: false,
      message: 'Please provide the note you want to add.',
      error: MODIFICATION_ERRORS.MISSING_NOTE
    };
  }

  return executeAddOrderNote(wc, request);
}

/**
 * Request a refund
 */
export async function requestRefund(
  wc: WooCommerceAPI,
  request: OrderModificationRequest,
  domain: string,
  logFn: (req: OrderModificationRequest, status: ModificationStatus, error?: any) => Promise<void>
): Promise<ModificationResult> {
  // Verify ownership
  if (!await verifyOrderOwnership(wc, request.orderId, request.customerEmail)) {
    return {
      success: false,
      message: 'You are not authorized to request a refund for this order.',
      error: MODIFICATION_ERRORS.UNAUTHORIZED
    };
  }

  // Check if refund request is allowed
  const statusCheck = await checkModificationAllowed(wc, request.orderId, 'request_refund');
  if (!statusCheck.allowed) {
    return {
      success: false,
      message: statusCheck.reason || 'Refund cannot be requested for this order status.',
      error: MODIFICATION_ERRORS.INVALID_STATUS
    };
  }

  await logFn(request, 'attempted');

  const result = await executeRequestRefund(wc, request);

  if (result.success) {
    await logFn(request, 'completed');
  } else {
    await logFn(request, 'failed');
  }

  return result;
}

/**
 * Log modification attempts for audit trail
 */
export async function logModification(
  request: OrderModificationRequest,
  domain: string,
  status: ModificationStatus,
  error?: any
): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      console.error('Database connection unavailable for logging modification');
      return;
    }

    await supabase.from('order_modifications_log').insert({
      domain,
      order_id: request.orderId,
      customer_email: request.customerEmail,
      conversation_id: request.conversationId,
      modification_type: request.type,
      status,
      error_message: error ? String(error) : null,
      metadata: {
        data: request.data,
        timestamp: new Date().toISOString()
      }
    });
  } catch (logError) {
    console.error('Failed to log modification:', logError);
    // Don't fail the operation if logging fails
  }
}
