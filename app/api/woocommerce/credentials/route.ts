import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { decrypt, isEncrypted } from '@/lib/encryption';
import { logger } from '@/lib/logger';

/**
 * GET /api/woocommerce/credentials?domain=xxx
 * Fetch decrypted WooCommerce credentials for authenticated users
 *
 * Security: Requires authentication and verifies organization membership
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Get and validate domain parameter
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    // 3. Use service role client for credential retrieval
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 503 }
      );
    }

    // 4. Get config and verify organization ownership
    const { data: config, error } = await serviceSupabase
      .from('customer_configs')
      .select('woocommerce_consumer_key, woocommerce_consumer_secret, organization_id')
      .eq('domain', domain)
      .single();

    if (error || !config) {
      return NextResponse.json({
        success: false,
        error: 'Configuration not found',
      }, { status: 404 });
    }

    // 5. Verify user is member of the organization
    const { data: membership } = await serviceSupabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', config.organization_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({
        success: false,
        error: 'Access denied - you do not have permission to access this domain',
      }, { status: 403 });
    }

    // Decrypt credentials using explicit encryption check
    let consumerKey = '';
    let consumerSecret = '';

    try {
      if (config.woocommerce_consumer_key) {
        if (isEncrypted(config.woocommerce_consumer_key)) {
          consumerKey = decrypt(config.woocommerce_consumer_key);
        } else {
          logger.warn('Plaintext credential detected - migration needed', { domain });
          consumerKey = config.woocommerce_consumer_key;
        }
      }
      if (config.woocommerce_consumer_secret) {
        if (isEncrypted(config.woocommerce_consumer_secret)) {
          consumerSecret = decrypt(config.woocommerce_consumer_secret);
        } else {
          logger.warn('Plaintext credential detected - migration needed', { domain });
          consumerSecret = config.woocommerce_consumer_secret;
        }
      }
    } catch (error) {
      logger.error('Failed to process credentials', error, { domain });
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
    logger.error('Error fetching credentials', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch credentials' },
      { status: 500 }
    );
  }
}
