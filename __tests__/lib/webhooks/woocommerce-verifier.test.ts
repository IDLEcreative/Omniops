/**
 * WooCommerce Webhook Verification Tests
 */

import { verifyWooCommerceWebhook } from '@/lib/webhooks/woocommerce-verifier';
import crypto from 'crypto';

describe('WooCommerce Webhook Verification', () => {
  const secret = 'test-webhook-secret-123';
  const payload = JSON.stringify({ id: 12345, status: 'completed' });

  it('should verify valid signature', () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    const isValid = verifyWooCommerceWebhook(payload, signature, secret);

    expect(isValid).toBe(true);
  });

  it('should reject invalid signature', () => {
    const invalidSignature = 'invalid-signature';

    const isValid = verifyWooCommerceWebhook(payload, invalidSignature, secret);

    expect(isValid).toBe(false);
  });

  it('should reject missing signature', () => {
    const isValid = verifyWooCommerceWebhook(payload, undefined, secret);

    expect(isValid).toBe(false);
  });

  it('should reject empty secret', () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    const isValid = verifyWooCommerceWebhook(payload, signature, '');

    expect(isValid).toBe(false);
  });

  it('should handle modified payload', () => {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('base64');

    const modifiedPayload = JSON.stringify({ id: 99999, status: 'fraud' });

    const isValid = verifyWooCommerceWebhook(modifiedPayload, signature, secret);

    expect(isValid).toBe(false);
  });
});
