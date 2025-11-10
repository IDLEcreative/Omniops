/**
 * Follow-up Message Sender
 *
 * Handles sending pending follow-up messages
 * Called by cron jobs to process scheduled messages
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { sendEmail, sendInAppNotification } from './channel-handlers';

/**
 * Send pending follow-up messages (to be called by cron job)
 */
export async function sendPendingFollowUps(
  supabase: SupabaseClient,
  limit: number = 50
): Promise<{ sent: number; failed: number }> {
  // Get pending messages that are due
  const now = new Date().toISOString();

  const { data: pendingMessages } = await supabase
    .from('follow_up_messages')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (!pendingMessages || pendingMessages.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const message of pendingMessages) {
    try {
      if (message.channel === 'email') {
        await sendEmail(message);
      } else if (message.channel === 'in_app') {
        await sendInAppNotification(supabase, message);
      }

      // Mark as sent
      await supabase
        .from('follow_up_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', message.id);

      sent++;
    } catch (error) {
      console.error('[FollowUpScheduler] Send failed:', error);

      // Mark as failed
      await supabase
        .from('follow_up_messages')
        .update({
          status: 'failed',
          metadata: {
            ...message.metadata,
            error: String(error),
          },
        })
        .eq('id', message.id);

      failed++;
    }
  }

  return { sent, failed };
}
