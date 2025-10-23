import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { encrypt } from '@/lib/encryption';

/**
 * GET /api/woocommerce/configure?domain=xxx
 * Fetch existing WooCommerce configuration for a domain
 *
 * Security: Only returns URL, never returns credentials
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    const { data: config, error } = await supabase
      .from('customer_configs')
      .select('woocommerce_url')
      .eq('domain', domain)
      .single();

    if (error || !config) {
      return NextResponse.json({
        success: true,
        configured: false,
        url: null,
      });
    }

    return NextResponse.json({
      success: true,
      configured: !!config.woocommerce_url,
      url: config.woocommerce_url,
      // Security: Never return consumer_key or consumer_secret
    });
  } catch (error) {
    console.error('Error fetching WooCommerce configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/woocommerce/configure
 * Save WooCommerce configuration for a domain
 *
 * Body: { url, consumerKey, consumerSecret, domain? }
 *
 * Security: Encrypts consumer key and secret before storage
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, consumerKey, consumerSecret, domain } = body;

    // Get domain from request or body
    const customerDomain = domain || request.headers.get('host') || 'localhost';

    // Validation
    if (!url || !consumerKey || !consumerSecret) {
      return NextResponse.json(
        { success: false, error: 'URL, consumer key, and consumer secret are required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!parsedUrl.protocol.match(/^https?:$/)) {
        return NextResponse.json(
          { success: false, error: 'Store URL must use HTTP or HTTPS protocol' },
          { status: 400 }
        );
      }
    } catch (urlError) {
      return NextResponse.json(
        { success: false, error: 'Invalid store URL format' },
        { status: 400 }
      );
    }

    // Validate consumer key format (should start with ck_)
    if (!consumerKey.startsWith('ck_')) {
      return NextResponse.json(
        { success: false, error: 'Consumer key should start with "ck_"' },
        { status: 400 }
      );
    }

    // Validate consumer secret format (should start with cs_)
    if (!consumerSecret.startsWith('cs_')) {
      return NextResponse.json(
        { success: false, error: 'Consumer secret should start with "cs_"' },
        { status: 400 }
      );
    }

    // Encrypt credentials
    const encryptedKey = encrypt(consumerKey);
    const encryptedSecret = encrypt(consumerSecret);

    // Save to database
    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Check if configuration exists
    const { data: existingConfig } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', customerDomain)
      .single();

    if (existingConfig) {
      // Update existing configuration
      const { error } = await supabase
        .from('customer_configs')
        .update({
          woocommerce_url: url,
          woocommerce_consumer_key: encryptedKey,
          woocommerce_consumer_secret: encryptedSecret,
          updated_at: new Date().toISOString(),
        })
        .eq('domain', customerDomain);

      if (error) {
        console.error('Error updating WooCommerce configuration:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update configuration' },
          { status: 500 }
        );
      }
    } else {
      // Create new configuration
      const { error } = await supabase
        .from('customer_configs')
        .insert({
          domain: customerDomain,
          woocommerce_url: url,
          woocommerce_consumer_key: encryptedKey,
          woocommerce_consumer_secret: encryptedSecret,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating WooCommerce configuration:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to save configuration' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'WooCommerce configuration saved successfully',
    });
  } catch (error) {
    console.error('Error saving WooCommerce configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
