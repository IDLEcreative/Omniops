/**
 * Shopify Integration Test Endpoint
 * Tests Shopify API connection and credentials
 *
 * SECURITY: Protected by middleware in production
 */

import { NextResponse } from 'next/server';
import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';

export async function GET(request: Request) {
  // Additional layer of protection (middleware is primary)
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  }

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    );
  }

  try {
    const shopify = await getDynamicShopifyClient(domain);

    if (!shopify) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shopify is not configured for this domain',
          configured: false,
        },
        { status: 404 }
      );
    }

    // Test the connection by fetching shop info (via products endpoint)
    try {
      const products = await shopify.getProducts({ limit: 1 });

      return NextResponse.json({
        success: true,
        message: 'Shopify connection successful',
        configured: true,
        productCount: products.length,
        testProduct: products[0] ? {
          id: products[0].id,
          title: products[0].title,
          vendor: products[0].vendor,
        } : null,
      });
    } catch (apiError: any) {
      console.error('[Shopify Test] API connection failed:', apiError);
      return NextResponse.json(
        {
          success: false,
          configured: true,
          error: 'Shopify API connection failed',
          details: apiError.message,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('[Shopify Test] Client initialization failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to initialize Shopify client',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
