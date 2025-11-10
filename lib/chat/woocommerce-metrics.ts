/**
 * WooCommerce Operation Metrics Tracking
 *
 * Non-invasive tracking that doesn't break operations if it fails
 */

import { createServiceRoleClient } from '@/lib/supabase/server';

interface OperationMetrics {
  operation: string;
  duration_ms: number;
  success: boolean;
  error_type?: string;
  error_message?: string;
  domain: string;
  customer_config_id?: string;
}

/**
 * Track WooCommerce operation metrics
 * Silent fail - metrics tracking should never break operations
 */
export async function trackOperationMetrics(metrics: OperationMetrics): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    await supabase
      ?.from('woocommerce_usage_metrics')
      .insert(metrics);
  } catch (error) {
    // Silent fail - metrics tracking should never break operations
    console.error('[Analytics] Failed to track metrics:', error);
  }
}

/**
 * Get customer config ID for analytics
 */
export async function getCustomerConfigId(domain: string): Promise<string | null> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) return null;

    const { data } = await supabase
      .from('customer_configs')
      .select('id')
      .eq('domain', domain)
      .single();

    return data?.id || null;
  } catch (error) {
    console.error('[Analytics] Failed to get customer config ID:', error);
    return null;
  }
}
