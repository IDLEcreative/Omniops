/**
 * Core WooCommerce order modification operations
 * Handles cancel, update address, add note, and refund requests
 */

import { WooCommerceAPI } from './woocommerce-api';
import {
  OrderModificationRequest,
  ModificationResult,
  ModificationStatus,
  MODIFICATION_ERRORS,
} from './woocommerce-order-modifications-types';

/**
 * Verify customer owns the order
 */
export async function verifyOrderOwnership(
  wc: WooCommerceAPI,
  orderId: number,
  customerEmail: string
): Promise<boolean> {
  try {
    const order = await wc.getOrder(orderId);

    // Check if email matches
    if (order.billing?.email?.toLowerCase() === customerEmail.toLowerCase()) {
      return true;
    }

    // Also check if customer ID matches (if we have it)
    if (order.customer_id && order.customer_id > 0) {
      const customer = await wc.getCustomer(order.customer_id);
      if (customer.email?.toLowerCase() === customerEmail.toLowerCase()) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error verifying order ownership:', error);
    return false;
  }
}

/**
 * Cancel an order
 */
export async function executeCancelOrder(
  wc: WooCommerceAPI,
  request: OrderModificationRequest
): Promise<ModificationResult> {
  try {
    // Update order status to cancelled
    await wc.updateOrder(request.orderId, {
      status: 'cancelled',
      customer_note: request.data?.reason || 'Order cancelled by customer request via chat'
    });

    // Add a note to the order
    await wc.createOrderNote(request.orderId, {
      note: `Order cancelled by customer (${request.customerEmail}) via chat. Reason: ${request.data?.reason || 'Not specified'}`,
      customer_note: true
    });

    return {
      success: true,
      message: `Order #${request.orderId} has been successfully cancelled. You will receive a confirmation email shortly.`
    };
  } catch (error) {
    console.error('Error cancelling order:', error);

    return {
      success: false,
      message: 'There was an error cancelling your order. Please contact customer support.',
      error: MODIFICATION_ERRORS.CANCELLATION_FAILED
    };
  }
}

/**
 * Update shipping address
 */
export async function executeUpdateShippingAddress(
  wc: WooCommerceAPI,
  request: OrderModificationRequest
): Promise<ModificationResult> {
  try {
    // Update the shipping address
    const shippingUpdate: any = {
      shipping: {
        first_name: request.data.address.first_name || '',
        last_name: request.data.address.last_name || '',
        address_1: request.data.address.address_1 || request.data.address.street || '',
        address_2: request.data.address.address_2 || '',
        city: request.data.address.city || '',
        state: request.data.address.state || '',
        postcode: request.data.address.postcode || request.data.address.zip || '',
        country: request.data.address.country || 'US'
      }
    };

    await wc.updateOrder(request.orderId, shippingUpdate);

    // Add a note about the change
    await wc.createOrderNote(request.orderId, {
      note: `Shipping address updated by customer via chat. New address: ${JSON.stringify(shippingUpdate.shipping)}`,
      customer_note: true
    });

    return {
      success: true,
      message: `Shipping address for order #${request.orderId} has been updated successfully.`
    };
  } catch (error) {
    console.error('Error updating shipping address:', error);

    return {
      success: false,
      message: 'There was an error updating your shipping address. Please contact customer support.',
      error: MODIFICATION_ERRORS.UPDATE_FAILED
    };
  }
}

/**
 * Add a note to an order
 */
export async function executeAddOrderNote(
  wc: WooCommerceAPI,
  request: OrderModificationRequest
): Promise<ModificationResult> {
  try {
    await wc.createOrderNote(request.orderId, {
      note: `Customer note: ${request.data.note}`,
      customer_note: true
    });

    return {
      success: true,
      message: `Your note has been added to order #${request.orderId}.`
    };
  } catch (error) {
    console.error('Error adding order note:', error);

    return {
      success: false,
      message: 'There was an error adding your note. Please try again.',
      error: MODIFICATION_ERRORS.NOTE_FAILED
    };
  }
}

/**
 * Request a refund
 */
export async function executeRequestRefund(
  wc: WooCommerceAPI,
  request: OrderModificationRequest
): Promise<ModificationResult> {
  try {
    // Create a refund request note
    await wc.createOrderNote(request.orderId, {
      note: `Customer requested refund via chat. Reason: ${request.data?.reason || 'Not specified'}. Customer email: ${request.customerEmail}`,
      customer_note: false // Internal note for staff
    });

    // Add customer-visible note
    await wc.createOrderNote(request.orderId, {
      note: 'Your refund request has been received and will be processed within 1-2 business days.',
      customer_note: true
    });

    // If auto-refund is enabled and amount is specified
    if (request.data?.autoRefund && request.data?.amount) {
      try {
        await wc.createOrderRefund(request.orderId, {
          amount: request.data.amount.toString(),
          reason: request.data.reason || 'Customer requested via chat'
        });

        return {
          success: true,
          message: `Refund of ${request.data.amount} has been processed for order #${request.orderId}. You will receive the funds within 3-5 business days.`
        };
      } catch (refundError) {
        console.error('Auto-refund failed:', refundError);
        // Fall back to manual refund request
      }
    }

    return {
      success: true,
      message: `Your refund request for order #${request.orderId} has been submitted. Our team will review it and process the refund within 1-2 business days. You will receive a confirmation email once processed.`
    };
  } catch (error) {
    console.error('Error requesting refund:', error);

    return {
      success: false,
      message: 'There was an error submitting your refund request. Please contact customer support.',
      error: MODIFICATION_ERRORS.REFUND_REQUEST_FAILED
    };
  }
}
