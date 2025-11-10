/**
 * Abandoned Carts API
 *
 * Retrieves abandoned carts for recovery campaigns.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAbandonedCarts } from '@/lib/cart-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    const includeRecovered = searchParams.get('includeRecovered') === 'true';

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain parameter is required' },
        { status: 400 }
      );
    }

    const abandonedCarts = await getAbandonedCarts(domain, includeRecovered);

    return NextResponse.json({
      success: true,
      data: abandonedCarts,
      count: abandonedCarts.length
    });
  } catch (error) {
    console.error('[Abandoned Carts API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch abandoned carts',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
