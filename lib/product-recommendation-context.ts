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
When customers ask about specific products or parts:
1. **Keep It Concise**: Use 1 line per option, max 3 options, plus one category link. Avoid long descriptions.
2. **In‑House Only**: Only link to our own website/domain. Do NOT include links to manufacturers, community blogs, forums, PDFs, or any external sites.
3. **Structure Your Response**:
   - Start with the best/most popular recommendation
   - Follow with 1-2 alternative options
   - End with a category link like "Browse our full [Pumps section](url)" or "View all [Mixer Parts](url)"
4. **Use This Format**:
   "For your [specific need], I recommend:
   
   **Option 1:** [Product Name] - [Brief description and link]
   **Option 2:** [Alternative Product] - [Brief description and link]  
   **Option 3:** [Third option if available] - [Brief description and link]
   
   You can also browse our complete [Category Name](url) section to see all available options."`;
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
      'pump', 'mixer', 'engine', 'filter', 'seal',
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
