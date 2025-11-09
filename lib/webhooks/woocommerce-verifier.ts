/**
 * WooCommerce Webhook Signature Verification
 *
 * Verifies HMAC-SHA256 signatures from WooCommerce webhooks
 * Docs: https://woocommerce.github.io/woocommerce-rest-api-docs/#webhooks
 */

import crypto from 'crypto';

export interface WooCommerceWebhookHeaders {
  'x-wc-webhook-signature'?: string;
  'x-wc-webhook-id'?: string;
  'x-wc-webhook-topic'?: string;
  'x-wc-webhook-resource'?: string;
  'x-wc-webhook-event'?: string;
  'x-wc-webhook-source'?: string;
}

/**
 * Verify WooCommerce webhook signature
 *
 * @param payload - Raw webhook payload as string
 * @param signature - Signature from X-WC-Webhook-Signature header
 * @param secret - Webhook secret configured in WooCommerce
 * @returns true if signature is valid
 */
export function verifyWooCommerceWebhook(
  payload: string,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature) {
    console.error('[WooCommerce Webhook] Missing signature header');
    return false;
  }

  if (!secret) {
    console.error('[WooCommerce Webhook] Missing webhook secret');
    return false;
  }

  try {
    // WooCommerce uses HMAC-SHA256 with base64 encoding
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    // Use constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      console.warn('[WooCommerce Webhook] Signature mismatch');
    }

    return isValid;
  } catch (error) {
    console.error('[WooCommerce Webhook] Verification error:', error);
    return false;
  }
}

/**
 * Extract and validate WooCommerce webhook headers
 */
export function extractWooCommerceHeaders(
  headers: Headers
): WooCommerceWebhookHeaders {
  return {
    'x-wc-webhook-signature': headers.get('x-wc-webhook-signature') || undefined,
    'x-wc-webhook-id': headers.get('x-wc-webhook-id') || undefined,
    'x-wc-webhook-topic': headers.get('x-wc-webhook-topic') || undefined,
    'x-wc-webhook-resource': headers.get('x-wc-webhook-resource') || undefined,
    'x-wc-webhook-event': headers.get('x-wc-webhook-event') || undefined,
    'x-wc-webhook-source': headers.get('x-wc-webhook-source') || undefined,
  };
}

/**
 * Validate webhook topic matches expected value
 */
export function isValidWooCommerceTopic(
  topic: string | undefined,
  expected: string
): boolean {
  if (!topic) {
    return false;
  }

  return topic === expected;
}
