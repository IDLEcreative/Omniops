/**
 * Shopify Webhook Signature Verification
 *
 * Verifies HMAC-SHA256 signatures from Shopify webhooks
 * Docs: https://shopify.dev/docs/apps/webhooks/configuration/https#step-5-verify-the-webhook
 */

import crypto from 'crypto';

export interface ShopifyWebhookHeaders {
  'x-shopify-hmac-sha256'?: string;
  'x-shopify-shop-domain'?: string;
  'x-shopify-topic'?: string;
  'x-shopify-webhook-id'?: string;
}

/**
 * Verify Shopify webhook HMAC signature
 *
 * @param payload - Raw webhook payload as string
 * @param hmacHeader - HMAC from X-Shopify-Hmac-SHA256 header
 * @param secret - Shopify webhook secret
 * @returns true if HMAC is valid
 */
export function verifyShopifyWebhook(
  payload: string,
  hmacHeader: string | undefined,
  secret: string
): boolean {
  if (!hmacHeader) {
    console.error('[Shopify Webhook] Missing HMAC header');
    return false;
  }

  if (!secret) {
    console.error('[Shopify Webhook] Missing webhook secret');
    return false;
  }

  try {
    // Shopify uses HMAC-SHA256 with base64 encoding
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');

    // Use constant-time comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmacHeader),
      Buffer.from(expectedHmac)
    );

    if (!isValid) {
      console.warn('[Shopify Webhook] HMAC mismatch');
    }

    return isValid;
  } catch (error) {
    console.error('[Shopify Webhook] Verification error:', error);
    return false;
  }
}

/**
 * Extract and validate Shopify webhook headers
 */
export function extractShopifyHeaders(headers: Headers): ShopifyWebhookHeaders {
  return {
    'x-shopify-hmac-sha256': headers.get('x-shopify-hmac-sha256') || undefined,
    'x-shopify-shop-domain': headers.get('x-shopify-shop-domain') || undefined,
    'x-shopify-topic': headers.get('x-shopify-topic') || undefined,
    'x-shopify-webhook-id': headers.get('x-shopify-webhook-id') || undefined,
  };
}

/**
 * Validate webhook topic matches expected value
 */
export function isValidShopifyTopic(
  topic: string | undefined,
  expected: string
): boolean {
  if (!topic) {
    return false;
  }

  return topic === expected;
}
