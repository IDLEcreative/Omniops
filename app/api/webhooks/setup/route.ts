/**
 * Automatic Webhook Setup API
 *
 * POST /api/webhooks/setup
 *
 * Automatically registers webhooks when user connects WooCommerce/Shopify
 * Called by the integration configuration UI - users don't need to do anything!
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  registerWooCommerceWebhook,
  checkWooCommerceWebhookStatus,
  deleteWooCommerceWebhook,
} from '@/lib/webhooks/woocommerce-webhook-manager';
import {
  registerShopifyWebhook,
  checkShopifyWebhookStatus,
  deleteShopifyWebhook,
} from '@/lib/webhooks/shopify-webhook-manager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { domain, platform, action } = body;

    if (!domain || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: domain, platform' },
        { status: 400 }
      );
    }

    // Verify user has access to this domain
    const { data: config } = await supabase
      .from('customer_configs')
      .select('*, organization:organizations!inner(*)')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    // Check organization membership
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', config.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Handle different platforms and actions
    if (platform === 'woocommerce') {
      return handleWooCommerceWebhook(action, domain, config);
    } else if (platform === 'shopify') {
      return handleShopifyWebhook(action, domain, config);
    } else {
      return NextResponse.json(
        { error: 'Invalid platform. Must be "woocommerce" or "shopify"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('[Webhook Setup API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleWooCommerceWebhook(
  action: string,
  domain: string,
  config: any
) {
  const woocommerceUrl = config.woocommerce_url;
  const consumerKey = config.woocommerce_consumer_key;
  const consumerSecret = config.woocommerce_consumer_secret;

  if (!woocommerceUrl || !consumerKey || !consumerSecret) {
    return NextResponse.json(
      { error: 'WooCommerce credentials not configured' },
      { status: 400 }
    );
  }

  if (action === 'register' || action === 'create') {
    const result = await registerWooCommerceWebhook(
      domain,
      woocommerceUrl,
      consumerKey,
      consumerSecret
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to register webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: 'woocommerce',
      webhookId: result.webhookId,
      message: 'Webhook registered successfully',
    });
  } else if (action === 'check' || action === 'status') {
    const status = await checkWooCommerceWebhookStatus(
      domain,
      woocommerceUrl,
      consumerKey,
      consumerSecret
    );

    return NextResponse.json({
      success: true,
      platform: 'woocommerce',
      ...status,
    });
  } else if (action === 'delete' || action === 'remove') {
    const result = await deleteWooCommerceWebhook(
      domain,
      woocommerceUrl,
      consumerKey,
      consumerSecret
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: 'woocommerce',
      message: 'Webhook deleted successfully',
    });
  } else {
    return NextResponse.json(
      { error: 'Invalid action. Must be "register", "check", or "delete"' },
      { status: 400 }
    );
  }
}

async function handleShopifyWebhook(action: string, domain: string, config: any) {
  const shopDomain = config.shopify_shop;
  const accessToken = config.shopify_access_token;

  if (!shopDomain || !accessToken) {
    return NextResponse.json(
      { error: 'Shopify credentials not configured' },
      { status: 400 }
    );
  }

  if (action === 'register' || action === 'create') {
    const result = await registerShopifyWebhook(domain, shopDomain, accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to register webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: 'shopify',
      webhookId: result.webhookId,
      message: 'Webhook registered successfully',
    });
  } else if (action === 'check' || action === 'status') {
    const status = await checkShopifyWebhookStatus(domain, shopDomain, accessToken);

    return NextResponse.json({
      success: true,
      platform: 'shopify',
      ...status,
    });
  } else if (action === 'delete' || action === 'remove') {
    const result = await deleteShopifyWebhook(domain, shopDomain, accessToken);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to delete webhook' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      platform: 'shopify',
      message: 'Webhook deleted successfully',
    });
  } else {
    return NextResponse.json(
      { error: 'Invalid action. Must be "register", "check", or "delete"' },
      { status: 400 }
    );
  }
}

// GET endpoint to check status
export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const domain = searchParams.get('domain');
    const platform = searchParams.get('platform');

    if (!domain || !platform) {
      return NextResponse.json(
        { error: 'Missing required parameters: domain, platform' },
        { status: 400 }
      );
    }

    const { data: config } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', domain)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    if (platform === 'woocommerce') {
      const status = await checkWooCommerceWebhookStatus(
        domain,
        config.woocommerce_url,
        config.woocommerce_consumer_key,
        config.woocommerce_consumer_secret
      );

      return NextResponse.json({
        success: true,
        platform: 'woocommerce',
        ...status,
      });
    } else if (platform === 'shopify') {
      const status = await checkShopifyWebhookStatus(
        domain,
        config.shopify_shop,
        config.shopify_access_token
      );

      return NextResponse.json({
        success: true,
        platform: 'shopify',
        ...status,
      });
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  } catch (error) {
    console.error('[Webhook Setup API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
