/**
 * Action prompts for specific query types
 */

/**
 * Get action prompts for specific queries
 */
export function getActionPrompt(query: string, verificationLevel?: string): string {
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
