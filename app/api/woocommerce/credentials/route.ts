import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
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

    // ✅ SECURITY FIX: Authenticate user before allowing access to credentials
    const authClient = await createClient();

    if (!authClient) {
      return NextResponse.json(
        { success: false, error: 'Authentication service unavailable' },
        { status: 503 }
      );
    }

    // Check if user is authenticated
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Authentication required' },
        { status: 401 }
      );
    }

    // Verify user has access to this domain via organization membership
    const { data: membership, error: membershipError } = await authClient
      .from('organization_members')
      .select('organization_id, organizations(customer_configs(domain))')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - No organization access' },
        { status: 403 }
      );
    }

    // Check if the requested domain belongs to user's organization
    const orgDomains = (membership.organizations as any)?.customer_configs || [];
    const hasAccess = orgDomains.some((config: any) => config.domain === domain);

    if (!hasAccess) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - No access to this domain' },
        { status: 403 }
      );
    }

    // Now use service role to fetch credentials
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
