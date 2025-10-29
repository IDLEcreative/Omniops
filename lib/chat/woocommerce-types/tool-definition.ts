/**
 * WooCommerce Tool Definition
 * OpenAI function calling tool definition for WooCommerce operations
 */

// OpenAI function calling tool definition
export const WOOCOMMERCE_TOOL = {
  type: "function" as const,
  function: {
    name: "woocommerce_operations",
    description: "Access live WooCommerce store data for real-time commerce operations. Use for: (1) Product info: exact stock levels, pricing, variations, reviews; (2) Orders: status lookup, tracking, history, cancellations, refunds; (3) Cart: add/remove items, quantity updates, coupon application; (4) Store config: shipping methods, payment gateways; (5) Business intelligence: low stock alerts, sales reports, customer insights. Supports 25 operations covering the complete e-commerce lifecycle. Use search_products for product discovery, then get_product_details for specifics, then check_stock before recommending.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["check_stock", "get_stock_quantity", "get_product_details", "check_order", "get_shipping_info", "get_shipping_methods", "check_price", "get_product_variations", "get_product_categories", "get_product_reviews", "validate_coupon", "check_refund_status", "get_customer_orders", "get_order_notes", "get_payment_methods", "get_customer_insights", "get_low_stock_products", "get_sales_report", "search_products", "cancel_order", "add_to_cart", "get_cart", "remove_from_cart", "update_cart_quantity", "apply_coupon_to_cart"],
          description: "The specific WooCommerce operation to execute. Choose based on customer intent: search_products (finding products), get_product_details (specific info), check_stock (availability), check_order (order status), add_to_cart (purchasing), get_customer_insights (analytics)."
        },
        productId: {
          type: "string",
          description: "Product ID or SKU for stock/product operations"
        },
        orderId: {
          type: "string",
          description: "Order ID for order operations"
        },
        email: {
          type: "string",
          description: "Customer email for order lookups"
        },
        includeQuantity: {
          type: "boolean",
          description: "Whether to include exact stock quantities",
          default: false
        },
        categoryId: {
          type: "string",
          description: "Category ID for category operations"
        },
        parentCategory: {
          type: "number",
          description: "Parent category ID to filter subcategories"
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return"
        },
        minRating: {
          type: "number",
          description: "Minimum rating filter (1-5 stars)"
        },
        couponCode: {
          type: "string",
          description: "Coupon code to validate"
        },
        status: {
          type: "string",
          description: "Order status filter (pending, processing, completed, etc.)"
        },
        dateFrom: {
          type: "string",
          description: "Start date for order history filter (YYYY-MM-DD)"
        },
        dateTo: {
          type: "string",
          description: "End date for order history filter (YYYY-MM-DD)"
        },
        variationId: {
          type: "string",
          description: "Specific variation ID to retrieve"
        },
        country: {
          type: "string",
          description: "Country code for shipping calculation (e.g., GB, US)"
        },
        postcode: {
          type: "string",
          description: "Postcode/ZIP code for shipping calculation"
        },
        threshold: {
          type: "number",
          description: "Stock threshold for low stock alerts (default: 5)"
        },
        period: {
          type: "string",
          description: "Report period: day, week, month, year"
        },
        query: {
          type: "string",
          description: "Search keyword for product search"
        },
        minPrice: {
          type: "number",
          description: "Minimum price filter for product search"
        },
        maxPrice: {
          type: "number",
          description: "Maximum price filter for product search"
        },
        orderby: {
          type: "string",
          description: "Sort by: 'date', 'price', 'popularity', 'rating'"
        },
        attributes: {
          type: "object",
          description: "Attribute filters for product search (e.g., {\"voltage\": \"24V\"})"
        },
        reason: {
          type: "string",
          description: "Cancellation reason (optional)"
        },
        quantity: {
          type: "number",
          description: "Quantity to add to cart (default: 1)"
        },
        cartItemKey: {
          type: "string",
          description: "Cart item key for removal/update"
        },
        domain: {
          type: "string",
          description: "Store domain for URL generation"
        },
        page: {
          type: "number",
          description: "Page number for pagination (1-indexed, default: 1)",
          default: 1,
          minimum: 1
        },
        per_page: {
          type: "number",
          description: "Results per page (default: 20, max: 100)",
          default: 20,
          minimum: 1,
          maximum: 100
        },
        offset: {
          type: "number",
          description: "Number of results to skip (alternative to page-based pagination)",
          minimum: 0
        }
      },
      required: ["operation"]
    }
  }
};
