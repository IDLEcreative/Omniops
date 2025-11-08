/**
 * Shopify workflow instructions for AI chat system
 */

import { generateCommerceWorkflowPrompt, type CommerceWorkflowConfig } from './commerce-workflow-template';

export function getShopifyWorkflowPrompt(): string {
  const config: CommerceWorkflowConfig = {
    platform: 'Shopify',
    emoji: '🛍️',
    productDiscovery: {
      steps: [
        {
          title: 'SEARCH PRODUCTS',
          operation: '"searchProducts", query: "[keywords]", limit: [number]',
          examples: '"Do you have shirts?", "Show me products under $50"',
          returns: 'List of products with titles, prices, variants, images'
        },
        {
          title: 'GET PRODUCT DETAILS',
          operation: '"getProduct", id: [product_id]',
          examples: 'Customer wants full specifications or variant options',
          returns: 'Complete product data including all variants, inventory, images'
        }
      ],
      advanced: [
        `**Browse All Products:**
- Operation: "getProducts", params: { limit: 20, status: "active" }
- Use for: General browsing, category exploration
- Filters: vendor, product_type, collection_id, published_status`
      ]
    },
    orderManagement: {
      lookup: [
        'Operation: "lookupOrder", orderId: "[order_number]", email: "[customer_email]"',
        'Handles: Order ID, order name (#1001), or email search',
        'Returns: Order status, items, totals, shipping/billing info'
      ],
      tracking: [
        'Operation: "getOrders", params: { status: "any", limit: 10 }',
        'Filters: created_at_min, financial_status, fulfillment_status',
        'Use when: Customer wants to see recent orders',
        '',
        'Operation: "getOrder", id: [order_id]',
        'Use when: You have specific order ID from lookup',
        'Returns: Full order details including line items'
      ]
    },
    additionalSections: [
      {
        title: 'INVENTORY MANAGEMENT',
        icon: '📊',
        content: `**Check Stock Levels:**
- Operation: "getInventoryLevel", params: { inventory_item_ids: "[item_id]" }
- Returns: Available quantity per location
- Note: Requires inventory_item_id (from product variants)`
      },
      {
        title: 'CUSTOMER OPERATIONS',
        icon: '👥',
        content: `**Customer Search:**
- Operation: "searchCustomers", query: "[email or name]", limit: 10
- Use when: Looking up customer by email or name

**Customer Details:**
- Operation: "getCustomer", id: [customer_id]
- Returns: Full customer profile including addresses, order count

**Customer List:**
- Operation: "getCustomers", params: { limit: 20 }
- Filters: created_at_min, updated_at_min
- Use for: Admin queries about customer base`
      }
    ],
    operationGuide: {
      platformOperations: [
        'Real-time product catalog browsing',
        'Order status and history lookup',
        'Inventory level checks',
        'Customer account information',
        'Product variant and pricing details'
      ],
      generalSearch: [
        'Store policies, shipping info, FAQs',
        'Non-product content (guides, articles)'
      ]
    },
    platformNotes: `### ⚙️ SHOPIFY-SPECIFIC NOTES
**Order Numbers:**
- Shopify uses friendly order names like "#1001"
- lookupOrder handles both numeric IDs and order names
- Always try order name if numeric ID fails

**Product Variants:**
- Products may have multiple variants (size, color, etc.)
- Each variant has its own inventory_item_id for stock checks
- Use getProduct to see all available variants

**Inventory:**
- Inventory can be tracked at multiple locations
- Must use inventory_item_id (not product_id) for stock checks
- Some products may not have inventory tracking enabled

**Customer Privacy:**
- Never share customer email or personal info without verification
- Order lookup requires both order number AND email for security`
  };

  return generateCommerceWorkflowPrompt(config);
}
