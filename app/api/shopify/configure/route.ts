/**
 * Shopify Configuration API Endpoint
 * Handles saving and updating Shopify credentials
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { shop, accessToken, domain } = body;

    // Validate required fields
    if (!shop || !accessToken) {
      return NextResponse.json(
        { success: false, error: 'Shop domain and access token are required' },
        { status: 400 }
      );
    }

    // Validate shop domain format
    if (!shop.includes('.myshopify.com')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shop domain must be in format: store-name.myshopify.com',
        },
        { status: 400 }
      );
    }

    // Validate access token format (should start with shpat_)
    if (!accessToken.startsWith('shpat_')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access token should start with "shpat_"',
        },
        { status: 400 }
      );
    }

    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Encrypt the access token
    const encryptedToken = encrypt(accessToken);

    // Get the domain from request (or use provided domain)
    const customerDomain = domain || request.headers.get('host') || 'localhost';

    // Check if configuration exists
    const { data: existing } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', customerDomain)
      .single();

    if (existing) {
      // Update existing configuration
      const { error: updateError } = await supabase
        .from('customer_configs')
        .update({
          shopify_shop: shop,
          shopify_access_token: encryptedToken,
          updated_at: new Date().toISOString(),
        })
        .eq('domain', customerDomain);

      if (updateError) {
        console.error('Failed to update Shopify config:', updateError);
        return NextResponse.json(
          { success: false, error: 'Failed to update configuration' },
          { status: 500 }
        );
      }
    } else {
      // Create new configuration
      const { error: insertError } = await supabase
        .from('customer_configs')
        .insert({
          domain: customerDomain,
          shopify_shop: shop,
          shopify_access_token: encryptedToken,
        });

      if (insertError) {
        console.error('Failed to create Shopify config:', insertError);
        return NextResponse.json(
          { success: false, error: 'Failed to save configuration' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shopify configuration saved successfully',
    });
  } catch (error: any) {
    console.error('[Shopify Configure API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to save configuration',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain') || request.headers.get('host') || 'localhost';

    const supabase = await createServiceRoleClient();

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Fetch existing configuration (without exposing the token)
    const { data: config, error } = await supabase
      .from('customer_configs')
      .select('shopify_shop')
      .eq('domain', domain)
      .single();

    if (error || !config) {
      return NextResponse.json({
        success: true,
        configured: false,
        shop: null,
      });
    }

    return NextResponse.json({
      success: true,
      configured: true,
      shop: config.shopify_shop,
    });
  } catch (error: any) {
    console.error('[Shopify Configure API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch configuration',
      },
      { status: 500 }
    );
  }
}
