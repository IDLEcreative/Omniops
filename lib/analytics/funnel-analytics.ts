/**
 * Funnel Analytics Service
 *
 * Tracks complete customer journey from chat → cart abandonment → purchase
 * Integrates with existing cart tracker and purchase attribution systems
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import type {
  ConversationFunnel,
  FunnelMetrics,
  FunnelTrend,
  CustomerJourney,
  FunnelStage,
  CartPriority,
} from '@/types/purchase-attribution';

/**
 * Record chat initiation in funnel
 */
export async function recordChatStage(
  conversationId: string,
  customerEmail: string,
  domain: string
): Promise<{ success: boolean; funnelId?: string }> {
  const supabase = await createServiceRoleClient();

  const { data, error } = await supabase
    .from('conversation_funnel')
    .insert({
      conversation_id: conversationId,
      customer_email: customerEmail.toLowerCase(),
      domain,
      chat_started_at: new Date().toISOString(),
      current_stage: 'chat',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Funnel] Error recording chat stage:', error);
    return { success: false };
  }

  return { success: true, funnelId: data.id };
}

/**
 * Record cart abandonment in funnel
 */
export async function recordCartStage(
  conversationId: string,
  customerEmail: string,
  cartOrderId: string,
  cartValue: number,
  itemCount: number,
  priority: CartPriority
): Promise<{ success: boolean }> {
  const supabase = await createServiceRoleClient();

  const { data: existingFunnel } = await supabase
    .from('conversation_funnel')
    .select('id, chat_started_at')
    .eq('conversation_id', conversationId)
    .eq('customer_email', customerEmail.toLowerCase())
    .single();

  if (!existingFunnel) {
    console.warn('[Funnel] No chat stage found, creating new funnel entry');
    await supabase.from('conversation_funnel').insert({
      conversation_id: conversationId,
      customer_email: customerEmail.toLowerCase(),
      domain: '', // Will be filled by trigger or next update
      chat_started_at: new Date().toISOString(),
      cart_created_at: new Date().toISOString(),
      cart_order_id: cartOrderId,
      cart_value: cartValue,
      cart_item_count: itemCount,
      cart_priority: priority,
      current_stage: 'cart_abandoned',
      time_to_cart: 0,
    });
    return { success: true };
  }

  const cartCreatedAt = new Date();
  const chatStartedAt = new Date(existingFunnel.chat_started_at);
  const timeToCart = Math.floor((cartCreatedAt.getTime() - chatStartedAt.getTime()) / 1000);

  const { error } = await supabase
    .from('conversation_funnel')
    .update({
      cart_created_at: cartCreatedAt.toISOString(),
      cart_order_id: cartOrderId,
      cart_value: cartValue,
      cart_item_count: itemCount,
      cart_priority: priority,
      current_stage: 'cart_abandoned',
      time_to_cart: timeToCart,
    })
    .eq('id', existingFunnel.id);

  if (error) console.error('[Funnel] Error recording cart stage:', error);
  return { success: !error };
}

/**
 * Record purchase completion in funnel
 */
export async function recordPurchaseStage(
  conversationId: string,
  customerEmail: string,
  purchaseOrderId: string,
  purchaseValue: number,
  attributionConfidence: number,
  attributionMethod: string
): Promise<{ success: boolean }> {
  const supabase = await createServiceRoleClient();

  const { data: existingFunnel } = await supabase
    .from('conversation_funnel')
    .select('id, chat_started_at, cart_created_at')
    .eq('conversation_id', conversationId)
    .eq('customer_email', customerEmail.toLowerCase())
    .single();

  if (!existingFunnel) {
    console.warn('[Funnel] No funnel entry found for purchase');
    return { success: false };
  }

  const purchasedAt = new Date();
  const chatStartedAt = new Date(existingFunnel.chat_started_at);
  const timeToPurchase = Math.floor((purchasedAt.getTime() - chatStartedAt.getTime()) / 1000);

  const updates: any = {
    purchased_at: purchasedAt.toISOString(),
    purchase_order_id: purchaseOrderId,
    purchase_value: purchaseValue,
    attribution_confidence: attributionConfidence,
    attribution_method: attributionMethod,
    current_stage: 'purchased',
    time_to_purchase: timeToPurchase,
    drop_off_point: null, // Clear drop-off since they completed
  };

  if (existingFunnel.cart_created_at) {
    const cartCreatedAt = new Date(existingFunnel.cart_created_at);
    updates.cart_to_purchase_time = Math.floor((purchasedAt.getTime() - cartCreatedAt.getTime()) / 1000);
  }

  const { error } = await supabase.from('conversation_funnel').update(updates).eq('id', existingFunnel.id);

  if (error) console.error('[Funnel] Error recording purchase stage:', error);
  return { success: !error };
}

/**
 * Get funnel metrics for a domain
 */
export async function getFunnelMetrics(
  domain: string,
  timeRange: { start: Date; end: Date }
): Promise<FunnelMetrics> {
  const supabase = await createServiceRoleClient();

  const { data: funnels } = await supabase
    .from('conversation_funnel')
    .select('*')
    .eq('domain', domain)
    .gte('chat_started_at', timeRange.start.toISOString())
    .lte('chat_started_at', timeRange.end.toISOString());

  if (!funnels || funnels.length === 0) {
    return getEmptyFunnelMetrics(timeRange);
  }

  const totalChats = funnels.length;
  const totalCarts = funnels.filter(f => f.cart_created_at).length;
  const totalPurchases = funnels.filter(f => f.purchased_at).length;
  const totalRevenue = funnels.reduce((sum, f) => sum + (f.purchase_value || 0), 0);

  const cartTimes = funnels.filter(f => f.time_to_cart).map(f => f.time_to_cart);
  const purchaseTimes = funnels.filter(f => f.time_to_purchase).map(f => f.time_to_purchase);
  const cartToPurchaseTimes = funnels.filter(f => f.cart_to_purchase_time).map(f => f.cart_to_purchase_time);

  const highPriority = funnels.filter(f => f.cart_priority === 'high');
  const mediumPriority = funnels.filter(f => f.cart_priority === 'medium');
  const lowPriority = funnels.filter(f => f.cart_priority === 'low');

  return {
    timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
    overview: { totalChats, totalCarts, totalPurchases, totalRevenue },
    conversionRates: {
      chatToCart: totalChats > 0 ? (totalCarts / totalChats) * 100 : 0,
      cartToPurchase: totalCarts > 0 ? (totalPurchases / totalCarts) * 100 : 0,
      overallConversion: totalChats > 0 ? (totalPurchases / totalChats) * 100 : 0,
    },
    dropOffAnalysis: {
      droppedAtCart: funnels.filter(f => f.drop_off_point === 'chat_to_cart').length,
      droppedAtPurchase: funnels.filter(f => f.drop_off_point === 'cart_to_purchase').length,
      chatOnlyRate: totalChats > 0 ? ((totalChats - totalCarts) / totalChats) * 100 : 0,
      cartAbandonmentRate: totalCarts > 0 ? ((totalCarts - totalPurchases) / totalCarts) * 100 : 0,
    },
    timingMetrics: {
      avgTimeToCartMinutes: avg(cartTimes) / 60,
      avgTimeToPurchaseMinutes: avg(purchaseTimes) / 60,
      avgCartToPurchaseMinutes: avg(cartToPurchaseTimes) / 60,
      medianTimeToCartMinutes: median(cartTimes) / 60,
      medianTimeToPurchaseMinutes: median(purchaseTimes) / 60,
    },
    revenueMetrics: {
      totalRevenue,
      avgPurchaseValue: totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
      cartValue: funnels.reduce((sum, f) => sum + (f.cart_value || 0), 0),
      lostRevenue: funnels.filter(f => !f.purchased_at).reduce((sum, f) => sum + (f.cart_value || 0), 0),
    },
    cartPriorityBreakdown: {
      high: calcPriorityMetrics(highPriority),
      medium: calcPriorityMetrics(mediumPriority),
      low: calcPriorityMetrics(lowPriority),
    },
  };
}

/**
 * Get funnel trends over time
 */
export async function getFunnelTrends(
  domain: string,
  days: number = 30
): Promise<FunnelTrend[]> {
  const supabase = await createServiceRoleClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data } = await supabase
    .from('conversation_funnel_stats')
    .select('*')
    .eq('domain', domain)
    .gte('date', startDate.toISOString())
    .order('date', { ascending: true });

  if (!data) return [];

  return data.map(d => ({
    date: d.date,
    totalChats: d.total_chats || 0,
    totalCarts: d.total_carts || 0,
    totalPurchases: d.total_purchases || 0,
    chatToCartRate: d.chat_to_cart_rate || 0,
    cartToPurchaseRate: d.cart_to_purchase_rate || 0,
    overallConversionRate: d.overall_conversion_rate || 0,
    revenue: d.total_revenue || 0,
  }));
}

function getEmptyFunnelMetrics(timeRange: { start: Date; end: Date }): FunnelMetrics {
  return {
    timeRange: { start: timeRange.start.toISOString(), end: timeRange.end.toISOString() },
    overview: { totalChats: 0, totalCarts: 0, totalPurchases: 0, totalRevenue: 0 },
    conversionRates: { chatToCart: 0, cartToPurchase: 0, overallConversion: 0 },
    dropOffAnalysis: { droppedAtCart: 0, droppedAtPurchase: 0, chatOnlyRate: 0, cartAbandonmentRate: 0 },
    timingMetrics: { avgTimeToCartMinutes: 0, avgTimeToPurchaseMinutes: 0, avgCartToPurchaseMinutes: 0, medianTimeToCartMinutes: 0, medianTimeToPurchaseMinutes: 0 },
    revenueMetrics: { totalRevenue: 0, avgPurchaseValue: 0, cartValue: 0, lostRevenue: 0 },
    cartPriorityBreakdown: {
      high: { count: 0, value: 0, conversionRate: 0 },
      medium: { count: 0, value: 0, conversionRate: 0 },
      low: { count: 0, value: 0, conversionRate: 0 },
    },
  };
}

function avg(nums: number[]): number {
  return nums.length > 0 ? nums.reduce((sum, n) => sum + n, 0) / nums.length : 0;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

function calcPriorityMetrics(funnels: any[]): { count: number; value: number; conversionRate: number } {
  const count = funnels.length;
  const value = funnels.reduce((sum, f) => sum + (f.cart_value || 0), 0);
  const conversions = funnels.filter(f => f.purchased_at).length;
  return { count, value, conversionRate: count > 0 ? (conversions / count) * 100 : 0 };
}
