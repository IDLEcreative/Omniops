/**
 * WhatsApp Webhook Helper Functions
 *
 * @purpose Database operations and utilities for webhook processing
 *
 * @flow
 *   1. Provide helper functions for webhook handlers
 *   2. → Execute database operations
 *   3. → Return results or void
 *
 * @keyFunctions
 *   - getCustomerConfigByPhoneNumberId (line 72): Fetch customer config
 *   - findOrCreateWhatsAppConversation (line 92): Get or create conversation
 *   - extendWhatsAppSession (line 136): Update session expiry
 *   - saveWhatsAppMessage (line 149): Store message in database
 *   - processWhatsAppMessage (line 203): Trigger AI processing
 *
 * @handles
 *   - Customer config lookup
 *   - Conversation management
 *   - Session management
 *   - Message persistence
 *   - Media handling (image, document, audio, video)
 *
 * @returns Database records or void
 *
 * @dependencies
 *   - @/lib/supabase/server
 *
 * @consumers
 *   - app/api/whatsapp/webhook/handlers.ts
 *
 * @totalLines 212
 * @estimatedTokens 820 (without header), 920 (with header - 11% savings)
 */

import { createClient } from '@/lib/supabase/server';

export interface CustomerConfig {
  id: string;
  domain: string;
  domain_id: string;
  whatsapp_phone_number: string;
  whatsapp_phone_number_id: string;
  whatsapp_business_account_id: string;
}

interface FindOrCreateConversationParams {
  phoneNumber: string;
  phoneNumberId: string;
  customerConfig: CustomerConfig;
  contactName?: string;
}

interface SaveMessageParams {
  conversationId: string;
  message: any;
  role: 'user' | 'assistant';
}

/**
 * Get customer config by phone number ID
 */
export async function getCustomerConfigByPhoneNumberId(phoneNumberId: string): Promise<CustomerConfig | null> {
  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize database client');
    return null;
  }

  const { data } = await supabase
    .from('customer_configs')
    .select('id, domain, domain_id, whatsapp_phone_number, whatsapp_phone_number_id, whatsapp_business_account_id')
    .eq('whatsapp_phone_number_id', phoneNumberId)
    .eq('whatsapp_enabled', true)
    .single();

  return data;
}

/**
 * Find existing or create new WhatsApp conversation
 */
export async function findOrCreateWhatsAppConversation(params: FindOrCreateConversationParams) {
  const { phoneNumber, phoneNumberId, customerConfig, contactName } = params;
  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize database client');
    return null;
  }

  // Try to find existing conversation by phone number
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('domain_id', customerConfig.domain_id)
    .eq('channel', 'whatsapp')
    .eq('channel_metadata->whatsapp->phone_number', phoneNumber)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (existing) {
    return existing;
  }

  // Create new conversation
  const { data: newConversation } = await supabase
    .from('conversations')
    .insert({
      domain_id: customerConfig.domain_id,
      session_id: `whatsapp_${phoneNumber}_${Date.now()}`,
      channel: 'whatsapp',
      channel_metadata: {
        whatsapp: {
          phone_number: phoneNumber,
          phone_number_id: phoneNumberId,
          waba_id: customerConfig.whatsapp_business_account_id,
          contact_name: contactName,
        },
      },
      metadata: {
        contact_name: contactName,
      },
    })
    .select()
    .single();

  return newConversation!;
}

/**
 * Extend WhatsApp session (24-hour window)
 */
export async function extendWhatsAppSession(conversationId: string, phoneNumber: string): Promise<void> {
  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize database client');
    return;
  }

  await supabase.rpc('extend_whatsapp_session', {
    p_conversation_id: conversationId,
    p_phone_number: phoneNumber,
  });
}

/**
 * Save WhatsApp message to database
 */
export async function saveWhatsAppMessage(params: SaveMessageParams): Promise<void> {
  const { conversationId, message, role } = params;
  const supabase = await createClient();
  if (!supabase) {
    console.error('Failed to initialize database client');
    return;
  }

  // Extract message content based on type
  let content = '';
  let mediaType = 'text';
  let mediaUrl = null;
  let mediaMetadata = null;

  switch (message.type) {
    case 'text':
      content = message.text.body;
      break;
    case 'image':
      content = message.image.caption || '[Image]';
      mediaType = 'image';
      mediaUrl = message.image.id;
      mediaMetadata = { mime_type: message.image.mime_type };
      break;
    case 'document':
      content = message.document.caption || message.document.filename || '[Document]';
      mediaType = 'document';
      mediaUrl = message.document.id;
      mediaMetadata = {
        filename: message.document.filename,
        mime_type: message.document.mime_type,
      };
      break;
    case 'audio':
      content = '[Voice Message]';
      mediaType = 'audio';
      mediaUrl = message.audio.id;
      mediaMetadata = { mime_type: message.audio.mime_type };
      break;
    case 'video':
      content = message.video.caption || '[Video]';
      mediaType = 'video';
      mediaUrl = message.video.id;
      mediaMetadata = { mime_type: message.video.mime_type };
      break;
    default:
      content = `[Unsupported message type: ${message.type}]`;
  }

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    role,
    content,
    external_id: message.id,
    status: 'delivered',
    media_type: mediaType,
    media_url: mediaUrl,
    media_metadata: mediaMetadata,
    metadata: {
      whatsapp_timestamp: message.timestamp,
    },
  });
}

/**
 * Process WhatsApp message with AI (Phase 2 implementation)
 */
export async function processWhatsAppMessage(
  conversationId: string,
  message: any,
  customerConfig: CustomerConfig
): Promise<void> {
  // This will integrate with existing chat API
  // For now, placeholder - will implement in Phase 2
  console.log('🤖 Processing message with AI (Phase 2 implementation)');
}
