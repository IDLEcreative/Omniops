/**
 * Follow-up Scheduler
 *
 * Schedules and sends automated follow-up messages
 * Supports email, in-app notifications, and SMS (future)
 */

import type { SupabaseClient } from '@/lib/supabase/server';
import type { FollowUpCandidate, FollowUpReason } from './detector';
import { generateFollowUpMessage } from './message-templates';

export interface FollowUpMessage {
  id: string;
  conversation_id: string;
  session_id: string;
  reason: FollowUpReason;
  channel: 'email' | 'in_app' | 'sms';
  recipient: string;
  subject: string;
  content: string;
  scheduled_at: string;
  sent_at: string | null;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  metadata: any;
}

export interface ScheduleOptions {
  delayMinutes?: number; // Delay before sending (default: 0)
  channel?: 'email' | 'in_app'; // Default: email
  template?: string; // Custom template name
}

// Re-export handlers for convenience
export { sendEmail, sendInAppNotification } from './channel-handlers';

/**
 * Schedule follow-up messages for candidates
 */
export async function scheduleFollowUps(
  supabase: SupabaseClient,
  candidates: FollowUpCandidate[],
  options: ScheduleOptions = {}
): Promise<{ scheduled: number; skipped: number }> {
  const {
    delayMinutes = 0,
    channel = 'email',
  } = options;

  let scheduled = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    // Skip if no email available for email channel
    if (channel === 'email' && !candidate.metadata.customer_email) {
      skipped++;
      continue;
    }

    // Calculate scheduled time
    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + delayMinutes);

    // Generate message content based on reason
    const message = generateFollowUpMessage(candidate, channel);

    // Insert into database
    const { error } = await supabase
      .from('follow_up_messages')
      .insert({
        conversation_id: candidate.conversation_id,
        session_id: candidate.session_id,
        reason: candidate.reason,
        channel,
        recipient: candidate.metadata.customer_email || 'in-app',
        subject: message.subject,
        content: message.content,
        scheduled_at: scheduledAt.toISOString(),
        status: 'pending',
        metadata: {
          priority: candidate.priority,
          detection_metadata: candidate.metadata,
        },
      });

    if (error) {
      console.error('[FollowUpScheduler] Failed to schedule:', error);
      skipped++;
    } else {
      scheduled++;

      // Log the follow-up attempt
      await supabase.from('follow_up_logs').insert({
        conversation_id: candidate.conversation_id,
        reason: candidate.reason,
        scheduled_at: scheduledAt.toISOString(),
      });
    }
  }

  return { scheduled, skipped };
}


/**
 * Cancel scheduled follow-ups for a conversation (e.g., if user responds)
 */
export async function cancelFollowUps(
  supabase: SupabaseClient,
  conversationId: string
): Promise<number> {
  const { count } = await supabase
    .from('follow_up_messages')
    .update({ status: 'cancelled' })
    .eq('conversation_id', conversationId)
    .eq('status', 'pending');

  return count || 0;
}
