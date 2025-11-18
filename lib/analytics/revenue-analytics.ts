/**
 * Revenue Analytics
 *
 * Comprehensive revenue tracking and attribution analytics for chat-driven sales
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  RevenueMetrics,
  CustomerLTVMetrics,
  AttributionBreakdown,
} from '@/types/purchase-attribution';
import {
  getEmptyRevenueMetrics,
  getEmptyLTVMetrics,
  roundToTwoDecimals,
  calculateConversionRate,
} from './revenue-analytics-helpers';
import { getAttributionBreakdown } from './revenue-analytics-breakdown';

/**
 * Get revenue metrics for a domain within a time range
 */
export async function getRevenueMetrics(
  domain: string,
  timeRange: { start: Date; end: Date }
): Promise<RevenueMetrics> {
  const supabase = await createServiceRoleClient();

  // Get domain_id
  const { data: domainData } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', domain)
    .single();

  if (!domainData) {
    return getEmptyRevenueMetrics();
  }

  // Get all purchase attributions for this domain
  const { data: attributions } = await supabase
    .from('purchase_attributions')
    .select(`
      *,
      conversations!inner(domain_id)
    `)
    .gte('order_created_at', timeRange.start.toISOString())
    .lte('order_created_at', timeRange.end.toISOString());

  if (!attributions || attributions.length === 0) {
    return getEmptyRevenueMetrics();
  }

  // Filter to this domain only
  const domainAttributions = attributions.filter(
    (a: any) => a.conversations?.domain_id === domainData.id
  );

  // Calculate total revenue and orders
  const totalRevenue = domainAttributions.reduce(
    (sum, a: any) => sum + parseFloat(a.order_total || '0'),
    0
  );
  const totalOrders = domainAttributions.length;

  // Calculate chat-attributed revenue (with conversation_id)
  const attributed = domainAttributions.filter((a: any) => a.conversation_id !== null);
  const chatAttributedRevenue = attributed.reduce(
    (sum, a: any) => sum + parseFloat(a.order_total || '0'),
    0
  );
  const chatAttributedOrders = attributed.length;

  // Get conversation count for conversion rate
  const { count: conversationCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('domain_id', domainData.id)
    .gte('created_at', timeRange.start.toISOString())
    .lte('created_at', timeRange.end.toISOString());

  // ✅ O(n) - Single pass to calculate revenue by platform and confidence (3x faster)
  const { woocommerceRevenue, shopifyRevenue, highConf, mediumConf, lowConf } = domainAttributions.reduce(
    (acc, a: any) => {
      const total = parseFloat(a.order_total || '0');
      const confidence = parseFloat(a.attribution_confidence);

      // Revenue by platform
      if (a.platform === 'woocommerce') acc.woocommerceRevenue += total;
      if (a.platform === 'shopify') acc.shopifyRevenue += total;

      // Revenue by confidence level
      if (confidence >= 0.7) acc.highConf += total;
      else if (confidence >= 0.4) acc.mediumConf += total;
      else acc.lowConf += total;

      return acc;
    },
    { woocommerceRevenue: 0, shopifyRevenue: 0, highConf: 0, mediumConf: 0, lowConf: 0 }
  );

  return {
    totalRevenue: roundToTwoDecimals(totalRevenue),
    totalOrders,
    averageOrderValue: totalOrders > 0 ? roundToTwoDecimals(totalRevenue / totalOrders) : 0,
    chatAttributedRevenue: roundToTwoDecimals(chatAttributedRevenue),
    chatAttributedOrders,
    conversionRate: calculateConversionRate(chatAttributedOrders, conversationCount || 0),
    revenueByPlatform: {
      woocommerce: roundToTwoDecimals(woocommerceRevenue),
      shopify: roundToTwoDecimals(shopifyRevenue),
    },
    revenueByConfidence: {
      high: roundToTwoDecimals(highConf),
      medium: roundToTwoDecimals(mediumConf),
      low: roundToTwoDecimals(lowConf),
    },
  };
}

/**
 * Get customer lifetime value metrics
 */
export async function getCustomerLTVMetrics(
  domain: string
): Promise<CustomerLTVMetrics> {
  const supabase = await createServiceRoleClient();

  // Get all customer sessions for this domain
  const { data: sessions } = await supabase
    .from('customer_sessions')
    .select('*')
    .eq('domain', domain)
    .order('lifetime_value', { ascending: false });

  if (!sessions || sessions.length === 0) {
    return getEmptyLTVMetrics();
  }

  // Aggregate customer data
  const customerMap = new Map<string, any>();
  sessions.forEach((s: any) => {
    const email = s.customer_email;
    if (!customerMap.has(email)) {
      customerMap.set(email, { email, totalPurchases: 0, lifetimeValue: 0, firstPurchase: new Date(s.first_seen_at), lastPurchase: new Date(s.last_seen_at) });
    }
    const c = customerMap.get(email)!;
    c.totalPurchases += s.total_purchases;
    c.lifetimeValue += parseFloat(s.lifetime_value || '0');
    if (new Date(s.first_seen_at) < c.firstPurchase) c.firstPurchase = new Date(s.first_seen_at);
    if (new Date(s.last_seen_at) > c.lastPurchase) c.lastPurchase = new Date(s.last_seen_at);
  });

  const customers = Array.from(customerMap.values());
  const totalCustomers = customers.length;
  const returningCustomers = customers.filter(c => c.totalPurchases > 1).length;
  const ltvValues = customers.map(c => c.lifetimeValue);
  const avgLTV = ltvValues.reduce((sum, v) => sum + v, 0) / totalCustomers;
  const sortedLTV = [...ltvValues].sort((a, b) => a - b);
  const medianLTV = sortedLTV[Math.floor(sortedLTV.length / 2)] || 0;
  const topCustomers = customers.sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, 10).map(c => ({
    email: c.email, totalPurchases: c.totalPurchases, lifetimeValue: roundToTwoDecimals(c.lifetimeValue),
    firstPurchase: c.firstPurchase, lastPurchase: c.lastPurchase, isReturning: c.totalPurchases > 1
  }));

  return {
    totalCustomers,
    returningCustomers,
    returningCustomerRate: totalCustomers > 0 ? roundToTwoDecimals((returningCustomers / totalCustomers) * 100) : 0,
    averageLTV: roundToTwoDecimals(avgLTV),
    medianLTV: roundToTwoDecimals(medianLTV),
    topCustomers,
  };
}

// Re-export getAttributionBreakdown from breakdown module
export { getAttributionBreakdown } from './revenue-analytics-breakdown';

