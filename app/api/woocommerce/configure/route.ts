import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { encrypt } from '@/lib/encryption';
import { withCSRF } from '@/lib/middleware/csrf';

/**
 * GET /api/woocommerce/configure
 * Fetch existing WooCommerce configuration for the authenticated user's organization
 *
 * Security: Only returns URL, never returns credentials
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 400 }
      );
    }

    // Get configuration for organization
    const { data: config, error } = await supabase
      .from('customer_configs')
      .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
      .eq('organization_id', membership.organization_id)
      .maybeSingle();

    if (error || !config) {
      return NextResponse.json({
        success: true,
        configured: false,
        url: null,
        hasCredentials: false,
      });
    }

    return NextResponse.json({
      success: true,
      configured: !!config.woocommerce_url,
      url: config.woocommerce_url,
      hasCredentials: !!(config.woocommerce_consumer_key && config.woocommerce_consumer_secret),
      // Security: Never return actual consumer_key or consumer_secret values
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
 * Save WooCommerce configuration for the authenticated user's organization
 *
 * CSRF PROTECTED: Requires valid CSRF token in X-CSRF-Token header
 *
 * Body: { url, consumerKey, consumerSecret }
 *
 * Security: Encrypts consumer key and secret before storage
 */
async function handlePost(request: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: 'No organization found' },
        { status: 400 }
      );
    }

    const organizationId = membership.organization_id;

    const body = await request.json();
    const { url, consumerKey, consumerSecret } = body;

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

    // Check if configuration exists for this organization
    const { data: existingConfig } = await supabase
      .from('customer_configs')
      .select('id, domain')
      .eq('organization_id', organizationId)
      .maybeSingle();

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
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error updating WooCommerce configuration:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to update configuration' },
          { status: 500 }
        );
      }
    } else {
      // Create new configuration for organization
      // Use organization_id as the domain for now (can be updated later)
      const { error } = await supabase
        .from('customer_configs')
        .insert({
          organization_id: organizationId,
          domain: organizationId, // Temporary: use org ID as domain
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

// Export POST handler with CSRF protection
export const POST = withCSRF(handlePost);
