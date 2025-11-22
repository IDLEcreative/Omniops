import * as crypto from 'crypto';

export interface SignedRequest {
  payload: any;
  signature: string;
  timestamp: number;
  nonce: string;
}

export interface VerificationResult {
  valid: boolean;
  error?: string;
}

/**
 * Sign a request payload with HMAC-SHA256
 *
 * Creates a tamper-proof signature for sensitive operations using HMAC.
 * Includes timestamp and nonce to prevent replay attacks.
 *
 * @param payload - The request payload to sign
 * @param secret - Secret key for HMAC (typically from env)
 * @returns Signed request with signature, timestamp, and nonce
 *
 * @example
 * const signed = signRequest(
 *   { userId: '123', action: 'delete' },
 *   process.env.REQUEST_SIGNING_SECRET
 * );
 */
export function signRequest(payload: any, secret: string): SignedRequest {
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');

  const message = JSON.stringify({
    payload,
    timestamp,
    nonce
  });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  return {
    payload,
    signature,
    timestamp,
    nonce
  };
}

/**
 * Verify request signature and prevent replay attacks
 *
 * Validates HMAC signature and checks timestamp to prevent:
 * - Tampering (signature mismatch)
 * - Replay attacks (expired timestamp)
 * - Clock skew attacks (future timestamp)
 *
 * @param signed - Signed request to verify
 * @param secret - Secret key for HMAC (must match signing secret)
 * @param maxAge - Maximum age in milliseconds (default: 5 minutes)
 * @returns Verification result with valid flag and optional error
 *
 * @example
 * const result = verifySignature(signedRequest, process.env.REQUEST_SIGNING_SECRET);
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 */
export function verifySignature(
  signed: SignedRequest,
  secret: string,
  maxAge: number = 300000 // 5 minutes
): VerificationResult {
  // Check timestamp to prevent replay attacks
  const age = Date.now() - signed.timestamp;

  if (age > maxAge) {
    return { valid: false, error: 'Request expired (signature too old)' };
  }

  // Prevent clock skew attacks (timestamp in future)
  if (age < -60000) { // Allow 1 minute clock skew
    return { valid: false, error: 'Request timestamp in future (check system clock)' };
  }

  // Recompute signature to verify authenticity
  const message = JSON.stringify({
    payload: signed.payload,
    timestamp: signed.timestamp,
    nonce: signed.nonce
  });

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    const valid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signed.signature, 'hex')
    );

    return { valid };
  } catch (error) {
    // timingSafeEqual throws if lengths differ
    return { valid: false, error: 'Invalid signature format' };
  }
}

/**
 * Middleware to require signed requests on sensitive endpoints
 *
 * Use this to protect endpoints that perform critical operations:
 * - Data deletion (GDPR/privacy)
 * - Password resets
 * - Payment operations
 * - Admin actions
 *
 * @param secret - Secret key for verification
 * @returns Async function to verify request body
 *
 * @example
 * const verify = requireSignedRequest(process.env.REQUEST_SIGNING_SECRET);
 * const result = await verify(request);
 * if (!result.valid) {
 *   return NextResponse.json({ error: result.error }, { status: 401 });
 * }
 */
export function requireSignedRequest(secret: string) {
  return async function(request: Request): Promise<VerificationResult> {
    try {
      const body = await request.json();

      // Check for required signature fields
      if (!body.signature || !body.timestamp || !body.nonce || !body.payload) {
        return {
          valid: false,
          error: 'Missing signature fields (signature, timestamp, nonce, payload required)'
        };
      }

      return verifySignature(body, secret);
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid request format (expected JSON with signature)'
      };
    }
  };
}

/**
 * Get signing secret from environment variables
 *
 * Falls back to ENCRYPTION_KEY if REQUEST_SIGNING_SECRET not set.
 * Throws error if neither is available.
 *
 * @returns Signing secret from environment
 * @throws Error if no secret configured
 */
export function getSigningSecret(): string {
  const secret = process.env.REQUEST_SIGNING_SECRET || process.env.ENCRYPTION_KEY;

  if (!secret) {
    throw new Error(
      'REQUEST_SIGNING_SECRET or ENCRYPTION_KEY must be set in environment variables'
    );
  }

  return secret;
}
