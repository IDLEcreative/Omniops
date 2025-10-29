/**
 * WooCommerce Health Check Functions
 * Individual health checks for monitoring dashboard
 */

import { createServiceRoleClient } from '../../supabase-server';
import { getDynamicWooCommerceClient } from '../../woocommerce-dynamic';
import { HealthStatus, measureResponseTime } from './types';

export async function checkDatabaseConnection(): Promise<HealthStatus> {
  try {
    const { result: supabase, duration } = await measureResponseTime(() =>
      createServiceRoleClient()
    );

    if (!supabase) {
      return {
        component: 'Database Connection',
        status: 'down',
        error: 'Supabase client creation failed'
      };
    }

    // Test query
    const { data, error } = await supabase
      .from('customer_configs')
      .select('count')
      .limit(1);

    if (error) {
      return {
        component: 'Database Connection',
        status: 'degraded',
        responseTime: duration,
        error: error.message
      };
    }

    return {
      component: 'Database Connection',
      status: 'healthy',
      responseTime: duration,
      details: 'Connection successful'
    };
  } catch (error) {
    return {
      component: 'Database Connection',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkWooCommerceCredentials(): Promise<HealthStatus> {
  const supabase = await createServiceRoleClient();
  if (!supabase) {
    return {
      component: 'WooCommerce Credentials',
      status: 'down',
      error: 'Database unavailable'
    };
  }

  try {
    const { data, error } = await supabase
      .from('customer_configs')
      .select('domain, woocommerce_url, woocommerce_consumer_key')
      .eq('domain', 'thompsonseparts.co.uk')
      .single();

    if (error) {
      return {
        component: 'WooCommerce Credentials',
        status: 'degraded',
        error: 'Credentials not found in database'
      };
    }

    const hasUrl = !!data.woocommerce_url;
    const hasKey = !!data.woocommerce_consumer_key;

    if (hasUrl && hasKey) {
      return {
        component: 'WooCommerce Credentials',
        status: 'healthy',
        details: 'Credentials encrypted and stored'
      };
    }

    return {
      component: 'WooCommerce Credentials',
      status: 'degraded',
      details: 'Partial credentials (using env vars)'
    };
  } catch (error) {
    return {
      component: 'WooCommerce Credentials',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkWooCommerceAPI(): Promise<HealthStatus> {
  try {
    const { result: wc, duration: clientDuration } = await measureResponseTime(() =>
      getDynamicWooCommerceClient('thompsonseparts.co.uk')
    );

    if (!wc) {
      return {
        component: 'WooCommerce API',
        status: 'down',
        error: 'Client initialization failed'
      };
    }

    // Test API call
    const { result: systemStatus, duration: apiDuration } = await measureResponseTime(
      () => wc.getSystemStatus()
    );

    const totalDuration = clientDuration + apiDuration;

    if (!systemStatus) {
      return {
        component: 'WooCommerce API',
        status: 'down',
        responseTime: totalDuration,
        error: 'System status fetch failed'
      };
    }

    // Check response time thresholds
    let status: 'healthy' | 'degraded' = 'healthy';
    let details = `WooCommerce ${systemStatus.environment?.version || 'Unknown'}`;

    if (totalDuration > 2000) {
      status = 'degraded';
      details += ` (slow response: ${totalDuration}ms)`;
    } else {
      details += ` (${totalDuration}ms)`;
    }

    return {
      component: 'WooCommerce API',
      status,
      responseTime: totalDuration,
      details
    };
  } catch (error) {
    return {
      component: 'WooCommerce API',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkProductSearch(): Promise<HealthStatus> {
  try {
    const wc = await getDynamicWooCommerceClient('thompsonseparts.co.uk');
    if (!wc) {
      return {
        component: 'Product Search',
        status: 'down',
        error: 'WooCommerce client unavailable'
      };
    }

    const { result: products, duration } = await measureResponseTime(() =>
      wc.getProducts({ per_page: 5 })
    );

    if (!products || products.length === 0) {
      return {
        component: 'Product Search',
        status: 'degraded',
        responseTime: duration,
        details: 'No products found'
      };
    }

    return {
      component: 'Product Search',
      status: 'healthy',
      responseTime: duration,
      details: `${products.length} products retrieved`
    };
  } catch (error) {
    return {
      component: 'Product Search',
      status: 'down',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkChatEndpoint(): Promise<HealthStatus> {
  try {
    const { result: response, duration } = await measureResponseTime(() =>
      fetch('http://localhost:3000/api/woocommerce/test')
    );

    if (!response.ok) {
      return {
        component: 'Chat Endpoint',
        status: 'degraded',
        responseTime: duration,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    if (data.success) {
      return {
        component: 'Chat Endpoint',
        status: 'healthy',
        responseTime: duration,
        details: `${data.summary.passed}/${data.summary.totalTests} tests passed`
      };
    }

    return {
      component: 'Chat Endpoint',
      status: 'degraded',
      responseTime: duration,
      details: `${data.summary.failed} tests failed`
    };
  } catch (error) {
    return {
      component: 'Chat Endpoint',
      status: 'down',
      error: error instanceof Error ? error.message : 'Server not responding'
    };
  }
}
