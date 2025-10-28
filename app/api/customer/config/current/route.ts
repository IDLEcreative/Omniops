/**
 * Current User Customer Configuration API
 *
 * Automatically fetches the customer config for the authenticated user's organization
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/config/current
 * Get customer configuration for the current authenticated user's organization
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     domain: string,
 *     business_name: string,
 *     business_description: string,
 *     primary_color: string,
 *     welcome_message: string,
 *     suggested_questions: array,
 *     woocommerce_url: string,
 *     shopify_shop: string,
 *     organization_id: string,
 *     ...other fields
 *   }
 * }
 */
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();

    if (!supabase) {
      logger.error('Failed to initialize Supabase client');
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      logger.warn('User has no organization', { userId: user.id, error: membershipError });
      return NextResponse.json({
        success: false,
        error: 'No organization found for user',
      }, { status: 404 });
    }

    // Get customer config for the organization
    const { data: customerConfig, error: configError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .eq('active', true)
      .single();

    if (configError || !customerConfig) {
      logger.warn('No customer config found for organization', {
        organizationId: membership.organization_id,
        error: configError
      });

      return NextResponse.json({
        success: false,
        error: 'No customer configuration found',
        message: 'Please configure your domain in settings first'
      }, { status: 404 });
    }

    // Return the config (excluding sensitive fields)
    const {
      woocommerce_consumer_key,
      woocommerce_consumer_secret,
      encrypted_credentials,
      shopify_access_token,
      ...safeConfig
    } = customerConfig;

    return NextResponse.json({
      success: true,
      data: safeConfig
    });

  } catch (error) {
    logger.error('GET /api/customer/config/current error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
