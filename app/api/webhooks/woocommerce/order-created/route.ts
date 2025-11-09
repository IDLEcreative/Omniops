/**
 * WooCommerce Order Created Webhook Handler
 *
 * Receives order creation events from WooCommerce and attributes them to conversations
 * POST /api/webhooks/woocommerce/order-created
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyWooCommerceWebhook, extractWooCommerceHeaders } from '@/lib/webhooks/woocommerce-verifier';
import { parseWooCommerceOrder, shouldTrackWooCommerceOrder } from '@/lib/webhooks/woocommerce-order-parser';
import { attributePurchaseToConversation } from '@/lib/attribution/purchase-attributor';
import { createServiceRoleClient } from '@/lib/supabase-server';
import type { WooCommerceOrderWebhook } from '@/types/purchase-attribution';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const headers = extractWooCommerceHeaders(request.headers);

    console.log('[WooCommerce Webhook] Received order webhook', {
      topic: headers['x-wc-webhook-topic'],
      source: headers['x-wc-webhook-source'],
    });

    // Parse the payload
    let payload: WooCommerceOrderWebhook;
    try {
      payload = JSON.parse(rawBody);
    } catch (error) {
      console.error('[WooCommerce Webhook] Invalid JSON payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Get domain from webhook source URL
    let domain: string;
    try {
      const sourceUrl = headers['x-wc-webhook-source'];
      if (!sourceUrl) {
        throw new Error('Missing webhook source');
      }
      const url = new URL(sourceUrl);
      domain = url.hostname;
    } catch (error) {
      console.error('[WooCommerce Webhook] Could not extract domain');
      return NextResponse.json(
        { error: 'Invalid webhook source' },
        { status: 400 }
      );
    }

    // Get webhook secret from customer config
    const supabase = await createServiceRoleClient();
    const { data: config } = await supabase
      .from('customer_configs')
      .select('encrypted_credentials')
      .eq('domain', domain)
      .single();

    if (!config?.encrypted_credentials?.woocommerce_webhook_secret) {
      console.warn(`[WooCommerce Webhook] No webhook secret configured for ${domain}`);
      // Return 200 to prevent webhook retries, but don't process
      return NextResponse.json({ status: 'ignored', reason: 'no_secret_configured' });
    }

    // Verify webhook signature
    const webhookSecret = config.encrypted_credentials.woocommerce_webhook_secret;
    const isValid = verifyWooCommerceWebhook(
      rawBody,
      headers['x-wc-webhook-signature'],
      webhookSecret
    );

    if (!isValid) {
      console.error('[WooCommerce Webhook] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Check if we should track this order
    if (!shouldTrackWooCommerceOrder(payload)) {
      console.log('[WooCommerce Webhook] Skipping order (test/invalid)', {
        orderId: payload.id,
        status: payload.status,
      });
      return NextResponse.json({ status: 'ignored', reason: 'invalid_order' });
    }

    // Parse order data
    let orderData;
    try {
      orderData = parseWooCommerceOrder(payload);
    } catch (error) {
      console.error('[WooCommerce Webhook] Failed to parse order:', error);
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
        platform: 'woocommerce',
        domain,
        orderMetadata: {
          ...orderData.metadata,
          lineItems: orderData.lineItems,
          currency: orderData.currency,
        },
      });

      console.log('[WooCommerce Webhook] Purchase attributed', {
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
      console.error('[WooCommerce Webhook] Attribution failed:', error);
      return NextResponse.json({
        status: 'error',
        error: 'Attribution failed',
        details: (error as Error).message,
      });
    }
  } catch (error) {
    console.error('[WooCommerce Webhook] Unexpected error:', error);
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
