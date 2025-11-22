/**
 * Webhook Replay Attack Prevention
 *
 * Prevents malicious actors from capturing and replaying webhook events
 * by validating timestamps and tracking processed event IDs.
 *
 * Security measures:
 * 1. Timestamp validation: Events older than tolerance window are rejected
 * 2. Event ID tracking: Duplicate events are detected and rejected
 * 3. Database persistence: Processed events logged for audit trail
 */

import { createServiceRoleClient } from '@/lib/supabase-server';

/**
 * Timestamp tolerance in seconds (5 minutes)
 * Events outside this window are considered stale or replayed
 */
const EVENT_TOLERANCE_SECONDS = 300; // 5 minutes

/**
 * Validate webhook event timestamp
 *
 * @param eventTime - Unix timestamp (seconds) from webhook
 * @param toleranceSeconds - Maximum age of event in seconds
 * @returns true if timestamp is within tolerance, false otherwise
 */
export function validateEventTimestamp(
  eventTime: number,
  toleranceSeconds: number = EVENT_TOLERANCE_SECONDS
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const difference = Math.abs(currentTime - eventTime);

  if (difference > toleranceSeconds) {
    console.warn('[Replay Prevention] Event outside tolerance window', {
      eventTime,
      currentTime,
      difference,
      toleranceSeconds,
    });
    return false;
  }

  return true;
}

/**
 * Check if webhook event has already been processed (duplicate detection)
 *
 * @param eventId - Unique event identifier from webhook provider
 * @param webhookType - Type of webhook (shopify, woocommerce, stripe, etc.)
 * @returns true if event is new (not processed), false if duplicate
 */
export async function isEventNew(
  eventId: string,
  webhookType: string
): Promise<boolean> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('[Replay Prevention] Database connection failed');
    // Fail closed - reject event if we cannot check for duplicates
    return false;
  }

  // Check if event has already been processed
  const { data: existingEvent } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', eventId)
    .eq('webhook_type', webhookType)
    .maybeSingle();

  if (existingEvent) {
    console.log('[Replay Prevention] Duplicate event detected', {
      eventId,
      webhookType,
    });
    return false;
  }

  return true;
}

/**
 * Log processed webhook event to prevent replay attacks
 *
 * @param eventId - Unique event identifier from webhook provider
 * @param webhookType - Type of webhook (shopify, woocommerce, stripe, etc.)
 * @param eventData - Full webhook payload for audit trail
 */
export async function logWebhookEvent(
  eventId: string,
  webhookType: string,
  eventData: any
): Promise<void> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    console.error('[Replay Prevention] Failed to log webhook event - database unavailable');
    return;
  }

  try {
    await supabase.from('webhook_events').insert({
      event_id: eventId,
      webhook_type: webhookType,
      event_data: eventData,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Replay Prevention] Failed to log webhook event', {
      eventId,
      webhookType,
      error,
    });
    // Don't throw - webhook processing should continue even if logging fails
  }
}

/**
 * Validate webhook event against replay attacks
 *
 * Combines timestamp validation and duplicate detection into single check.
 *
 * @param eventId - Unique event identifier
 * @param eventTime - Unix timestamp (seconds)
 * @param webhookType - Type of webhook
 * @returns Object with validation result and reason
 */
export async function validateWebhookEvent(
  eventId: string,
  eventTime: number,
  webhookType: string
): Promise<{ valid: boolean; reason?: string }> {
  // 1. Validate timestamp
  if (!validateEventTimestamp(eventTime)) {
    return {
      valid: false,
      reason: 'Event timestamp outside tolerance window (possible replay attack)',
    };
  }

  // 2. Check for duplicate
  const isNew = await isEventNew(eventId, webhookType);
  if (!isNew) {
    return {
      valid: false,
      reason: 'Duplicate event detected (possible replay attack)',
    };
  }

  return { valid: true };
}
