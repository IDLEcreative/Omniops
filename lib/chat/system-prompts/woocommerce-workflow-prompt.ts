/**
 * WooCommerce workflow instructions for AI chat system
 */

import { generateCommerceWorkflowPrompt, type CommerceWorkflowConfig } from './commerce-workflow-template';

export function getWooCommerceWorkflowPrompt(): string {
  const config: CommerceWorkflowConfig = {
    platform: 'WooCommerce',
    emoji: '🛒',
    operationCount: '25',
    productDiscovery: {
      steps: [
        {
          title: 'BROAD SEARCH (finding candidates)',
          operation: '"search_products", query: "[customer\'s keywords]"',
          examples: '"Do you have equipment?", "Show me products under £500"',
          returns: 'List of matching products with SKUs, prices, basic details'
        },
        {
          title: 'DETAILED INFO (once product identified)',
          operation: '"get_product_details", productId: "[SKU from search]"',
          examples: '"Tell me more about the Model-123", "What are the specifications?"',
          returns: 'Full product data including description, variations, attributes'
        },
        {
          title: 'STOCK CHECK (before recommending)',
          operation: '"check_stock", productId: "[SKU]"',
          examples: '"Is this in stock?", "Can I order 5 units?"',
          returns: 'Availability status (in stock, out of stock, on backorder)'
        }
      ],
      advanced: [
        `**Advanced Stock Query:**
- Operation: "get_stock_quantity", productId: "[SKU]"
- Use when customer asks: "Exactly how many do you have?", "What's your inventory level?"
- Returns: Precise number (e.g., "15 units available")`,
        `**Price & Variations:**
- check_price: Get current pricing for specific SKU
- get_product_variations: Check if product has options (sizes, colors, voltages)
- get_product_reviews: Show customer feedback and ratings`
      ]
    },
    orderManagement: {
      lookup: [
        'Has order number? → operation: "check_order", orderId: "[number]"',
        'Only has email? → operation: "check_order", email: "[email]"',
        'Wants full history? → operation: "get_customer_orders", email: "[email]"'
      ],
      tracking: [
        'operation: "get_shipping_info" → Get delivery estimates and carrier info',
        'operation: "get_order_notes", orderId: "[ID]" → Check for updates/messages'
      ],
      resolution: [
        'Wants refund status? → operation: "check_refund_status", orderId: "[ID]"',
        'Wants to cancel? → operation: "cancel_order", orderId: "[ID]", reason: "[reason]"'
      ]
    },
    additionalSections: [
      {
        title: 'CART WORKFLOW (search → add → review → checkout)',
        icon: '🛒',
        content: `Guide customers through the purchase journey:

**Step 1: Find Product** → Use search_products
**Step 2: Add to Cart** → operation: "add_to_cart", productId: "[ID]", quantity: [number]
**Step 3: Review Cart** → operation: "get_cart" (shows what's in cart)
**Step 4: Apply Discounts** → operation: "apply_coupon_to_cart", couponCode: "[CODE]"

**🎯 DIRECT CART MANIPULATION ENABLED:**
- Items are added DIRECTLY to cart via Store API
- Real-time cart updates without page redirects
- Instant totals with taxes and shipping
- Cart persists for 24 hours (session-based)

**Cart Management:**
- Remove item: operation: "remove_from_cart", productId: "[ID]"
- Update quantity: operation: "update_cart_quantity", productId: "[ID]", quantity: [number]
- Validate coupon first: operation: "validate_coupon", couponCode: "[CODE]"`
      },
      {
        title: 'STORE INFORMATION',
        icon: '🏪',
        content: `**Shipping & Payment:**
- operation: "get_shipping_methods" → Available shipping options and costs
- operation: "get_payment_methods" → Accepted payment types

**Admin Operations** (business intelligence):
- operation: "get_low_stock_products", threshold: 10 → Inventory alerts
- operation: "get_customer_insights", limit: 5 → Top customers by LTV
- operation: "get_sales_report", period: "week" → Revenue analytics`
      }
    ],
    operationGuide: {
      platformOperations: [
        'Real-time stock levels and exact quantities',
        'Order status, tracking, and history',
        'Cart operations and checkout flow',
        'Live pricing and product variations',
        'Store configuration (shipping, payment methods)'
      ],
      generalSearch: [
        'Product discovery with keywords and filters',
        'Finding similar or alternative items',
        'Browsing by category or price range',
        'Documentation, FAQs, and general information',
        'Non-product content (policies, guides, articles)'
      ]
    }
  };

  return generateCommerceWorkflowPrompt(config);
}
