import { InstagramOAuth } from '@/lib/instagram-oauth';
import crypto from 'crypto';

describe('InstagramOAuth', () => {
  describe('verifyWebhookSignature', () => {
    it('should verify valid webhook signature', () => {
      const payload = '{"test": "data"}';
      const secret = 'test-secret';
      const signature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(InstagramOAuth.verifyWebhookSignature(payload, signature, secret))
        .toBe(true);
    });

    it('should verify signature without sha256= prefix', () => {
      const payload = '{"test": "data"}';
      const secret = 'test-secret';
      const signatureWithoutPrefix = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(InstagramOAuth.verifyWebhookSignature(payload, signatureWithoutPrefix, secret))
        .toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      expect(InstagramOAuth.verifyWebhookSignature('data', 'invalid', 'secret'))
        .toBe(false);
    });

    it('should prevent timing attacks', () => {
      const payload = 'test';
      const secret = 'secret';
      const validSig = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
      const invalidSig = validSig.slice(0, -1) + 'X'; // Change last character

      // Should use timing-safe comparison
      expect(InstagramOAuth.verifyWebhookSignature(payload, invalidSig, secret))
        .toBe(false);
    });

    it('should handle different payload lengths', () => {
      const secret = 'test-secret';

      const shortPayload = '{"a":1}';
      const shortSig = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(shortPayload)
        .digest('hex');

      const longPayload = '{"entry":[{"messaging":[{"message":{"text":"hello"}}]}]}';
      const longSig = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(longPayload)
        .digest('hex');

      expect(InstagramOAuth.verifyWebhookSignature(shortPayload, shortSig, secret))
        .toBe(true);
      expect(InstagramOAuth.verifyWebhookSignature(longPayload, longSig, secret))
        .toBe(true);
    });

    it('should reject signature with wrong secret', () => {
      const payload = '{"test": "data"}';
      const correctSecret = 'correct-secret';
      const wrongSecret = 'wrong-secret';

      const signature = 'sha256=' + crypto
        .createHmac('sha256', correctSecret)
        .update(payload)
        .digest('hex');

      expect(InstagramOAuth.verifyWebhookSignature(payload, signature, wrongSecret))
        .toBe(false);
    });

    it('should handle empty payload', () => {
      const payload = '';
      const secret = 'test-secret';
      const signature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(InstagramOAuth.verifyWebhookSignature(payload, signature, secret))
        .toBe(true);
    });

    it('should handle special characters in payload', () => {
      const payload = '{"message":"Hello 👋 World! \n\t"}';
      const secret = 'test-secret';
      const signature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      expect(InstagramOAuth.verifyWebhookSignature(payload, signature, secret))
        .toBe(true);
    });
  });
});
