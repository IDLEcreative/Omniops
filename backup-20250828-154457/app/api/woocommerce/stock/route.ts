import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Request validation
const StockRequestSchema = z.object({
  domain: z.string(),
  sku: z.string().optional(),
  productId: z.number().optional(),
  productName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, sku, productId, productName } = StockRequestSchema.parse(body);

    // Get WooCommerce configuration for this domain
    const supabase = await createServiceRoleClient();
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

    // Get stock level based on provided identifier
    let stockInfo;
    
    if (productId) {
      // Get by product ID
      const product = await wc.getProduct(productId);
      stockInfo = {
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity,
        in_stock: product.stock_status === 'instock',
        managing_stock: product.manage_stock,
        backorders: product.backorders,
      };
    } else if (sku) {
      // Search by SKU
      const products = await wc.getProducts({ sku });
      if (products.length > 0) {
        const product = products[0]!;
        stockInfo = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock_status: product.stock_status,
          stock_quantity: product.stock_quantity,
          in_stock: product.stock_status === 'instock',
          managing_stock: product.manage_stock,
          backorders: product.backorders,
        };
      }
    } else if (productName) {
      // Search by product name
      const products = await wc.getProducts({ search: productName, per_page: 1 });
      if (products.length > 0) {
        const product = products[0]!;
        stockInfo = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          stock_status: product.stock_status,
          stock_quantity: product.stock_quantity,
          in_stock: product.stock_status === 'instock',
          managing_stock: product.manage_stock,
          backorders: product.backorders,
        };
      }
    } else {
      return NextResponse.json(
        { error: 'Please provide productId, sku, or productName' },
        { status: 400 }
      );
    }

    if (!stockInfo) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Return stock information
    return NextResponse.json({
      success: true,
      stock: stockInfo,
      message: stockInfo.stock_quantity !== null 
        ? `${stockInfo.name}: ${stockInfo.stock_quantity} units in stock`
        : `${stockInfo.name} is ${stockInfo.stock_status}`,
    });

  } catch (error: any) {
    console.error('Stock check error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to check stock levels', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint for simple stock check
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get('domain');
  const sku = searchParams.get('sku');
  
  if (!domain || !sku) {
    return NextResponse.json(
      { error: 'Domain and SKU are required' },
      { status: 400 }
    );
  }

  // Reuse POST logic
  return POST(new NextRequest(request.url, {
    method: 'POST',
    body: JSON.stringify({ domain, sku }),
  }));
}