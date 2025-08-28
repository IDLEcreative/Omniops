import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { 
  encryptWooCommerceConfig, 
  decryptWooCommerceConfig, 
  encryptShopifyConfig, 
  decryptShopifyConfig 
} from '@/lib/encryption';

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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, domain')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ config: null });
    }
    
    const { data, error } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('customer_id', customer.id)
      .single();

    if (error && error.code !== 'PGRST116') { // Not found error
      throw error;
    }

    if (!data) {
      return NextResponse.json({ config: null });
    }

    // Decrypt sensitive fields before sending to client
    const config = {
      domain: data.domain,
      owned_domains: data.owned_domains || [],
      woocommerce: decryptWooCommerceConfig({
        enabled: data.woocommerce_enabled || false,
        url: data.woocommerce_url || '',
        consumer_key: data.woocommerce_consumer_key || '',
        consumer_secret: data.woocommerce_consumer_secret || '',
      }),
      shopify: decryptShopifyConfig({
        enabled: data.shopify_enabled || false,
        domain: data.shopify_domain || '',
        access_token: data.shopify_access_token || '',
      }),
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
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get customer data
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Use service role client for inserts
    const serviceSupabase = await createServiceRoleClient();
    
    // Encrypt sensitive fields before storage
    const encryptedWooCommerce = encryptWooCommerceConfig(validatedData.woocommerce);
    const encryptedShopify = encryptShopifyConfig(validatedData.shopify);
    
    // Prepare data for database
    const dbData = {
      customer_id: customer.id,
      domain: validatedData.domain,
      owned_domains: validatedData.owned_domains,
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
        onConflict: 'customer_id',
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