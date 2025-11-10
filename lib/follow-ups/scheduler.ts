/**
 * Follow-up Scheduler
 *
 * Schedules and sends automated follow-up messages
 * Supports email, in-app notifications, and SMS (future)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FollowUpCandidate, FollowUpReason } from './detector';

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
 * Generate follow-up message content based on reason
 */
function generateFollowUpMessage(
  candidate: FollowUpCandidate,
  channel: 'email' | 'in_app'
): { subject: string; content: string } {
  const templates = {
    abandoned_conversation: {
      email: {
        subject: 'Did you find what you were looking for?',
        content: `Hi there,

We noticed you were asking about something earlier but didn't get a chance to fully assist you.

We'd love to help! Feel free to reply to this email or visit our chat again, and we'll make sure your questions get answered.

Best regards,
The Support Team`,
      },
      in_app: {
        subject: 'Need help?',
        content: 'We noticed you had a question earlier. Would you like to continue the conversation?',
      },
    },
    unresolved_issue: {
      email: {
        subject: 'Following up on your recent question',
        content: `Hi,

We wanted to check in about your recent conversation with us. We noticed it might not have been fully resolved.

Is there anything else we can help you with?

Please don't hesitate to reach out if you need further assistance.

Best regards,
The Support Team`,
      },
      in_app: {
        subject: 'Issue resolved?',
        content: 'We want to make sure your question was fully answered. Need any more help?',
      },
    },
    low_satisfaction: {
      email: {
        subject: 'We\'d like to help',
        content: `Hi,

We noticed your recent experience might not have met your expectations, and we sincerely apologize.

Your satisfaction is important to us. If there's anything we can do to help or improve, please let us know.

A member of our team is standing by to assist you personally.

Best regards,
The Support Team`,
      },
      in_app: {
        subject: 'Can we help?',
        content: 'We want to make things right. A support specialist is available to assist you personally.',
      },
    },
    cart_abandonment: {
      email: {
        subject: 'You left something in your cart',
        content: `Hi,

We noticed you were interested in some products but didn't complete your purchase.

Your items are still waiting for you! If you had any questions or concerns, we're here to help.

Reply to this email or visit our chat, and we'll make sure you get what you need.

Best regards,
The Support Team`,
      },
      in_app: {
        subject: 'Complete your purchase?',
        content: 'You have items in your cart. Need help completing your order?',
      },
    },
    unanswered_question: {
      email: {
        subject: 'We have an answer for you',
        content: `Hi,

We noticed you asked a question that we may not have fully answered.

We'd love to help! Just reply to this email or visit our chat again.

Best regards,
The Support Team`,
      },
      in_app: {
        subject: 'Got your answer?',
        content: 'We want to make sure your question was answered. Still need help?',
      },
    },
    product_inquiry: {
      email: {
        subject: 'About the product you asked about',
        content: `Hi,

We saw you were interested in one of our products.

If you have any questions about features, pricing, or availability, we're here to help!

Best regards,
The Support Team`,
      },
      in_app: {
        subject: 'Product questions?',
        content: 'We can help you learn more about the products you were looking at.',
      },
    },
  };

  const template = templates[candidate.reason][channel];
  return template;
}

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

/**
 * Send email follow-up (placeholder - integrate with email service)
 */
async function sendEmail(message: any): Promise<void> {
  // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
  console.log('[FollowUpScheduler] Would send email:', {
    to: message.recipient,
    subject: message.subject,
    body: message.content,
  });

  // For now, log to console
  // In production, integrate with your email provider
}

/**
 * Send in-app notification
 */
async function sendInAppNotification(
  supabase: SupabaseClient,
  message: any
): Promise<void> {
  // Insert notification into database
  await supabase.from('notifications').insert({
    session_id: message.session_id,
    type: 'follow_up',
    title: message.subject,
    message: message.content,
    metadata: {
      conversation_id: message.conversation_id,
      reason: message.reason,
    },
  });
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
