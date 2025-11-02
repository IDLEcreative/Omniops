/**
 * WooCommerce Health Check API
 * Verifies WooCommerce integration status and connectivity
 */

import { createClient } from '@/lib/supabase/server';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/woocommerce/health
 * Check WooCommerce integration health
 *
 * Query Parameters:
 * - domain: Domain to check (optional, checks all if not provided)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get customer configs with WooCommerce enabled
    let query = supabase
      .from('customer_configs')
      .select('id, domain, woocommerce_url, created_at')
      .not('woocommerce_url', 'is', null);

    if (domain) {
      query = query.eq('domain', domain);
    }

    const { data: configs, error: configError } = await query;

    if (configError) {
      console.error('[Health Check] Config query error:', configError);
      return NextResponse.json(
        { error: 'Failed to fetch configurations' },
        { status: 500 }
      );
    }

    if (!configs || configs.length === 0) {
      return NextResponse.json({
        success: false,
        message: domain
          ? `WooCommerce not configured for domain: ${domain}`
          : 'No WooCommerce configurations found',
        data: {
          configured_domains: [],
          health_checks: []
        }
      });
    }

    // Perform health checks for each domain
    const healthChecks = await Promise.all(
      configs.map(async (config) => {
        const startTime = Date.now();

        try {
          // Test WooCommerce connection
          const wc = await getDynamicWooCommerceClient(config.domain);

          if (!wc) {
            return {
              domain: config.domain,
              status: 'error',
              message: 'Failed to initialize WooCommerce client',
              response_time_ms: Date.now() - startTime
            };
          }

          // Test API connectivity with a simple request
          await wc.get('system_status');

          return {
            domain: config.domain,
            status: 'healthy',
            message: 'WooCommerce API responding',
            response_time_ms: Date.now() - startTime,
            woocommerce_url: config.woocommerce_url
          };
        } catch (error: any) {
          return {
            domain: config.domain,
            status: 'error',
            message: error.message || 'Connection failed',
            response_time_ms: Date.now() - startTime,
            error_type: error.constructor.name
          };
        }
      })
    );

    // Calculate overall health status
    const healthyCount = healthChecks.filter(h => h.status === 'healthy').length;
    const totalCount = healthChecks.length;
    const overallStatus = healthyCount === totalCount ? 'healthy' :
                          healthyCount === 0 ? 'critical' : 'degraded';

    return NextResponse.json({
      success: true,
      data: {
        overall_status: overallStatus,
        healthy_domains: healthyCount,
        total_domains: totalCount,
        health_checks: healthChecks
      }
    });
  } catch (error) {
    console.error('[Health Check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
