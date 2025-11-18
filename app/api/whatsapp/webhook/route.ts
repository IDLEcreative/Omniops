/**
 * WhatsApp Webhook Endpoint
 *
 * Receives all incoming messages and status updates from Meta WhatsApp Cloud API.
 *
 * Webhook Events:
 * - messages: User sends message to business
 * - statuses: Message delivery/read status updates
 * - template_status: Template approval/rejection notifications
 *
 * Security: All webhooks verified with HMAC-SHA256 signature
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

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

/**
 * Handle Incoming Messages
 *
 * Process user messages:
 * 1. Find or create conversation
 * 2. Extend 24-hour session
 * 3. Save message to database
 * 4. Trigger AI response
 */
async function handleIncomingMessages(value: any): Promise<void> {
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
async function handleStatusUpdates(value: any): Promise<void> {
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
async function handleTemplateStatus(value: any): Promise<void> {
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

/**
 * Helper Functions
 */

interface CustomerConfig {
  id: string;
  domain: string;
  domain_id: string;
  whatsapp_phone_number: string;
  whatsapp_phone_number_id: string;
  whatsapp_business_account_id: string;
}

async function getCustomerConfigByPhoneNumberId(phoneNumberId: string): Promise<CustomerConfig | null> {
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

interface FindOrCreateConversationParams {
  phoneNumber: string;
  phoneNumberId: string;
  customerConfig: CustomerConfig;
  contactName?: string;
}

async function findOrCreateWhatsAppConversation(params: FindOrCreateConversationParams) {
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

async function extendWhatsAppSession(conversationId: string, phoneNumber: string): Promise<void> {
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

interface SaveMessageParams {
  conversationId: string;
  message: any;
  role: 'user' | 'assistant';
}

async function saveWhatsAppMessage(params: SaveMessageParams): Promise<void> {
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
      mediaUrl = message.image.id; // Store media ID for later download
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
    status: 'delivered', // User message is already delivered
    media_type: mediaType,
    media_url: mediaUrl,
    media_metadata: mediaMetadata,
    metadata: {
      whatsapp_timestamp: message.timestamp,
    },
  });
}

async function processWhatsAppMessage(
  conversationId: string,
  message: any,
  customerConfig: CustomerConfig
): Promise<void> {
  // This will integrate with existing chat API
  // For now, placeholder - will implement in Phase 2
  console.log('🤖 Processing message with AI (Phase 2 implementation)');
}
