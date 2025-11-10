/**
 * Cart Analytics Tracking Service
 *
 * Tracks all cart operations for monitoring and optimization.
 * Integrates with both WooCommerce and Shopify platforms.
 */

import { createServiceRoleClient } from './supabase-server';

export interface CartOperationParams {
  domain: string;
  sessionId: string;
  userId?: string;
  operationType: 'add_to_cart' | 'remove_from_cart' | 'update_quantity' | 'apply_coupon' | 'get_cart' | 'lookup_order';
  platform: 'woocommerce' | 'shopify';
  productId?: string;
  quantity?: number;
  cartValue?: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface CartSessionMetrics {
  domain: string;
  sessionId: string;
  platform: string;
  totalOperations: number;
  itemsAdded: number;
  itemsRemoved: number;
  finalCartValue: number;
  converted: boolean;
  conversionValue?: number;
  sessionDurationSeconds: number;
}

export interface CartAbandonment {
  domain: string;
  sessionId: string;
  platform: string;
  cartValue: number;
  itemsCount: number;
  lastActivityAt: Date;
}

/**
 * Track a cart operation
 */
export async function trackCartOperation(params: CartOperationParams): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return;
    }

    const { error } = await supabase.from('cart_operations').insert({
      domain: params.domain,
      session_id: params.sessionId,
      user_id: params.userId,
      operation_type: params.operationType,
      platform: params.platform,
      product_id: params.productId,
      quantity: params.quantity,
      cart_value: params.cartValue,
      success: params.success,
      error_message: params.errorMessage,
      metadata: params.metadata || {}
    });

    if (error) {
      console.error('[Cart Analytics] Failed to track operation:', error);
    }
  } catch (error) {
    console.error('[Cart Analytics] Error tracking operation:', error);
  }
}

/**
 * Get session metrics for a specific session
 */
export async function getSessionMetrics(sessionId: string): Promise<CartSessionMetrics | null> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return null;
    }

    const { data, error } = await supabase
      .from('cart_session_metrics')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      domain: data.domain,
      sessionId: data.session_id,
      platform: data.platform,
      totalOperations: data.total_operations,
      itemsAdded: data.items_added,
      itemsRemoved: data.items_removed,
      finalCartValue: parseFloat(data.final_cart_value),
      converted: data.converted,
      conversionValue: data.conversion_value ? parseFloat(data.conversion_value) : undefined,
      sessionDurationSeconds: data.session_duration_seconds
    };
  } catch (error) {
    console.error('[Cart Analytics] Error getting session metrics:', error);
    return null;
  }
}

/**
 * Mark a cart as abandoned
 */
export async function markCartAbandoned(params: CartAbandonment): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return;
    }

    const { error } = await supabase.from('cart_abandonments').insert({
      domain: params.domain,
      session_id: params.sessionId,
      platform: params.platform,
      cart_value: params.cartValue,
      items_count: params.itemsCount,
      last_activity_at: params.lastActivityAt.toISOString(),
      abandoned_at: new Date().toISOString()
    });

    if (error) {
      console.error('[Cart Analytics] Failed to mark cart abandoned:', error);
    }
  } catch (error) {
    console.error('[Cart Analytics] Error marking cart abandoned:', error);
  }
}

/**
 * Mark a cart as recovered (conversion after abandonment)
 */
export async function markCartRecovered(sessionId: string): Promise<void> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return;
    }

    const { error } = await supabase
      .from('cart_abandonments')
      .update({
        recovered: true,
        recovered_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('[Cart Analytics] Failed to mark cart recovered:', error);
    }
  } catch (error) {
    console.error('[Cart Analytics] Error marking cart recovered:', error);
  }
}

/**
 * Get cart analytics for a domain
 */
export async function getDomainAnalytics(
  domain: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return null;
    }

    let query = supabase
      .from('cart_analytics_daily')
      .select('*')
      .eq('domain', domain)
      .order('date', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Cart Analytics] Failed to get analytics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[Cart Analytics] Error getting analytics:', error);
    return null;
  }
}

/**
 * Get recent cart operations for a domain
 */
export async function getRecentOperations(
  domain: string,
  limit: number = 100
): Promise<any[]> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return [];
    }

    const { data, error } = await supabase
      .from('cart_operations')
      .select('*')
      .eq('domain', domain)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Cart Analytics] Failed to get operations:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Cart Analytics] Error getting operations:', error);
    return [];
  }
}

/**
 * Get abandoned carts for a domain
 */
export async function getAbandonedCarts(
  domain: string,
  includeRecovered: boolean = false
): Promise<any[]> {
  try {
    const supabase = await createServiceRoleClient();
    if (!supabase) {
      console.error('[Cart Analytics] Supabase client not available');
      return [];
    }

    let query = supabase
      .from('cart_abandonments')
      .select('*')
      .eq('domain', domain)
      .order('abandoned_at', { ascending: false });

    if (!includeRecovered) {
      query = query.eq('recovered', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Cart Analytics] Failed to get abandoned carts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('[Cart Analytics] Error getting abandoned carts:', error);
    return [];
  }
}
