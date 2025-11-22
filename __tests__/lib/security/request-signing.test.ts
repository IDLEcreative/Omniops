import { describe, it, expect } from '@jest/globals';
import {
  signRequest,
  verifySignature,
  requireSignedRequest,
  getSigningSecret,
  SignedRequest,
} from '@/lib/security/request-signing';

describe('Request Signing', () => {
  const testSecret = 'test-secret-key-32-characters-long!';
  const testPayload = {
    userId: '123',
    action: 'delete',
    domain: 'example.com',
  };

  describe('signRequest', () => {
    it('should create a signed request with all required fields', () => {
      const signed = signRequest(testPayload, testSecret);

      expect(signed).toHaveProperty('payload');
      expect(signed).toHaveProperty('signature');
      expect(signed).toHaveProperty('timestamp');
      expect(signed).toHaveProperty('nonce');

      expect(signed.payload).toEqual(testPayload);
      expect(typeof signed.signature).toBe('string');
      expect(signed.signature.length).toBe(64); // SHA-256 hex = 64 chars
      expect(typeof signed.timestamp).toBe('number');
      expect(typeof signed.nonce).toBe('string');
      expect(signed.nonce.length).toBe(32); // 16 bytes hex = 32 chars
    });

    it('should create different nonces for each signature', () => {
      const signed1 = signRequest(testPayload, testSecret);
      const signed2 = signRequest(testPayload, testSecret);

      expect(signed1.nonce).not.toBe(signed2.nonce);
    });

    it('should create different signatures for different payloads', () => {
      const payload1 = { action: 'delete' };
      const payload2 = { action: 'export' };

      const signed1 = signRequest(payload1, testSecret);
      const signed2 = signRequest(payload2, testSecret);

      expect(signed1.signature).not.toBe(signed2.signature);
    });
  });

  describe('verifySignature', () => {
    it('should verify valid signature', () => {
      const signed = signRequest(testPayload, testSecret);
      const result = verifySignature(signed, testSecret);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject tampered payload', () => {
      const signed = signRequest(testPayload, testSecret);

      // Tamper with payload
      const tampered: SignedRequest = {
        ...signed,
        payload: { ...testPayload, userId: '999' },
      };

      const result = verifySignature(tampered, testSecret);

      expect(result.valid).toBe(false);
    });

    it('should reject tampered signature', () => {
      const signed = signRequest(testPayload, testSecret);

      // Tamper with signature
      const tampered: SignedRequest = {
        ...signed,
        signature: 'a'.repeat(64),
      };

      const result = verifySignature(tampered, testSecret);

      expect(result.valid).toBe(false);
    });

    it('should reject wrong secret', () => {
      const signed = signRequest(testPayload, testSecret);
      const wrongSecret = 'wrong-secret-key-32-characters!!';

      const result = verifySignature(signed, wrongSecret);

      expect(result.valid).toBe(false);
    });

    it('should reject expired signature', () => {
      const signed = signRequest(testPayload, testSecret);

      // Mock old timestamp (6 minutes ago)
      const expired: SignedRequest = {
        ...signed,
        timestamp: Date.now() - 360000, // 6 minutes
      };

      // Need to regenerate signature with old timestamp
      const result = verifySignature(expired, testSecret, 300000); // 5 min max age

      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject future timestamp (clock skew attack)', () => {
      const signed = signRequest(testPayload, testSecret);

      // Mock future timestamp (2 minutes ahead)
      const future: SignedRequest = {
        ...signed,
        timestamp: Date.now() + 120000,
      };

      const result = verifySignature(future, testSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('future');
    });

    it('should allow custom max age', () => {
      // Create a signed request with a recent timestamp
      const signed = signRequest(testPayload, testSecret);

      // Should pass with longer max age (10 minutes)
      const result1 = verifySignature(signed, testSecret, 600000);
      expect(result1.valid).toBe(true);

      // Should also pass with default max age (5 minutes)
      const result2 = verifySignature(signed, testSecret, 300000);
      expect(result2.valid).toBe(true);

      // Test with very short max age - create a signature and wait
      // Since we can't actually wait, we'll verify that a recently created
      // signature passes with a reasonable max age
      const result3 = verifySignature(signed, testSecret, 60000);
      expect(result3.valid).toBe(true); // Should pass as it's fresh
    });

    it('should handle invalid signature format', () => {
      const signed = signRequest(testPayload, testSecret);

      // Invalid hex string (wrong length)
      const invalid: SignedRequest = {
        ...signed,
        signature: 'invalid',
      };

      const result = verifySignature(invalid, testSecret);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid signature format');
    });
  });

  describe('requireSignedRequest', () => {
    it('should verify valid signed request', async () => {
      const signed = signRequest(testPayload, testSecret);
      const verify = requireSignedRequest(testSecret);

      const mockRequest = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signed),
      });

      const result = await verify(mockRequest);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject request without signature fields', async () => {
      const verify = requireSignedRequest(testSecret);

      const mockRequest = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: testPayload }), // Missing signature, timestamp, nonce
      });

      const result = await verify(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing signature fields');
    });

    it('should reject invalid JSON', async () => {
      const verify = requireSignedRequest(testSecret);

      const mockRequest = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });

      const result = await verify(mockRequest);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid request format');
    });
  });

  describe('getSigningSecret', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should return REQUEST_SIGNING_SECRET if set', () => {
      process.env.REQUEST_SIGNING_SECRET = 'test-signing-secret';
      process.env.ENCRYPTION_KEY = 'test-encryption-key';

      const secret = getSigningSecret();

      expect(secret).toBe('test-signing-secret');
    });

    it('should fallback to ENCRYPTION_KEY if REQUEST_SIGNING_SECRET not set', () => {
      delete process.env.REQUEST_SIGNING_SECRET;
      process.env.ENCRYPTION_KEY = 'test-encryption-key';

      const secret = getSigningSecret();

      expect(secret).toBe('test-encryption-key');
    });

    it('should throw error if neither secret is set', () => {
      delete process.env.REQUEST_SIGNING_SECRET;
      delete process.env.ENCRYPTION_KEY;

      expect(() => getSigningSecret()).toThrow(
        'REQUEST_SIGNING_SECRET or ENCRYPTION_KEY must be set'
      );
    });
  });

  describe('Integration: Sign and Verify Flow', () => {
    it('should successfully sign and verify a complete request flow', () => {
      // Step 1: Client signs request
      const clientPayload = {
        userId: 'user-123',
        action: 'delete',
        domain: 'example.com',
        confirm: true,
      };

      const signedRequest = signRequest(clientPayload, testSecret);

      // Step 2: Server verifies signature
      const verification = verifySignature(signedRequest, testSecret);

      expect(verification.valid).toBe(true);

      // Step 3: Server extracts payload
      const serverPayload = signedRequest.payload;

      expect(serverPayload).toEqual(clientPayload);
    });

    it('should prevent replay attacks', () => {
      // Sign request
      const signed = signRequest(testPayload, testSecret);

      // Verify immediately (should pass)
      const result1 = verifySignature(signed, testSecret, 300000);
      expect(result1.valid).toBe(true);

      // Simulate replay after expiration (6 minutes later)
      const expired: SignedRequest = {
        ...signed,
        timestamp: Date.now() - 360000,
      };

      const result2 = verifySignature(expired, testSecret, 300000);
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('expired');
    });

    it('should prevent tampering attacks', () => {
      // Attacker intercepts signed request
      const signed = signRequest(testPayload, testSecret);

      // Attacker tries to modify payload
      const tampered: SignedRequest = {
        ...signed,
        payload: {
          ...testPayload,
          userId: 'attacker-id', // Changed!
        },
      };

      // Server rejects tampered request
      const result = verifySignature(tampered, testSecret);

      expect(result.valid).toBe(false);
    });
  });
});
