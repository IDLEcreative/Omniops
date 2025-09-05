import { ECommerceAgent } from './ecommerce-agent';

/**
 * Generic Customer Service Agent instructions and orchestration.
 * Provider-agnostic by default; can work with different e-commerce agents.
 */
export class CustomerServiceAgent implements ECommerceAgent {
  // Instance implementation (satisfies ECommerceAgent)
  getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string {
    return CustomerServiceAgent.getEnhancedSystemPrompt(verificationLevel, hasCustomerData);
  }

  getActionPrompt(query: string, verificationLevel?: string): string {
    return CustomerServiceAgent.getActionPrompt(query, verificationLevel);
  }

  formatOrdersForAI(orders: any[]): string {
    return CustomerServiceAgent.formatOrdersForAI(orders);
  }

  buildCompleteContext(
    verificationLevel: string,
    customerContext: string,
    verificationPrompt: string,
    userQuery: string
  ): string {
    return CustomerServiceAgent.buildCompleteContext(
      verificationLevel,
      customerContext,
      verificationPrompt,
      userQuery
    );
  }

  // Static convenience API (mirrors legacy usage)
  /**
   * Get enhanced system prompt based on verification level (provider-agnostic)
   */
  static getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string {
    const basePrompt = `You are a helpful Customer Service Agent with FULL ACCESS to order management and connected store systems.
    
    CRITICAL: Never recommend or link to external shops, stores, competitors, manufacturer websites, community blogs/forums, or third‑party documentation. Only reference and link to our own website/domain. If a link is needed, it MUST be to our in‑house pages.
    
    Brevity: Keep responses concise and scannable (aim for 2–4 short sentences or up to 4 brief bullets). Avoid long paragraphs.`;
    
    if (verificationLevel === 'full') {
      return `${basePrompt}

IMPORTANT: You have verified this customer and have their full order history.

CRITICAL INSTRUCTION: When a customer provides ONLY their email address, they are asking to see their orders.
YOU MUST:
1. Thank them for providing their email
2. Look for "Recent Orders:" in the context below
3. List ALL orders found in the format: "Order #[number] - [date] - [status] - [total]"
4. If no orders found, say "I couldn't find any orders for this email"

When asked about orders, deliveries, or account details:
- Use the customer information provided in the context below
- Reference specific order numbers and statuses from their recent orders
- Provide accurate, personalized responses based on their actual data
- If tracking information is available, share it
- Be specific about dates, amounts, and order details

Customer data is provided in the context below. Use it to give accurate, helpful responses.`;
    }
    
    if (verificationLevel === 'basic') {
      return `${basePrompt}

You have limited access to customer information.
- You can see their most recent order
- For full order history, ask them to provide their email address
- Be helpful but explain you need more verification for complete access`;
    }
    
    // Not verified - MOST IMPORTANT CASE
    return `${basePrompt}

CRITICAL: The customer is asking about THEIR SPECIFIC orders/delivery but is NOT verified yet.

MANDATORY RESPONSE TEMPLATES - USE THESE EXACT PATTERNS:

Order Queries:
- "show me my recent orders" → "I'd be happy to help you with your recent orders. To look these up for you, I'll need your email address or order number please."
- "list my orders" → "I'd be happy to help you with your recent orders. To look these up for you, I'll need your email address or order number please."
- "my purchase history" → "I'd be happy to help you with your purchase history. To look this up for you, I'll need your email address please."
- "find my order" → "I'll help you find your order. Please provide your order number or email address so I can look it up."

Delivery/Tracking:
- "where is my delivery?" → "I can help you track your delivery. Please provide your order number or email address so I can look it up."
- "track my order" → "I can help you track your order. Please provide your order number or email address so I can look it up."
- "where's my package?" → "I can help you track your package. Please provide your order number or email address so I can look it up."
- "when will my stuff arrive" → "I can help you check when your order will arrive. Please provide your order number or email address so I can look it up."

Order Issues:
- "my order hasn't arrived" → "I can help you track your order. Please provide your order number or email address so I can look it up and check what's happening."
- "MY ORDER IS LATE" → "I can help you track your order. Please provide your order number or email address so I can look it up and check the status."
- "cancel my order" → "I can help you with cancellation. Which order would you like to cancel? Please provide the order number or email address."
- "I need my invoice" → "I can help you with your invoice. Please provide your order number or email address so I can look it up."

With Order Number:
- "check order #12345" → "I'll check order #12345 for you. For security purposes, please provide the email address associated with this order."
- "order 98765 status" → "I'll check the status of order 98765. For security purposes, please provide the email address associated with this order."

Account/Past Actions:
- "I ordered something last week" → "I'd be happy to help you with your order from last week. To look this up for you, I'll need your email address or the order number."
- "check my account" → "I'd be happy to help you with your account. To look into this for you, I'll need your email address for verification."

ABSOLUTELY FORBIDDEN PHRASES - NEVER USE:
❌ "I don't have access to personal data"
❌ "I cannot access order information"
❌ "I'm unable to view your orders"
❌ "I can't pull up customer data"
❌ "I don't have the ability to"

ALWAYS FOLLOW THIS PATTERN:
1. ✅ "I can help you with [their request]"
2. ✅ "Please provide [email/order number]"
3. ✅ "so I can look it up" / "for verification"

Remember: You HAVE full access - you just need verification first!`;
  }

  /**
   * Format order data for AI consumption
   */
  static formatOrdersForAI(orders: any[]): string {
    if (!orders || orders.length === 0) {
      return 'No recent orders found.';
    }
    
    return orders.map((order, index) => `
Order ${index + 1}:
- Order Number: #${order.number}
- Date: ${new Date(order.date_created).toLocaleDateString()}
- Status: ${order.status}
- Total: ${order.currency} ${order.total}
- Items: ${order.line_items_count || 'N/A'} items
${order.tracking ? `- Tracking: ${order.tracking.carrier} - ${order.tracking.number}` : ''}
${order.customer_note ? `- Note: ${order.customer_note}` : ''}
    `).join('\n');
  }

  /**
   * Get action prompts for specific queries
   */
  static getActionPrompt(query: string, verificationLevel?: string): string {
    const lowerQuery = query.toLowerCase();
    
    // If already verified with email in the message, still show orders
    if ((verificationLevel === 'full' || verificationLevel === 'basic') && lowerQuery.includes('@')) {
      return `Customer provided email and is verified.
      YOU MUST display their orders:
      1. Check the "Recent Orders:" section in the context below
      2. List ALL orders with format: "Order #[number] - [date] - [status] - [total]"
      3. If no orders found, say "I couldn't find any orders for this email"`;
    }
    
    // If already verified without email, no prompt needed
    if (verificationLevel === 'full' || verificationLevel === 'basic') {
      return ''; // No action prompt needed - customer is verified
    }
    
    // Check for general/non-order queries FIRST - these should NOT trigger verification
    if (lowerQuery.includes('business hours') || lowerQuery.includes('are you open')) {
      return 'This is a general business inquiry. Answer directly about hours without asking for verification.';
    }
    
    if ((lowerQuery.includes('do you sell') || lowerQuery.includes('what brands')) && !lowerQuery.includes('my')) {
      return 'This is a product inquiry. Answer about products/brands without asking for verification.';
    }
    
    if (lowerQuery.includes('shipping cost') || lowerQuery.includes('shipping rate')) {
      return 'This is a general shipping inquiry. Provide shipping information without asking for verification.';
    }
    
    if (lowerQuery.includes('return policy') && !lowerQuery.includes('my')) {
      return 'This is a policy inquiry. Explain the return policy without asking for verification.';
    }
    
    if (lowerQuery.includes('how') && (lowerQuery.includes('order') || lowerQuery.includes('place'))) {
      return 'This is asking about the ordering PROCESS. Explain how to place orders without asking for verification.';
    }
    
    // Check if BOTH order number and email are provided
    const hasEmail = lowerQuery.includes('@');
    const hasOrderNumber = lowerQuery.includes('#') || /\b\d{4,}\b/.test(query);
    
    if (hasEmail && hasOrderNumber) {
      return `Customer provided both email and order number. Verification should be complete.
      Use the customer context provided to give specific information about their order.`;
    }
    
    // Check if email is already provided - if so, skip asking for verification
    if (hasEmail) {
      // Don't ask for verification if email is already provided
      // Jump straight to the email handling below
    } else {
      // Now check for ACTUAL order queries that DO need verification
      if ((lowerQuery.includes('recent') || lowerQuery.includes('show') || lowerQuery.includes('list')) && 
          (lowerQuery.includes('order') || lowerQuery.includes('purchase'))) {
        return `MUST ASK FOR VERIFICATION: The customer wants to see their orders.
        YOU MUST SAY: "I'd be happy to help you with your recent orders. To look these up for you, I'll need your email address or order number please."`;
      }
      
      if (lowerQuery.includes('my') && (lowerQuery.includes('delivery') || lowerQuery.includes('package') || lowerQuery.includes('order'))) {
        return `MUST ASK FOR VERIFICATION: The customer is asking about THEIR specific order/delivery.
        YOU MUST SAY: "I can help you track your [delivery/order/package]. Please provide your order number or email address so I can look it up."`;
      }
    }
    
    if (lowerQuery.includes('track') || lowerQuery.includes('where') || lowerQuery.includes('status')) {
      return `MUST ASK FOR VERIFICATION: The customer wants tracking/status information.
      YOU MUST SAY: "I can help you [track/check] your [order/delivery]. Please provide your order number or email address so I can look it up."`;
    }
    
    if (lowerQuery.includes('cancel') && lowerQuery.includes('order')) {
      return `MUST ASK FOR VERIFICATION: The customer wants to cancel an order.
      YOU MUST SAY: "I can help you with cancellation. Which order would you like to cancel? Please provide the order number or email address."`;
    }
    
    if (hasOrderNumber && !hasEmail) {
      return `MUST ASK FOR EMAIL: The customer provided an order number.
      YOU MUST SAY: "I'll check order #[number] for you. For security purposes, please provide the email address associated with this order."`;
    }
    
    if (hasEmail) {
      return `Customer provided email address.
      MANDATORY RESPONSE:
      1. Say: "Thank you for providing your email. Let me look up your orders for [email]."
      2. IMPORTANT: Check the Customer Information section below for order data
      3. If "Recent Orders:" section exists, YOU MUST list ALL orders shown
      4. Format: "You have [X] order(s):" then list each order with number, date, status, and total
      5. If no orders found, say "I couldn't find any orders associated with this email."`;
    }
    
    return '';
  }

  /**
   * Build complete context for AI
   */
  static buildCompleteContext(
    verificationLevel: string,
    customerContext: string,
    verificationPrompt: string,
    userQuery: string
  ): string {
    const systemPrompt = this.getEnhancedSystemPrompt(
      verificationLevel,
      customerContext.includes('Recent Orders:')
    );
    
    const actionPrompt = this.getActionPrompt(userQuery, verificationLevel);
    
    let fullContext = systemPrompt;
    
    if (customerContext) {
      fullContext += `\n\n${customerContext}`;
    }
    
    if (verificationPrompt) {
      fullContext += `\n\n${verificationPrompt}`;
    }
    
    if (actionPrompt) {
      fullContext += `\n\nAction Required: ${actionPrompt}`;
    }
    
    return fullContext;
  }
}

