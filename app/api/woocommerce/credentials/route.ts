import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decrypt } from '@/lib/encryption';

/**
 * GET /api/woocommerce/credentials?domain=xxx
 * Fetch decrypted WooCommerce credentials for authenticated users
 *
 * Security: Only returns decrypted credentials to authenticated dashboard users
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
      .select('woocommerce_consumer_key, woocommerce_consumer_secret')
      .eq('domain', domain)
      .single();

    if (error || !config) {
      return NextResponse.json({
        success: false,
        error: 'Configuration not found',
      }, { status: 404 });
    }

    // Decrypt credentials (or return plain text if not encrypted)
    let consumerKey = '';
    let consumerSecret = '';

    try {
      if (config.woocommerce_consumer_key) {
        try {
          // Try to decrypt first
          consumerKey = decrypt(config.woocommerce_consumer_key);
        } catch (decryptError) {
          // If decryption fails, assume it's plain text
          consumerKey = config.woocommerce_consumer_key;
        }
      }
      if (config.woocommerce_consumer_secret) {
        try {
          // Try to decrypt first
          consumerSecret = decrypt(config.woocommerce_consumer_secret);
        } catch (decryptError) {
          // If decryption fails, assume it's plain text
          consumerSecret = config.woocommerce_consumer_secret;
        }
      }
    } catch (error) {
      console.error('Failed to process credentials:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to process credentials',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      consumerKey,
      consumerSecret,
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
