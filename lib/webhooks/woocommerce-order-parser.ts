/**
 * WooCommerce Order Webhook Parser
 *
 * Extracts and normalizes order data from WooCommerce webhooks
 */

import type { WooCommerceOrderWebhook } from '@/types/purchase-attribution';

export interface ParsedOrderData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  total: number;
  currency: string;
  lineItems: Array<{
    name: string;
    productId: number;
    quantity: number;
    total: number;
  }>;
  orderCreatedAt: Date;
  metadata: Record<string, any>;
}

/**
 * Parse WooCommerce order webhook payload
 *
 * @param payload - WooCommerce order webhook payload
 * @returns Normalized order data
 * @throws Error if required fields are missing
 */
export function parseWooCommerceOrder(
  payload: WooCommerceOrderWebhook
): ParsedOrderData {
  // Validate required fields
  if (!payload.id) {
    throw new Error('Missing required field: id');
  }

  if (!payload.billing?.email) {
    throw new Error('Missing required field: billing.email');
  }

  if (!payload.total) {
    throw new Error('Missing required field: total');
  }

  // Parse total (comes as string)
  const total = parseFloat(payload.total);
  if (isNaN(total)) {
    throw new Error(`Invalid total value: ${payload.total}`);
  }

  // Parse line items
  const lineItems = (payload.line_items || []).map(item => ({
    name: item.name,
    productId: item.product_id,
    quantity: item.quantity,
    total: parseFloat(item.total),
  }));

  // Parse order created date
  let orderCreatedAt: Date;
  try {
    // Prefer GMT timestamp for consistency
    orderCreatedAt = new Date(payload.date_created_gmt || payload.date_created);
  } catch {
    orderCreatedAt = new Date();
  }

  // Extract metadata
  const metadata: Record<string, any> = {};
  if (payload.meta_data && Array.isArray(payload.meta_data)) {
    payload.meta_data.forEach(meta => {
      if (meta.key) {
        metadata[meta.key] = meta.value;
      }
    });
  }

  return {
    orderId: payload.id.toString(),
    orderNumber: payload.number || payload.id.toString(),
    customerEmail: payload.billing.email.toLowerCase().trim(),
    total,
    currency: payload.currency || 'USD',
    lineItems,
    orderCreatedAt,
    metadata: {
      ...metadata,
      status: payload.status,
      customerName: `${payload.billing.first_name || ''} ${payload.billing.last_name || ''}`.trim(),
      customerPhone: payload.billing.phone,
    },
  };
}

/**
 * Validate that order should be tracked
 * (e.g., skip certain statuses, test orders, etc.)
 */
export function shouldTrackWooCommerceOrder(
  payload: WooCommerceOrderWebhook
): boolean {
  // Only track completed, processing, and on-hold orders
  const validStatuses = ['completed', 'processing', 'on-hold'];

  if (!validStatuses.includes(payload.status)) {
    return false;
  }

  // Skip orders with $0 total
  const total = parseFloat(payload.total);
  if (total <= 0) {
    return false;
  }

  // Skip test orders (common test emails)
  const testEmails = ['test@', 'admin@', 'noreply@'];
  const email = payload.billing?.email?.toLowerCase() || '';
  if (testEmails.some(testEmail => email.includes(testEmail))) {
    return false;
  }

  return true;
}
