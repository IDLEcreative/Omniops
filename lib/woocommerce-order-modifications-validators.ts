/**
 * Validation and detection logic for WooCommerce order modifications
 * Part of modularized order modification system
 */

import {
  OrderInfo,
  ModificationIntent,
  MODIFICATION_PATTERNS,
  EXTRACTION_PATTERNS,
} from './woocommerce-order-modifications-types';

/**
 * Analyze message to detect modification intent
 */
export function detectModificationIntent(message: string): ModificationIntent {
  const lowerMessage = message.toLowerCase();

  // Cancel patterns
  if (MODIFICATION_PATTERNS.cancel.test(message)) {
    return { type: 'cancel', confidence: 0.9 };
  }

  // Note patterns (check before address since "deliver to back door" should be a note)
  if (MODIFICATION_PATTERNS.add_note.test(message)) {
    return { type: 'add_note', confidence: 0.7 };
  }

  // Address update patterns
  if (MODIFICATION_PATTERNS.update_address.test(message)) {
    return { type: 'update_address', confidence: 0.85 };
  }

  // Refund patterns
  if (MODIFICATION_PATTERNS.request_refund.test(message)) {
    return { type: 'request_refund', confidence: 0.85 };
  }

  return { confidence: 0 };
}

/**
 * Extract order details from message
 */
export function extractOrderInfo(message: string): OrderInfo {
  const orderMatch = message.match(EXTRACTION_PATTERNS.orderId);
  const orderId = orderMatch ? orderMatch[1] : undefined;

  // Extract address components if present
  const newAddress: any = {};

  // Try to extract structured address
  const addressMatch = message.match(EXTRACTION_PATTERNS.address);
  if (addressMatch) {
    const addressText = addressMatch[1];

    // Try to parse US-style address
    const usAddressMatch = addressText?.match(EXTRACTION_PATTERNS.usAddress);
    if (usAddressMatch) {
      newAddress.street = usAddressMatch[1];
      newAddress.city = usAddressMatch[2];
      newAddress.state = usAddressMatch[3];
      newAddress.zip = usAddressMatch[4];
    }
  }

  // Extract reason for cancellation/refund
  let reason = '';
  const reasonMatch = message.match(EXTRACTION_PATTERNS.reason);
  if (reasonMatch) {
    reason = reasonMatch[1]?.trim() || '';
  }

  return {
    orderId,
    newAddress: Object.keys(newAddress).length > 0 ? newAddress : undefined,
    reason
  };
}

/**
 * Validate address data structure
 */
export function isValidAddress(data: any): boolean {
  if (!data?.address || typeof data.address !== 'object') {
    return false;
  }

  // At minimum, we need either address_1 or street, and city
  const hasStreet = !!(data.address.address_1 || data.address.street);
  const hasCity = !!data.address.city;

  return hasStreet && hasCity;
}

/**
 * Generate confirmation message for modification
 */
export function generateConfirmationMessage(
  modificationType: string,
  orderId: number,
  orderDetails: any
): string {
  switch (modificationType) {
    case 'cancel':
      return `Are you sure you want to cancel order #${orderId}? This action cannot be undone. Current order status: ${orderDetails.status}, Total: ${orderDetails.currency_symbol}${orderDetails.total}`;

    case 'update_address':
      return `Please confirm the new shipping address for order #${orderId}. Make sure all details are correct as the order may ship soon.`;

    case 'request_refund':
      return `You are requesting a refund for order #${orderId} (Total: ${orderDetails.currency_symbol}${orderDetails.total}). Please note that refund processing may take 3-5 business days. Do you want to proceed?`;

    default:
      return `Please confirm you want to modify order #${orderId}.`;
  }
}
