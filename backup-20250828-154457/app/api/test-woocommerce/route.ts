import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Thompson's E-Parts configuration
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();

    if (configError) {
      return NextResponse.json({ 
        error: 'Failed to fetch config', 
        details: configError 
      }, { status: 500 });
    }

    if (!config) {
      return NextResponse.json({ 
        error: 'Thompson\'s E-Parts not configured' 
      }, { status: 404 });
    }

    // Prepare WooCommerce API credentials
    const wooConfig = {
      url: config.woocommerce_url,
      consumerKey: config.woocommerce_consumer_key,
      consumerSecret: config.woocommerce_consumer_secret,
      version: 'wc/v3'
    };

    // Test API endpoints
    const tests = [];

    // Test 1: Fetch products
    try {
      const productsUrl = `${wooConfig.url}/wp-json/${wooConfig.version}/products?per_page=5`;
      const productsResponse = await fetch(productsUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64')
        }
      });

      if (productsResponse.ok) {
        const products = await productsResponse.json();
        tests.push({
          endpoint: 'products',
          status: 'success',
          count: products.length,
          sample: products.slice(0, 2).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            stock_status: p.stock_status
          }))
        });
      } else {
        tests.push({
          endpoint: 'products',
          status: 'failed',
          error: `HTTP ${productsResponse.status}: ${productsResponse.statusText}`
        });
      }
    } catch (error: any) {
      tests.push({
        endpoint: 'products',
        status: 'error',
        error: error.message
      });
    }

    // Test 2: Fetch categories
    try {
      const categoriesUrl = `${wooConfig.url}/wp-json/${wooConfig.version}/products/categories?per_page=5`;
      const categoriesResponse = await fetch(categoriesUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64')
        }
      });

      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        tests.push({
          endpoint: 'categories',
          status: 'success',
          count: categories.length,
          sample: categories.map((c: any) => ({
            id: c.id,
            name: c.name,
            count: c.count
          }))
        });
      } else {
        tests.push({
          endpoint: 'categories',
          status: 'failed',
          error: `HTTP ${categoriesResponse.status}: ${categoriesResponse.statusText}`
        });
      }
    } catch (error: any) {
      tests.push({
        endpoint: 'categories',
        status: 'error',
        error: error.message
      });
    }

    // Test 3: Fetch orders
    try {
      const ordersUrl = `${wooConfig.url}/wp-json/${wooConfig.version}/orders?per_page=3`;
      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${wooConfig.consumerKey}:${wooConfig.consumerSecret}`).toString('base64')
        }
      });

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        tests.push({
          endpoint: 'orders',
          status: 'success',
          count: orders.length,
          sample: orders.map((o: any) => ({
            id: o.id,
            status: o.status,
            total: o.total,
            date_created: o.date_created
          }))
        });
      } else {
        tests.push({
          endpoint: 'orders',
          status: 'failed',
          error: `HTTP ${ordersResponse.status}: ${ordersResponse.statusText}`
        });
      }
    } catch (error: any) {
      tests.push({
        endpoint: 'orders',
        status: 'error',
        error: error.message
      });
    }

    // Summary
    const successCount = tests.filter(t => t.status === 'success').length;
    const failedCount = tests.filter(t => t.status !== 'success').length;

    return NextResponse.json({
      configuration: {
        domain: config.domain,
        business_name: config.business_name,
        woocommerce_url: config.woocommerce_url,
        woocommerce_enabled: config.woocommerce_enabled
      },
      test_results: tests,
      summary: {
        total_tests: tests.length,
        successful: successCount,
        failed: failedCount,
        status: successCount === tests.length ? 'ALL PASSED' : failedCount === tests.length ? 'ALL FAILED' : 'PARTIAL SUCCESS'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message 
    }, { status: 500 });
  }
}