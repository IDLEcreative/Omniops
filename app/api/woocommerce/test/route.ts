import { NextRequest, NextResponse } from 'next/server';
import { WooCommerceAPI } from '@/lib/woocommerce-api';

export async function GET(request: NextRequest) {
  try {
    // Get test mode from query params
    const searchParams = request.nextUrl.searchParams;
    const testMode = searchParams.get('mode') || 'env'; // 'env' or 'dynamic'
    const domain = searchParams.get('domain');
    
    if (testMode === 'dynamic' && !domain) {
      return NextResponse.json(
        { error: 'Domain parameter required for dynamic mode' },
        { status: 400 }
      );
    }

    let wc: WooCommerceAPI;
    let configSource: string;
    let storeUrl: string;

    if (testMode === 'dynamic' && domain) {
      // Test dynamic configuration from database
      const { getDynamicWooCommerceClient } = await import('@/lib/woocommerce-dynamic');
      const client = await getDynamicWooCommerceClient(domain);
      
      if (!client) {
        return NextResponse.json({
          success: false,
          error: 'WooCommerce not enabled or configured for this domain',
          domain,
        }, { status: 404 });
      }
      
      wc = client;
      configSource = `Dynamic configuration for domain: ${domain}`;
      storeUrl = 'configured via database';
    } else {
      // Test environment variable configuration
      const url = process.env.WOOCOMMERCE_URL || '';
      const consumerKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
      const consumerSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

      if (!url || !consumerKey || !consumerSecret) {
        return NextResponse.json({
          success: false,
          error: 'WooCommerce environment variables not configured',
          configured: {
            url: !!url,
            consumerKey: !!consumerKey,
            consumerSecret: !!consumerSecret,
          }
        }, { status: 500 });
      }

      // Check if URL is a placeholder
      if (url === 'https://your-woocommerce-site.com' || url.includes('your-woocommerce-site')) {
        return NextResponse.json({
          success: false,
          error: 'WooCommerce URL is still a placeholder. Please update WOOCOMMERCE_URL in your .env.local file with your actual WooCommerce store URL.',
          currentUrl: url,
          instructions: [
            '1. Edit your .env.local file',
            '2. Replace WOOCOMMERCE_URL with your actual WooCommerce store URL',
            '3. Ensure your WooCommerce REST API is enabled',
            '4. Generate API keys from WooCommerce > Settings > Advanced > REST API',
            '5. Update WOOCOMMERCE_CONSUMER_KEY and WOOCOMMERCE_CONSUMER_SECRET',
          ]
        }, { status: 400 });
      }

      wc = new WooCommerceAPI({
        url,
        consumerKey,
        consumerSecret,
      });
      configSource = 'Environment variables';
      storeUrl = url;
    }

    // Helper function to add timeout to promises
    const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) => 
          setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };

    // Test the connection by fetching store info and products
    const tests = {
      storeInfo: null as any,
      products: null as any,
      categories: null as any,
      errors: [] as string[],
    };

    const TIMEOUT_MS = 5000; // 5 second timeout for each test

    // Test 1: Get system status (store info)
    try {
      const systemStatus = await withTimeout(
        wc.getSystemStatus(),
        TIMEOUT_MS,
        'System status fetch'
      );
      tests.storeInfo = {
        success: true,
        environment: {
          home_url: systemStatus.environment?.home_url,
          site_url: systemStatus.environment?.site_url,
          wc_version: systemStatus.environment?.version,
        },
        settings: {
          currency: systemStatus.settings?.currency,
          currency_symbol: systemStatus.settings?.currency_symbol,
          thousand_separator: systemStatus.settings?.thousand_separator,
          decimal_separator: systemStatus.settings?.decimal_separator,
        },
      };
    } catch (error: any) {
      tests.storeInfo = {
        success: false,
        error: error.message || 'Failed to fetch store info',
      };
      tests.errors.push(`Store info: ${error.message}`);
    }

    // Test 2: Get products
    try {
      const products = await withTimeout(
        wc.getProducts({ per_page: 5 }),
        TIMEOUT_MS,
        'Products fetch'
      );
      tests.products = {
        success: true,
        count: products.length,
        sample: products.slice(0, 2).map((p: any) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          stock_status: p.stock_status,
        })),
      };
    } catch (error: any) {
      tests.products = {
        success: false,
        error: error.message || 'Failed to fetch products',
      };
      tests.errors.push(`Products: ${error.message}`);
    }

    // Test 3: Get categories
    try {
      const categories = await withTimeout(
        wc.get('products/categories', { per_page: 5 }),
        TIMEOUT_MS,
        'Categories fetch'
      );
      tests.categories = {
        success: true,
        count: categories.length,
        sample: categories.slice(0, 3).map((c: any) => ({
          id: c.id,
          name: c.name,
          count: c.count,
        })),
      };
    } catch (error: any) {
      tests.categories = {
        success: false,
        error: error.message || 'Failed to fetch categories',
      };
      tests.errors.push(`Categories: ${error.message}`);
    }

    // Test 4: Search products
    let searchTest = null;
    try {
      const searchResults = await withTimeout(
        wc.getProducts({ 
          search: 'test',
          per_page: 3 
        }),
        TIMEOUT_MS,
        'Product search'
      );
      searchTest = {
        success: true,
        query: 'test',
        resultCount: searchResults.length,
        results: searchResults.map((p: any) => p.name),
      };
    } catch (error: any) {
      searchTest = {
        success: false,
        error: error.message || 'Failed to search products',
      };
      tests.errors.push(`Search: ${error.message}`);
    }

    // Determine overall success
    const overallSuccess = tests.errors.length === 0;

    return NextResponse.json({
      success: overallSuccess,
      configSource,
      timestamp: new Date().toISOString(),
      tests: {
        ...tests,
        search: searchTest,
      },
      summary: {
        totalTests: 4,
        passed: 4 - tests.errors.length,
        failed: tests.errors.length,
      },
    }, { status: overallSuccess ? 200 : 207 });

  } catch (error: any) {
    console.error('WooCommerce test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error',
      details: error.stack,
    }, { status: 500 });
  }
}