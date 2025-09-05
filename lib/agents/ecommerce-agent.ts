/**
 * Common interface for e-commerce provider agents
 * Allows Customer Service Agent to delegate provider-specific logic
 */
export interface ECommerceAgent {
  /**
   * Provider-specific or generic enhanced system prompt builder
   */
  getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string;

  /**
   * Action prompt based on user query and verification state
   */
  getActionPrompt(query: string, verificationLevel?: string): string;

  /**
   * Helper to format orders for LLM consumption
   */
  formatOrdersForAI(orders: any[]): string;

  /**
   * Build the full context block supplied to the LLM
   */
  buildCompleteContext(
    verificationLevel: string,
    customerContext: string,
    verificationPrompt: string,
    userQuery: string
  ): string;
}

