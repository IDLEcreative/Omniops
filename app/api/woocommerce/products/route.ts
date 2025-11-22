import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createServiceRoleClient } from '@/lib/supabase-server';
import { z } from 'zod';
import { structuredLogger } from '@/lib/monitoring/logger';
import { captureError } from '@/lib/monitoring/sentry';

// Request validation
const ProductsRequestSchema = z.object({
  domain: z.string(),
  per_page: z.number().min(1).max(100).default(10),
  page: z.number().min(1).default(1),
  search: z.string().optional(),
  category: z.number().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']).optional(),
  featured: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, per_page, page, search, category, stock_status, featured } = 
      ProductsRequestSchema.parse(body);

    // Get WooCommerce configuration for this domain
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection unavailable' },
        { status: 503 }
      );
    }
    
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
      .eq('domain', domain)
      .single();

    if (configError || !config?.woocommerce_url) {
      return NextResponse.json(
        { error: 'WooCommerce not configured for this domain' },
        { status: 404 }
      );
    }

    // Import WooCommerce API
    const { WooCommerceAPI } = await import('@/lib/woocommerce-api');
    const wc = new WooCommerceAPI({
      url: config.woocommerce_url,
      consumerKey: config.woocommerce_consumer_key,
      consumerSecret: config.woocommerce_consumer_secret,
    });

    // Build query parameters
    const queryParams: any = {
      per_page,
      page,
    };

    if (search) queryParams.search = search;
    if (category) queryParams.category = category;
    if (stock_status) queryParams.stock_status = stock_status;
    if (featured !== undefined) queryParams.featured = featured;

    // Fetch products
    const products = await wc.getProducts(queryParams);

    // Transform products to include key information (with null safety)
    const transformedProducts = (products || []).map((product: any) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      regular_price: product.regular_price,
      sale_price: product.sale_price,
      stock_status: product.stock_status,
      stock_quantity: product.stock_quantity,
      manage_stock: product.manage_stock,
      in_stock: product.stock_status === 'instock',
      categories: product.categories?.map((cat: any) => cat.name) || [],
      short_description: product.short_description,
      featured: product.featured,
      images: product.images?.slice(0, 1).map((img: any) => ({
        src: img.src,
        alt: img.alt || product.name,
      })) || [],
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      pagination: {
        page,
        per_page,
        total: products.length,
      },
    });

  } catch (error: any) {
    structuredLogger.error('Products fetch error', {
      error: error?.message || String(error)
    }, error instanceof Error ? error : undefined);
    captureError(error, {
      operation: 'woocommerce-products',
      endpoint: '/api/woocommerce/products'
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch products', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for simple product listing
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'domain parameter is required for security and multi-tenant isolation' },
      { status: 400 }
    );
  }

  const per_page = parseInt(searchParams.get('per_page') || '10');
  const stock_status = searchParams.get('stock_status') as any;

  // For the test page, fetch in-stock products by default
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({
      domain,
      per_page,
      stock_status: stock_status || 'instock',
    }),
  }));
}