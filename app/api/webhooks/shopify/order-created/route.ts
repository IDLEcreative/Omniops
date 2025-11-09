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
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { ShopifyOrderWebhook } from '@/types/purchase-attribution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
      .select('domain, shopify_access_token')
      .eq('shopify_shop', shopDomain)
      .single();

    if (!config) {
      console.warn(`[Shopify Webhook] No config found for shop ${shopDomain}`);
      return NextResponse.json({ status: 'ignored', reason: 'shop_not_configured' });
    }

    const domain = config.domain;

    // Get webhook secret (use Shopify API secret key)
    // Note: In production, this should be stored in encrypted_credentials
    if (!config.shopify_access_token) {
      console.warn(`[Shopify Webhook] No Shopify secret configured for ${domain}`);
      return NextResponse.json({ status: 'ignored', reason: 'no_secret_configured' });
    }

    // Verify webhook HMAC
    const isValid = verifyShopifyWebhook(
      rawBody,
      headers['x-shopify-hmac-sha256'],
      config.shopify_access_token
    );

    if (!isValid) {
      console.error('[Shopify Webhook] Invalid HMAC signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

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
