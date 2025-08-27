import { NextRequest, NextResponse } from 'next/server';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('domain') || 'thompsonseparts.co.uk';
  
  console.log('🧪 Testing WooCommerce connection for domain:', domain);
  
  // First check if config exists
  const supabase = await createServiceRoleClient();
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
    
    console.log('✅ WooCommerce client created successfully');
    
    // Try to fetch products
    const products = await client.get('products', {
      per_page: 3,
      status: 'publish'
    });
    
    console.log('📦 Products fetched:', products.length);
    
    return NextResponse.json({
      success: true,
      domain,
      products: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        sku: p.sku
      })),
      count: products.length
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