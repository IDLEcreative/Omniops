/**
 * Shopify Order Created Webhook Handler
 *
 * Receives order creation events from Shopify and attributes them to conversations
 * POST /api/webhooks/shopify/order-created
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyShopifyWebhook, extractShopifyHeaders } from '@/lib/webhooks/shopify-verifier';
import { parseShopifyOrder, shouldTrackShopifyOrder } from '@/lib/webhooks/shopify-order-parser';
import { attributePurchaseToConversation } from '@/lib/attribution/purchase-attributor';
import { recordPurchaseStage } from '@/lib/analytics/funnel-analytics';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { checkRateLimit } from '@/lib/rate-limit';
import { validateWebhookEvent, logWebhookEvent } from '@/lib/webhooks/replay-prevention';
import type { ShopifyOrderWebhook } from '@/types/purchase-attribution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // SECURITY: Rate limit webhook endpoint (100 requests per minute per IP)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  const { allowed } = await checkRateLimit(clientIp, 100, 60 * 1000);

  if (!allowed) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  try {
    // Get raw body for HMAC verification
    const rawBody = await request.text();
    const headers = extractShopifyHeaders(request.headers);

    console.log('[Shopify Webhook] Received order webhook', {
      topic: headers['x-shopify-topic'],
      shop: headers['x-shopify-shop-domain'],
    });

    // Parse the payload
    let payload: ShopifyOrderWebhook;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('[Shopify Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Get domain from shop domain header
    const shopDomain = headers['x-shopify-shop-domain'];
    if (!shopDomain) {
      console.error('[Shopify Webhook] Missing shop domain header');
      return NextResponse.json(
        { error: 'Missing shop domain' },
        { status: 400 }
      );
    }

    // Find customer config by Shopify shop domain
    const supabase = await createServiceRoleClient();
    const { data: config } = await supabase
      .from('customer_configs')
      .select('domain, shopify_access_token, encrypted_credentials')
      .eq('shopify_shop', shopDomain)
      .single();

    if (!config) {
      console.warn(`[Shopify Webhook] No config found for shop ${shopDomain}`);
      return NextResponse.json({ status: 'ignored', reason: 'shop_not_configured' });
    }

    const domain = config.domain;

    // Get webhook secret from encrypted_credentials (preferred) or fall back to access_token (deprecated)
    let webhookSecret: string | undefined;

    if (config.encrypted_credentials) {
      try {
        const credentials = typeof config.encrypted_credentials === 'string'
          ? JSON.parse(config.encrypted_credentials)
          : config.encrypted_credentials;

        webhookSecret = credentials.shopify?.webhook_secret;

        if (!webhookSecret) {
          console.warn(`[Shopify Webhook] No webhook_secret in encrypted_credentials for ${domain}, falling back to access_token (insecure)`);
          webhookSecret = config.shopify_access_token;
        }
      } catch (error) {
        console.error(`[Shopify Webhook] Failed to parse encrypted_credentials for ${domain}`, error);
        webhookSecret = config.shopify_access_token;
      }
    } else {
      console.warn(`[Shopify Webhook] Using deprecated shopify_access_token as webhook secret for ${domain} - migrate to encrypted_credentials.shopify.webhook_secret`);
      webhookSecret = config.shopify_access_token;
    }

    if (!webhookSecret) {
      console.warn(`[Shopify Webhook] No webhook secret configured for ${domain}`);
      return NextResponse.json({ status: 'ignored', reason: 'no_secret_configured' });
    }

    // Verify webhook HMAC
    const isValid = verifyShopifyWebhook(
      rawBody,
      headers['x-shopify-hmac-sha256'],
      webhookSecret
    );

    if (!isValid) {
      console.error('[Shopify Webhook] Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // SECURITY: Validate timestamp and check for replay attacks
    const eventId = payload.id?.toString();
    const eventTime = payload.created_at ? new Date(payload.created_at).getTime() / 1000 : 0;

    if (!eventId) {
      console.error('[Shopify Webhook] Missing event ID');
      return NextResponse.json(
        { error: 'Missing event ID' },
        { status: 400 }
      );
    }

    const replayCheck = await validateWebhookEvent(eventId, eventTime, 'shopify_order');

    if (!replayCheck.valid) {
      console.warn('[Shopify Webhook] Replay attack prevented', {
        eventId,
        reason: replayCheck.reason,
      });
      return NextResponse.json(
        { error: replayCheck.reason },
        { status: 400 }
      );
    }

    // Log event for audit trail (prevents future replay)
    await logWebhookEvent(eventId, 'shopify_order', payload);

    // Check if we should track this order
    if (!shouldTrackShopifyOrder(payload)) {
      console.log('[Shopify Webhook] Skipping order (test/invalid)', {
        orderId: payload.id,
      });
      return NextResponse.json({ status: 'ignored', reason: 'invalid_order' });
    }

    // Parse order data
    let orderData;
    try {
      orderData = parseShopifyOrder(payload);
    } catch (error) {
      console.error('[Shopify Webhook] Failed to parse order:', error);
      return NextResponse.json(
        { error: 'Invalid order data', details: (error as Error).message },
        { status: 400 }
      );
    }

    // Attribute purchase to conversation
    try {
      const attributionResult = await attributePurchaseToConversation({
        customerEmail: orderData.customerEmail,
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        orderTotal: orderData.total,
        orderTimestamp: orderData.orderCreatedAt,
        platform: 'shopify',
        domain,
        orderMetadata: {
          ...orderData.metadata,
          lineItems: orderData.lineItems,
          currency: orderData.currency,
        },
      });

      console.log('[Shopify Webhook] Purchase attributed', {
        orderId: orderData.orderId,
        conversationId: attributionResult.conversationId,
        confidence: attributionResult.confidence,
        method: attributionResult.method,
      });

      // Record purchase in funnel (Shopify orders are typically purchases, not abandoned carts)
      if (attributionResult.conversationId) {
        await recordPurchaseStage(
          attributionResult.conversationId,
          orderData.customerEmail,
          orderData.orderId,
          orderData.total,
          attributionResult.confidence,
          attributionResult.method
        );
      }

      return NextResponse.json({
        status: 'success',
        attribution: {
          conversationId: attributionResult.conversationId,
          confidence: attributionResult.confidence,
          method: attributionResult.method,
        },
      });
    } catch (error) {
      // Log error but return 200 to prevent webhook retries
      console.error('[Shopify Webhook] Attribution failed:', error);
      return NextResponse.json({
        status: 'error',
        error: 'Attribution failed',
        details: (error as Error).message,
      });
    }
  } catch (error) {
    console.error('[Shopify Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Return 405 for non-POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
