import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { createServiceRoleClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain') || process.env.TEST_DOMAIN || 'example.com';

  
  // First check if config exists
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database connection unavailable' },
      { status: 503 }
    );
  }
  
  const { data: checkConfig, error: checkError } = await supabase
    .from('customer_configs')
    .select('*')
    .eq('domain', domain)
    .single();
    
  console.log('📊 Config check:', { 
    found: !!checkConfig, 
    error: checkError?.message,
    wooEnabled: checkConfig?.woocommerce_enabled,
    hasUrl: !!checkConfig?.woocommerce_url,
    hasKey: !!checkConfig?.woocommerce_consumer_key,
    hasSecret: !!checkConfig?.woocommerce_consumer_secret
  });
  
  try {
    const client = await getDynamicWooCommerceClient(domain);
    
    if (!client) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce not configured for this domain',
        domain
      });
    }
    
    
    // Try to fetch products
    const products = await client.getProducts({
      per_page: 3,
      status: 'publish'
    });
    
    console.log('📦 Products fetched:', Array.isArray(products) ? products.length : 0);
    
    return NextResponse.json({
      success: true,
      domain,
      products: Array.isArray(products) ? products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        sku: p.sku
      })) : [],
      count: Array.isArray(products) ? products.length : 0
    });
    
  } catch (error) {
    console.error('❌ WooCommerce test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      domain
    });
  }
}
