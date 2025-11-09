/**
 * Shopify Order Webhook Parser
 *
 * Extracts and normalizes order data from Shopify webhooks
 */

import type { ShopifyOrderWebhook } from '@/types/purchase-attribution';
import type { ParsedOrderData } from './woocommerce-order-parser';

/**
 * Parse Shopify order webhook payload
 *
 * @param payload - Shopify order webhook payload
 * @returns Normalized order data
 * @throws Error if required fields are missing
 */
export function parseShopifyOrder(
  payload: ShopifyOrderWebhook
): ParsedOrderData {
  // Validate required fields
  if (!payload.id) {
    throw new Error('Missing required field: id');
  }

  // Get customer email (can be in multiple places)
  const customerEmail =
    payload.email ||
    payload.customer?.email;

  if (!customerEmail) {
    throw new Error('Missing required field: email');
  }

  if (!payload.current_total_price) {
    throw new Error('Missing required field: current_total_price');
  }

  // Parse total (comes as string)
  const total = parseFloat(payload.current_total_price);
  if (isNaN(total)) {
    throw new Error(`Invalid total value: ${payload.current_total_price}`);
  }

  // Parse line items
  const lineItems = (payload.line_items || []).map(item => ({
    name: item.title,
    productId: item.product_id,
    quantity: item.quantity,
    total: parseFloat(item.price) * item.quantity,
  }));

  // Parse order created date
  let orderCreatedAt: Date;
  try {
    orderCreatedAt = new Date(payload.created_at);
  } catch {
    orderCreatedAt = new Date();
  }

  // Extract metadata from note attributes
  const metadata: Record<string, any> = {};
  if (payload.note_attributes && Array.isArray(payload.note_attributes)) {
    payload.note_attributes.forEach(attr => {
      if (attr.name) {
        metadata[attr.name] = attr.value;
      }
    });
  }

  return {
    orderId: payload.id.toString(),
    orderNumber: payload.order_number?.toString() || payload.id.toString(),
    customerEmail: customerEmail.toLowerCase().trim(),
    total,
    currency: payload.currency || 'USD',
    lineItems,
    orderCreatedAt,
    metadata: {
      ...metadata,
      customerId: payload.customer?.id,
      customerName: payload.customer
        ? `${payload.customer.first_name || ''} ${payload.customer.last_name || ''}`.trim()
        : '',
      note: payload.note,
    },
  };
}

/**
 * Validate that order should be tracked
 */
export function shouldTrackShopifyOrder(
  payload: ShopifyOrderWebhook
): boolean {
  // Skip orders with $0 total
  const total = parseFloat(payload.current_total_price);
  if (total <= 0) {
    return false;
  }

  // Skip test orders (common test emails)
  const testEmails = ['test@', 'admin@', 'noreply@'];
  const email = (payload.email || payload.customer?.email || '').toLowerCase();
  if (testEmails.some(testEmail => email.includes(testEmail))) {
    return false;
  }

  return true;
}
