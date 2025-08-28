import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';

export async function GET(request: NextRequest) {
  try {
    const url = process.env.WOOCOMMERCE_URL;
    const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!url || !consumerKey || !consumerSecret) {
      return NextResponse.json({
        success: false,
        error: 'WooCommerce credentials not configured'
      }, { status: 500 });
    }

    const wc = new WooCommerceAPI({
      url,
      consumerKey,
      consumerSecret,
    });

    console.log('Testing cart-related endpoints...');
    
    const results = {
      cartEndpoints: {} as any,
      pendingOrders: null as any,
      abandonedCarts: null as any,
      sessions: null as any,
      errors: [] as string[]
    };

    // Test 1: Try to access cart endpoint directly (likely won't work with REST API v3)
    try {
      const cartData = await wc.get('cart');
      results.cartEndpoints = {
        success: true,
        data: cartData
      };
    } catch (error: any) {
      results.cartEndpoints = {
        success: false,
        message: 'Cart endpoint not available in WooCommerce REST API v3',
        error: error.response?.data?.message || error.message
      };
      results.errors.push('Direct cart access not available');
    }

    // Test 2: Try CoCart API endpoint (if CoCart plugin is installed)
    try {
      const cocartData = await wc.get('cocart/v2/cart');
      results.cartEndpoints = {
        success: true,
        type: 'CoCart API',
        data: cocartData
      };
    } catch (error: any) {
      // CoCart not installed, this is expected
    }

    // Test 3: Get pending/draft orders (these might represent abandoned carts)
    try {
      const pendingOrders = await wc.getOrders({
        status: 'pending' as any,
        per_page: 5,
        orderby: 'date',
        order: 'desc'
      });
      
      results.pendingOrders = {
        success: true,
        count: pendingOrders.length,
        orders: pendingOrders.map((order: any) => ({
          id: order.id,
          status: order.status,
          customer: order.billing?.email || 'guest',
          total: order.total,
          currency: order.currency,
          dateCreated: order.date_created,
          items: order.line_items?.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            total: item.total
          }))
        }))
      };
    } catch (error: any) {
      results.pendingOrders = {
        success: false,
        error: error.message
      };
      results.errors.push('Failed to fetch pending orders');
    }

    // Test 4: Try to get session data (usually requires additional plugins)
    try {
      const sessions = await wc.get('sessions');
      results.sessions = {
        success: true,
        data: sessions
      };
    } catch (error: any) {
      results.sessions = {
        success: false,
        message: 'Session data not accessible via standard REST API',
        note: 'Session/cart data typically requires additional plugins or custom endpoints'
      };
    }

    // Alternative cart access methods information
    const alternativeMethods = {
      methods: [
        {
          name: 'CoCart Plugin',
          description: 'Provides REST API access to WooCommerce carts',
          url: 'https://cocart.xyz/',
          endpoints: ['/wp-json/cocart/v2/cart', '/wp-json/cocart/v2/cart/items']
        },
        {
          name: 'WooCommerce Store API',
          description: 'Newer API that includes cart endpoints (WooCommerce 4.4+)',
          url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/#store-api',
          endpoints: ['/wp-json/wc/store/v1/cart', '/wp-json/wc/store/v1/cart/items']
        },
        {
          name: 'Custom Endpoint',
          description: 'Create a custom WordPress REST endpoint to expose cart data',
          requirement: 'Requires custom plugin development'
        },
        {
          name: 'Pending Orders',
          description: 'Use pending/on-hold orders as a proxy for abandoned carts',
          available: true
        }
      ]
    };

    // Test Store API endpoints (WooCommerce 4.4+)
    try {
      // Note: Store API uses different authentication
      const response = await fetch(`${url}/wp-json/wc/store/v1/cart`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const storeApiCart = await response.json();
        results.cartEndpoints = {
          success: true,
          type: 'WooCommerce Store API',
          message: 'Store API cart endpoint exists but requires frontend session',
          endpoint: '/wp-json/wc/store/v1/cart',
          note: 'This endpoint is designed for frontend use with session cookies'
        };
      }
    } catch (error) {
      // Store API might not be available
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        directCartAccess: false,
        pendingOrdersAvailable: results.pendingOrders?.success || false,
        recommendation: 'Use pending/on-hold orders to track abandoned carts, or install CoCart plugin for full cart API access'
      },
      results,
      alternativeMethods,
      notes: [
        'WooCommerce REST API v3 does not provide direct cart access',
        'Cart data is session-based and tied to browser cookies',
        'For backend cart access, consider using CoCart plugin or Store API',
        'Pending orders can serve as a proxy for abandoned cart tracking'
      ]
    });
    
  } catch (error: any) {
    console.error('Cart test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test cart endpoints',
      details: error.response?.data || error.stack
    }, { status: 500 });
  }
}