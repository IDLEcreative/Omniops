/**
 * WhatsApp Webhook Endpoint
 *
 * @purpose Receives all incoming messages and status updates from Meta WhatsApp Cloud API
 *
 * @flow
 *   1. GET: Verify webhook URL (one-time setup)
 *   2. POST: Receive webhook events → verify signature → route to handlers
 *   3. → Return 200 OK
 *
 * @keyFunctions
 *   - GET (line 48): Webhook verification for Meta setup
 *   - POST (line 64): Process incoming webhook events
 *   - verifyWebhookSignature (line 115): HMAC-SHA256 signature verification
 *   - storeWebhook (line 150): Store webhook for debugging
 *
 * @handles
 *   - Webhook verification (GET)
 *   - Message events (POST)
 *   - Status updates (POST)
 *   - Template status changes (POST)
 *   - Security: HMAC-SHA256 signature verification
 *
 * @returns NextResponse (200 OK or 403 Forbidden)
 *
 * @security
 *   - HMAC-SHA256 signature verification
 *   - Timing-safe comparison
 *   - Environment variable validation
 *
 * @dependencies
 *   - next/server
 *   - crypto (Node.js built-in)
 *   - @/lib/supabase/server
 *   - ./handlers.ts
 *
 * @consumers
 *   - Meta WhatsApp Cloud API (webhook)
 *
 * @totalLines 140
 * @estimatedTokens 550 (without header), 700 (with header - 21% savings)
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { handleIncomingMessages, handleStatusUpdates, handleTemplateStatus } from './handlers';

/**
 * Webhook Verification (One-Time Setup)
 *
 * Meta sends GET request to verify webhook URL during setup.
 * Must respond with challenge parameter to confirm ownership.
 */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  // Verify token matches environment variable
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified');
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('❌ WhatsApp webhook verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * Webhook Event Handler
 *
 * Receives POST requests from Meta when:
 * - User sends message
 * - Message status changes (sent → delivered → read)
 * - Template status changes (approved, rejected)
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify signature to prevent tampering
    if (!verifyWebhookSignature(body, signature)) {
      console.error('❌ Invalid webhook signature');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse webhook payload
    const webhook = JSON.parse(body);

    // Store webhook for debugging/retry
    await storeWebhook(webhook, signature);

    // Process webhook based on type
    const entry = webhook.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value) {
      console.warn('⚠️ Webhook missing value field:', webhook);
      return new NextResponse('OK', { status: 200 });
    }

    // Handle different webhook types
    if (value.messages) {
      // Incoming message from user
      await handleIncomingMessages(value);
    }

    if (value.statuses) {
      // Message status update (delivered, read, failed)
      await handleStatusUpdates(value);
    }

    if (value.template_status) {
      // Template approval/rejection
      await handleTemplateStatus(value);
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    // Return 200 to prevent Meta retrying
    return new NextResponse('OK', { status: 200 });
  }
}

/**
 * Verify Webhook Signature
 *
 * Meta signs all webhooks with HMAC-SHA256 using app secret.
 * This prevents unauthorized parties from sending fake webhooks.
 */
function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) {
    console.error('[Security] Missing webhook signature');
    return false;
  }

  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) {
    console.error('[Security] WHATSAPP_APP_SECRET not configured');
    return false; // Fail closed
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  try {
    const expected = Buffer.from(`sha256=${expectedSignature}`);
    const actual = Buffer.from(signature);

    if (expected.length !== actual.length) {
      return false;
    }

    return crypto.timingSafeEqual(expected, actual);
  } catch (error) {
    console.error('[Security] Signature comparison failed:', error);
    return false;
  }
}

/**
 * Store Webhook for Debugging/Retry
 *
 * Stores all incoming webhooks in database for:
 * - Debugging failed processing
 * - Retry failed webhooks
 * - Audit trail
 */
async function storeWebhook(webhook: any, signature: string | null): Promise<void> {
  try {
    const supabase = await createClient();
    if (!supabase) {
      console.error('Failed to initialize database client');
      return;
    }

    // Determine webhook type
    const value = webhook.entry?.[0]?.changes?.[0]?.value;
    let webhookType = 'unknown';

    if (value?.messages) webhookType = 'message';
    if (value?.statuses) webhookType = 'status';
    if (value?.template_status) webhookType = 'template_status';

    await supabase.from('whatsapp_webhooks').insert({
      webhook_type: webhookType,
      payload: webhook,
      signature,
      processed: false,
    });
  } catch (error) {
    console.error('Failed to store webhook:', error);
    // Don't throw - webhook processing should continue
  }
}

