/**
 * WhatsApp Webhook Handlers
 *
 * @purpose Process different webhook event types (messages, statuses, templates)
 *
 * @flow
 *   1. Receive webhook value object
 *   2. → Route to appropriate handler
 *   3. → Process and store in database
 *
 * @keyFunctions
 *   - handleIncomingMessages (line 62): Process user messages
 *   - handleStatusUpdates (line 109): Update message delivery status
 *   - handleTemplateStatus (line 133): Update template approval status
 *
 * @handles
 *   - Message processing and AI response triggering
 *   - Status updates (sent, delivered, read, failed)
 *   - Template status changes (approved, rejected)
 *
 * @returns Promise<void>
 *
 * @dependencies
 *   - @/lib/supabase/server
 *   - ./helpers.ts
 *
 * @consumers
 *   - app/api/whatsapp/webhook/route.ts
 *
 * @totalLines 146
 * @estimatedTokens 580 (without header), 680 (with header - 15% savings)
 */

import { createClient } from '@/lib/supabase/server';
import {
  getCustomerConfigByPhoneNumberId,
  findOrCreateWhatsAppConversation,
  extendWhatsAppSession,
  saveWhatsAppMessage,
  processWhatsAppMessage,
  type CustomerConfig,
} from './helpers';

/**
 * Handle Incoming Messages
 *
 * Process user messages:
 * 1. Find or create conversation
 * 2. Extend 24-hour session
 * 3. Save message to database
 * 4. Trigger AI response
 */
export async function handleIncomingMessages(value: any): Promise<void> {
  const message = value.messages[0];
  const metadata = value.metadata;
  const contact = value.contacts?.[0];

  console.log('📱 WhatsApp message received:', {
    from: message.from,
    type: message.type,
    messageId: message.id,
  });

  // Get customer config by phone number ID
  const customerConfig = await getCustomerConfigByPhoneNumberId(metadata.phone_number_id);

  if (!customerConfig) {
    console.error('❌ No customer config found for phone number:', metadata.phone_number_id);
    return;
  }

  // Find or create conversation
  const conversation = await findOrCreateWhatsAppConversation({
    phoneNumber: message.from,
    phoneNumberId: metadata.phone_number_id,
    customerConfig,
    contactName: contact?.profile?.name,
  });

  // Extend session (24-hour window)
  await extendWhatsAppSession(conversation.id, message.from);

  // Save message to database
  await saveWhatsAppMessage({
    conversationId: conversation.id,
    message,
    role: 'user',
  });

  // Trigger AI response (async - don't wait)
  processWhatsAppMessage(conversation.id, message, customerConfig).catch((error) => {
    console.error('Failed to process WhatsApp message:', error);
  });
}

/**
 * Handle Status Updates
 *
 * Update message status when:
 * - Message sent to WhatsApp servers
 * - Message delivered to user's phone
 * - User reads message
 * - Message fails to deliver
 */
export async function handleStatusUpdates(value: any): Promise<void> {
  const status = value.statuses[0];

  console.log('📊 WhatsApp status update:', {
    messageId: status.id,
    status: status.status,
    recipient: status.recipient_id,
  });

  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize database client');
    return;
  }

  await supabase
    .from('messages')
    .update({
      status: status.status,
      metadata: {
        status_timestamp: status.timestamp,
        errors: status.errors,
      },
    })
    .eq('external_id', status.id);
}

/**
 * Handle Template Status Updates
 *
 * Update template approval status when:
 * - Template approved by Meta
 * - Template rejected by Meta
 * - Template paused/disabled
 */
export async function handleTemplateStatus(value: any): Promise<void> {
  const templateStatus = value.template_status;

  console.log('📝 WhatsApp template status:', templateStatus);

  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize database client');
    return;
  }

  await supabase
    .from('whatsapp_templates')
    .update({
      status: templateStatus.status,
      updated_at: new Date().toISOString(),
    })
    .eq('template_id', templateStatus.message_template_id);
}
