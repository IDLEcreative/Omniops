/**
 * Product recommendation context and query detection for customer service chatbot
 * Extracted from main chat route for better maintainability and performance
 */

export class ProductRecommendationContext {
  /**
   * Get product recommendation guidelines for system context
   */
  static getProductGuidelines(): string {
    return `
PRODUCT RECOMMENDATION GUIDELINES:
When customers ask about products or parts:
1. Keep It Concise: 1 line per option, max 3 options, and 1 category link.
2. In‑House Only: Only link to our domain. Never link to external sites.
3. Always Include Category: If the request maps to a product category (e.g. "Body Fillers & Stoppers"), include a clear "Browse the category" link so the customer can shop themselves.
4. Ask One Clarifying Question: If the request is non‑specific or could mean multiple items, ask a single follow‑up question to narrow choice (e.g. size, brand, material, colour/finish, kit vs single, usage).
5. Structure:
   - Start with the best/most popular option
   - Add 1–2 viable alternatives
   - End with: "Browse all [Category Name](url)"
6. Suggested Format:
   For your [need], I recommend:

   • [Option 1] – short reason [link]
   • [Option 2] – short reason [link]
   • [Option 3] – short reason [link]

   Browse all [Category Name](url)

7. Clarifying Question Examples (ask one if needed):
   - "Are you after [subcategory A] or [subcategory B]?"
   - "Any brand preference or size (e.g. 250ml, 1L)?"
   - "Is this for [use case], and do you need [finish/spec]?"`;
  }

  /**
   * Detect if a message is asking about products/parts and should get recommendation guidelines
   */
  static shouldApplyGuidelines(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    
    // Product-related keywords that indicate recommendation requests
    const productKeywords = [
      'product', 'part', 'parts', 'item', 'items',
      'buy', 'purchase', 'order', 'get', 'need', 'want',
      'looking for', 'search for', 'find',
      'recommend', 'suggestion', 'suggest', 'advice',
      'equipment', 'device', 'engine', 'filter', 'seal', 'component', 'accessory',
      'compatible', 'fits', 'works with',
      'best', 'good', 'suitable', 'right'
    ];
    
    // Question patterns that indicate product inquiries
    const questionPatterns = [
      /do you (have|sell|stock)/,
      /what.*do you recommend/,
      /which.*should i/,
      /what.*best for/,
      /need.*for my/,
      /looking for.*part/,
      /part.*for/,
      /compatible.*with/
    ];
    
    // Check for product keywords
    const hasProductKeyword = productKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );
    
    // Check for question patterns
    const hasQuestionPattern = questionPatterns.some(pattern => 
      pattern.test(lowerMessage)
    );
    
    // Exclude general inquiries that aren't product-specific
    const generalInquiries = [
      'business hours', 'opening hours', 'contact', 'phone', 'email',
      'shipping cost', 'delivery cost', 'return policy', 'warranty',
      'how to order', 'payment methods', 'account'
    ];
    
    const isGeneralInquiry = generalInquiries.some(inquiry => 
      lowerMessage.includes(inquiry)
    );
    
    return (hasProductKeyword || hasQuestionPattern) && !isGeneralInquiry;
  }

  /**
   * Get enhanced context for product recommendations
   */
  static buildProductContext(message: string): string {
    if (!this.shouldApplyGuidelines(message)) {
      return '';
    }
    
    return this.getProductGuidelines();
  }
}
