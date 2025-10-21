/**
 * Shopify Products API Endpoint
 * Provides product search and retrieval from Shopify stores
 */

import { NextResponse } from 'next/server';
import { getDynamicShopifyClient } from '@/lib/shopify-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');
  const query = searchParams.get('query') || searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const productId = searchParams.get('id');

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
        { error: 'Shopify is not configured for this domain' },
        { status: 404 }
      );
    }

    // Get specific product by ID
    if (productId) {
      const numericId = parseInt(productId, 10);
      if (isNaN(numericId)) {
        return NextResponse.json(
          { error: 'Invalid product ID' },
          { status: 400 }
        );
      }

      const product = await shopify.getProduct(numericId);
      return NextResponse.json({ product });
    }

    // Search products
    if (query) {
      const products = await shopify.searchProducts(query, limit);
      return NextResponse.json({ products, count: products.length });
    }

    // Get all products (with limit)
    const products = await shopify.getProducts({ limit });
    return NextResponse.json({ products, count: products.length });

  } catch (error: any) {
    console.error('[Shopify Products API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
