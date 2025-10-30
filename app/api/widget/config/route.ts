/**
 * Public Widget Configuration API
 *
 * Returns public-safe configuration for the chat widget.
 * NO authentication required - this is a public endpoint.
 * NO credentials exposed - only feature flags and branding.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  domain: z.string().min(1, 'Domain is required'),
});

export async function GET(request: NextRequest) {
  try {
    // Parse and validate domain parameter
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    const validatedQuery = QuerySchema.parse({ domain });

    // Create Supabase client (no auth required for this endpoint)
    const supabase = await createServiceRoleClient();

    // Fetch customer config for this domain
    // Only select PUBLIC-SAFE fields - NO credentials!
    const { data: config, error } = await supabase
      .from('customer_configs')
      .select(`
        domain,
        business_name,
        primary_color,
        welcome_message,
        suggested_questions,
        woocommerce_url,
        shopify_shop,
        active
      `)
      .eq('domain', validatedQuery.domain)
      .eq('active', true)
      .single();

    if (error || !config) {
      // Log error for debugging
      console.error('[Widget Config API] Query error:', { error, domain: validatedQuery.domain });

      // Domain not found or not configured
      return NextResponse.json(
        {
          success: false,
          config: {
            domain: validatedQuery.domain,
            woocommerce_enabled: false,
            shopify_enabled: false,
            branding: null,
          },
        },
        { status: 200 } // Return 200 with default config, not 404
      );
    }

    // Return public-safe configuration
    return NextResponse.json({
      success: true,
      config: {
        domain: config.domain,
        woocommerce_enabled: !!config.woocommerce_url,
        shopify_enabled: !!config.shopify_shop,
        branding: {
          business_name: config.business_name,
          primary_color: config.primary_color,
          welcome_message: config.welcome_message,
          suggested_questions: config.suggested_questions || [],
        },
      },
    });

  } catch (error) {
    console.error('[Widget Config API] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid domain parameter',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch widget configuration',
      },
      { status: 500 }
    );
  }
}
