import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import {
  encryptWooCommerceConfig,
  decryptWooCommerceConfig,
  encryptShopifyConfig,
  decryptShopifyConfig,
  encryptCredentials,
  tryDecryptCredentials
} from '@/lib/encryption';
import type { EncryptedCredentials } from '@/types/encrypted-credentials';

// Configuration schema
const ConfigSchema = z.object({
  domain: z.string().min(1),
  owned_domains: z.array(z.string()).default([]),
  woocommerce: z.object({
    enabled: z.boolean(),
    url: z.string().optional(),
    consumer_key: z.string().optional(),
    consumer_secret: z.string().optional(),
  }),
  shopify: z.object({
    enabled: z.boolean(),
    domain: z.string().optional(),
    access_token: z.string().optional(),
  }),
});

// GET - Retrieve configuration
export async function GET() {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize Supabase client' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, organizations(id, name)')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ config: null });
    }

    const { data, error } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    if (!data) {
      return NextResponse.json({ config: null });
    }

    // NEW: Try encrypted_credentials first, fall back to individual columns
    let woocommerceConfig;
    let shopifyConfig;

    if (data.encrypted_credentials) {
      // NEW FORMAT: Use consolidated encrypted credentials
      const credentials = tryDecryptCredentials(data.encrypted_credentials);

      woocommerceConfig = {
        enabled: data.woocommerce_enabled || false,
        url: credentials.woocommerce?.store_url || '',
        consumer_key: credentials.woocommerce?.consumer_key || '',
        consumer_secret: credentials.woocommerce?.consumer_secret || '',
      };

      shopifyConfig = {
        enabled: data.shopify_enabled || false,
        domain: credentials.shopify?.store_url || '',
        access_token: credentials.shopify?.access_token || '',
      };
    } else {
      // LEGACY FORMAT: Fall back to individual encrypted columns
      woocommerceConfig = decryptWooCommerceConfig({
        enabled: data.woocommerce_enabled || false,
        url: data.woocommerce_url || '',
        consumer_key: data.woocommerce_consumer_key || '',
        consumer_secret: data.woocommerce_consumer_secret || '',
      });

      shopifyConfig = decryptShopifyConfig({
        enabled: data.shopify_enabled || false,
        domain: data.shopify_domain || '',
        access_token: data.shopify_access_token || '',
      });
    }

    const config = {
      domain: data.domain,
      owned_domains: data.owned_domains || [],
      woocommerce: woocommerceConfig,
      shopify: shopifyConfig,
    };

    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    );
  }
}

// POST - Save configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ConfigSchema.parse(body);

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Failed to initialize Supabase client' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to update config (owner or admin)
    if (!['owner', 'admin'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only owners and admins can update configuration.' },
        { status: 403 }
      );
    }

    // Use service role client for inserts
    const serviceSupabase = await createServiceRoleClient();

    if (!serviceSupabase) {
      return NextResponse.json(
        { error: 'Failed to initialize service role client' },
        { status: 500 }
      );
    }

    // NEW: Build consolidated credential object
    const credentials: EncryptedCredentials = {};

    if (validatedData.woocommerce.enabled && validatedData.woocommerce.consumer_key) {
      credentials.woocommerce = {
        consumer_key: validatedData.woocommerce.consumer_key,
        consumer_secret: validatedData.woocommerce.consumer_secret || '',
        store_url: validatedData.woocommerce.url || '',
      };
    }

    if (validatedData.shopify.enabled && validatedData.shopify.access_token) {
      credentials.shopify = {
        access_token: validatedData.shopify.access_token,
        store_url: validatedData.shopify.domain || '',
      };
    }

    // Encrypt the consolidated credentials
    const encryptedCredentialsJson = Object.keys(credentials).length > 0
      ? encryptCredentials(credentials)
      : null;

    // LEGACY: Also encrypt individual fields for backward compatibility
    const encryptedWooCommerce = encryptWooCommerceConfig(validatedData.woocommerce);
    const encryptedShopify = encryptShopifyConfig(validatedData.shopify);

    // Prepare data for database (writes to BOTH new and legacy formats)
    const dbData = {
      organization_id: membership.organization_id,
      domain: validatedData.domain,
      owned_domains: validatedData.owned_domains,

      // NEW FORMAT: Consolidated encrypted credentials
      encrypted_credentials: encryptedCredentialsJson,

      // LEGACY FORMAT: Individual columns (for backward compatibility during migration)
      woocommerce_enabled: encryptedWooCommerce.enabled,
      woocommerce_url: encryptedWooCommerce.url,
      woocommerce_consumer_key: encryptedWooCommerce.consumer_key,
      woocommerce_consumer_secret: encryptedWooCommerce.consumer_secret,
      shopify_enabled: encryptedShopify.enabled,
      shopify_domain: encryptedShopify.domain,
      shopify_access_token: encryptedShopify.access_token,

      updated_at: new Date().toISOString(),
    };

    const { data, error } = await serviceSupabase
      .from('customer_configs')
      .upsert(dbData, {
        onConflict: 'organization_id',
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error saving config:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid configuration data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
