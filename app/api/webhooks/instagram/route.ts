import { NextRequest, NextResponse } from 'next/server';
import { InstagramOAuth } from '@/lib/instagram-oauth';
import { InstagramAPI, getInstagramCredentials } from '@/lib/instagram-api';
import { createClient } from '@/lib/supabase/server';
import { processAIConversation } from '@/lib/chat/ai-processor';
import { getOpenAIClient } from '@/lib/chat/openai-client';
import { ChatTelemetry } from '@/lib/chat-telemetry';

/**
 * GET /api/webhooks/instagram
 * Webhook verification endpoint (Meta requirement)
 *
 * Meta sends a GET request with verification parameters when
 * you configure the webhook URL in the developer dashboard.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');


  // Verify that mode and token match expected values
  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
    // Respond with challenge to confirm verification
    return new NextResponse(challenge, { status: 200 });
  }

  console.error('❌ Instagram webhook verification failed');
  console.error('   Expected token:', process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN);
  console.error('   Received token:', token);

  return NextResponse.json(
    { error: 'Verification failed' },
    { status: 403 }
  );
}

/**
 * POST /api/webhooks/instagram
 * Handle incoming Instagram messages
 *
 * Meta sends POST requests to this endpoint when:
 * - User sends a DM to the Instagram Business account
 * - User clicks a button in a message
 * - Other messaging events occur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');

    // Verify webhook signature (security - prevents spoofing)
    if (!signature || !process.env.INSTAGRAM_APP_SECRET) {
      console.error('❌ Missing signature or app secret');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    if (!InstagramOAuth.verifyWebhookSignature(
      body,
      signature,
      process.env.INSTAGRAM_APP_SECRET
    )) {
      console.error('❌ Invalid Instagram webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    const data = JSON.parse(body);

    console.log('📨 Instagram webhook received:', JSON.stringify(data, null, 2));

    // Process each entry (Meta can batch multiple messages)
    for (const entry of data.entry || []) {
      for (const messaging of entry.messaging || []) {
        if (messaging.message) {
          // Process message asynchronously (don't block webhook response)
          handleIncomingMessage(messaging).catch((error) => {
            console.error('❌ Error handling Instagram message:', error);
          });
        }
      }
    }

    // Meta requires 200 OK response within 20 seconds
    // We respond immediately and process messages asynchronously
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Instagram webhook error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Process incoming Instagram message
 * This runs asynchronously after webhook responds to Meta
 */
async function handleIncomingMessage(messaging: any) {
  const senderId = messaging.sender.id;
  const recipientId = messaging.recipient.id;
  const messageText = messaging.message.text;
  const messageId = messaging.message.mid;


  const supabase = await createClient();
  if (!supabase) {
    console.error('❌ Failed to initialize database client');
    return;
  }

  // Find customer by Instagram account ID
  // Note: We need to decrypt to compare, so we'll fetch all active credentials
  const { data: allCreds, error: credsError } = await supabase
    .from('instagram_credentials')
    .select('*')
    .eq('is_active', true);

  if (credsError || !allCreds || allCreds.length === 0) {
    console.error('❌ No active Instagram credentials found');
    return;
  }

  // Find matching credentials by comparing decrypted Instagram account IDs
  const { decrypt } = await import('@/lib/encryption');
  let matchingCreds = null;

  for (const cred of allCreds) {
    try {
      const decryptedId = decrypt(cred.encrypted_instagram_account_id);
      if (decryptedId === recipientId) {
        matchingCreds = cred;
        break;
      }
    } catch (error) {
      console.error('❌ Failed to decrypt Instagram account ID:', error);
      continue;
    }
  }

  if (!matchingCreds) {
    console.error('❌ No customer found for Instagram account:', recipientId);
    return;
  }


  // Get or create conversation
  const { data: conversationData, error: convError } = await supabase
    .from('conversations')
    .select('*')
    .eq('customer_id', matchingCreds.customer_id)
    .eq('channel', 'instagram')
    .eq('external_user_id', senderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (convError) {
    console.error('❌ Error fetching conversation:', convError);
    return;
  }

  let conversation = conversationData;

  if (!conversation) {

    // Get sender's Instagram profile
    const instagramCreds = await getInstagramCredentials(matchingCreds.customer_id);
    if (!instagramCreds) {
      console.error('❌ Failed to load Instagram credentials');
      return;
    }

    const api = new InstagramAPI(instagramCreds);
    let profile;
    try {
      profile = await api.getUserProfile(senderId);
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      profile = { username: 'unknown', name: 'Unknown User' };
    }

    // Create new conversation
    const { data: newConv, error: createError } = await supabase
      .from('conversations')
      .insert({
        customer_id: matchingCreds.customer_id,
        channel: 'instagram',
        external_user_id: senderId,
        external_username: profile.username,
        metadata: { instagram_name: profile.name },
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Failed to create conversation:', createError);
      return;
    }

    if (!newConv) {
      console.error('❌ Failed to create conversation: no data returned');
      return;
    }

    conversation = newConv;
  }

  // Save incoming message
  const { error: msgError } = await supabase.from('messages').insert({
    conversation_id: conversation!.id,
    role: 'user',
    content: messageText,
    external_message_id: messageId,
    metadata: { source: 'instagram', sender_id: senderId },
  });

  if (msgError) {
    console.error('❌ Failed to save incoming message:', msgError);
    return;
  }


  // Get customer config for AI processing
  const { data: customerConfig, error: configError } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('id', matchingCreds.customer_id)
    .single();

  if (configError || !customerConfig) {
    console.error('❌ Failed to load customer config:', configError);
    return;
  }

  // Get conversation history
  const { data: messages, error: historyError } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversation!.id)
    .order('created_at', { ascending: true });

  if (historyError) {
    console.error('❌ Failed to load conversation history:', historyError);
    return;
  }


  // Process with AI
  const openaiClient = getOpenAIClient();
  if (!openaiClient) {
    console.error('❌ Failed to initialize OpenAI client');
    return;
  }
  const sessionId = `instagram-${conversation!.id}-${Date.now()}`;
  const telemetry = new ChatTelemetry(sessionId, customerConfig.domain);

  try {
    // Prepare conversation messages for AI processor
    const conversationMessages = (messages || []).map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Add current message if not already in history
    if (!conversationMessages.some(m => m.content === messageText)) {
      conversationMessages.push({
        role: 'user',
        content: messageText
      });
    }

    const aiResult = await processAIConversation({
      conversationMessages,
      domain: customerConfig.domain,
      config: customerConfig,
      widgetConfig: null,
      telemetry,
      openaiClient: openaiClient,
      useGPT5Mini: false,
      dependencies: {
        getCommerceProvider: null,
        searchSimilarContent: null,
        sanitizeOutboundLinks: null,
      },
    });

    const aiResponse = aiResult.finalResponse;
    console.log('✅ AI response generated:', aiResponse.substring(0, 100) + '...');

    // Send response via Instagram
    const instagramCreds = await getInstagramCredentials(matchingCreds.customer_id);
    if (!instagramCreds) {
      console.error('❌ Failed to load Instagram credentials for sending');
      return;
    }

    const api = new InstagramAPI(instagramCreds);
    const sentMessageId = await api.sendMessage(senderId, aiResponse);


    // Save AI response
    await supabase.from('messages').insert({
      conversation_id: conversation!.id,
      role: 'assistant',
      content: aiResponse,
      external_message_id: sentMessageId,
      metadata: { source: 'instagram' },
    });

    // Update last message timestamp
    await supabase
      .from('instagram_credentials')
      .update({
        last_message_at: new Date().toISOString(),
        last_webhook_at: new Date().toISOString(),
      })
      .eq('customer_id', matchingCreds.customer_id);


  } catch (error) {
    console.error('❌ AI processing error:', error);

    // Send error message to user
    try {
      const instagramCreds = await getInstagramCredentials(matchingCreds.customer_id);
      if (instagramCreds) {
        const api = new InstagramAPI(instagramCreds);
        await api.sendMessage(
          senderId,
          "I'm sorry, I encountered an error processing your message. Please try again later."
        );
      }
    } catch (sendError) {
      console.error('❌ Failed to send error message:', sendError);
    }
  }
}