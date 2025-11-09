/**
 * Purchase Attribution Types
 *
 * Type definitions for purchase tracking and customer lifetime value analytics
 */

export interface PurchaseAttribution {
  id: string;
  conversation_id: string | null;
  customer_email: string;
  order_id: string;
  order_number: string | null;
  platform: 'woocommerce' | 'shopify';
  order_total: number;
  currency: string;
  attribution_confidence: number; // 0.0 to 1.0
  attribution_method: 'session_match' | 'email_match' | 'time_proximity' | 'no_match' | 'manual';
  attribution_reasoning: string | null;
  order_metadata: Record<string, any>;
  order_created_at: string | null;
  attributed_at: string;
  created_at: string;
}

export interface CustomerSession {
  id: string;
  customer_email: string;
  session_id: string;
  domain: string;
  first_seen_at: string;
  last_seen_at: string;
  total_conversations: number;
  total_purchases: number;
  lifetime_value: number;
  customer_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AttributionContext {
  customerEmail: string;
  orderId: string;
  orderNumber?: string;
  orderTotal: number;
  orderTimestamp: Date;
  platform: 'woocommerce' | 'shopify';
  domain: string;
  orderMetadata?: Record<string, any>;
}

export interface AttributionResult {
  conversationId: string | null;
  confidence: number; // 0.0 to 1.0
  method: 'session_match' | 'email_match' | 'time_proximity' | 'no_match';
  reasoning: string;
  matchedConversations?: Array<{
    id: string;
    sessionId: string;
    lastMessageAt: string;
    score: number;
  }>;
}

export interface ReturningCustomerMetrics {
  isReturningCustomer: boolean;
  totalConversations: number;
  totalPurchases: number;
  lifetimeValue: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
  customerAgeDays: number;
}

export interface RevenueMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  chatAttributedRevenue: number;
  chatAttributedOrders: number;
  conversionRate: number; // orders / conversations
  revenueByPlatform: {
    woocommerce: number;
    shopify: number;
  };
  revenueByConfidence: {
    high: number; // >= 0.7
    medium: number; // 0.4 - 0.69
    low: number; // < 0.4
  };
}

export interface CustomerLTVMetrics {
  totalCustomers: number;
  returningCustomers: number;
  returningCustomerRate: number; // percentage
  averageLTV: number;
  medianLTV: number;
  topCustomers: Array<{
    email: string;
    totalPurchases: number;
    lifetimeValue: number;
    firstPurchase: Date;
    lastPurchase: Date;
    isReturning: boolean;
  }>;
}

export interface AttributionBreakdown {
  byMethod: {
    session_match: { count: number; revenue: number; avgConfidence: number };
    email_match: { count: number; revenue: number; avgConfidence: number };
    time_proximity: { count: number; revenue: number; avgConfidence: number };
    no_match: { count: number; revenue: number; avgConfidence: number };
  };
  byConfidence: {
    high: { count: number; revenue: number; avgConfidence: number };
    medium: { count: number; revenue: number; avgConfidence: number };
    low: { count: number; revenue: number; avgConfidence: number };
  };
  timeToConversion: {
    avgSeconds: number;
    medianSeconds: number;
    distribution: Array<{
      bucket: string; // "0-1h", "1-6h", "6-24h", "1-7d", "7d+"
      count: number;
      revenue: number;
    }>;
  };
}

// Webhook payload types
export interface WooCommerceOrderWebhook {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    quantity: number;
    total: string;
  }>;
  date_created: string;
  date_created_gmt: string;
  meta_data?: Array<{
    key: string;
    value: any;
  }>;
}

export interface ShopifyOrderWebhook {
  id: number;
  order_number: number;
  email: string;
  currency: string;
  current_total_price: string;
  billing_address?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
  customer?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
  line_items: Array<{
    id: number;
    title: string;
    product_id: number;
    quantity: number;
    price: string;
  }>;
  created_at: string;
  note?: string;
  note_attributes?: Array<{
    name: string;
    value: string;
  }>;
}

// Conversation Funnel Types
export type FunnelStage = 'chat' | 'cart_abandoned' | 'purchased';
export type DropOffPoint = 'chat_to_cart' | 'cart_to_purchase';
export type CartPriority = 'high' | 'medium' | 'low';

export interface ConversationFunnel {
  id: string;
  conversation_id: string;
  customer_email: string;
  domain: string;

  // Funnel stages
  chat_started_at: string;
  cart_created_at: string | null;
  purchased_at: string | null;

  // Cart details
  cart_order_id: string | null;
  cart_value: number | null;
  cart_item_count: number | null;
  cart_priority: CartPriority | null;

  // Purchase details
  purchase_order_id: string | null;
  purchase_value: number | null;
  attribution_confidence: number | null;
  attribution_method: string | null;

  // Analytics
  current_stage: FunnelStage;
  drop_off_point: DropOffPoint | null;

  // Timing metrics (seconds)
  time_to_cart: number | null;
  time_to_purchase: number | null;
  cart_to_purchase_time: number | null;

  // Metadata
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;
}

export interface FunnelMetrics {
  timeRange: {
    start: string;
    end: string;
  };
  overview: {
    totalChats: number;
    totalCarts: number;
    totalPurchases: number;
    totalRevenue: number;
  };
  conversionRates: {
    chatToCart: number; // percentage
    cartToPurchase: number; // percentage
    overallConversion: number; // chat to purchase percentage
  };
  dropOffAnalysis: {
    droppedAtCart: number; // count
    droppedAtPurchase: number; // count
    chatOnlyRate: number; // percentage
    cartAbandonmentRate: number; // percentage
  };
  timingMetrics: {
    avgTimeToCartMinutes: number;
    avgTimeToPurchaseMinutes: number;
    avgCartToPurchaseMinutes: number;
    medianTimeToCartMinutes: number;
    medianTimeToPurchaseMinutes: number;
  };
  revenueMetrics: {
    totalRevenue: number;
    avgPurchaseValue: number;
    cartValue: number; // total value in abandoned carts
    lostRevenue: number; // value of carts not converted
  };
  cartPriorityBreakdown: {
    high: { count: number; value: number; conversionRate: number };
    medium: { count: number; value: number; conversionRate: number };
    low: { count: number; value: number; conversionRate: number };
  };
}

export interface FunnelTrend {
  date: string;
  totalChats: number;
  totalCarts: number;
  totalPurchases: number;
  chatToCartRate: number;
  cartToPurchaseRate: number;
  overallConversionRate: number;
  revenue: number;
}

export interface CustomerJourney {
  conversationId: string;
  customerEmail: string;
  stages: Array<{
    stage: FunnelStage;
    timestamp: string;
    details: Record<string, any>;
  }>;
  currentStage: FunnelStage;
  completedPurchase: boolean;
  totalValue: number;
  timeToConversion?: number; // seconds
}
