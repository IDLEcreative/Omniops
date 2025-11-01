/**
 * Types for customer service agent
 */

export interface ECommerceAgent {
  getEnhancedSystemPrompt(verificationLevel: string, hasCustomerData: boolean): string;
  getActionPrompt(query: string, verificationLevel?: string): string;
  formatOrdersForAI(orders: any[]): string;
  buildCompleteContext(
    verificationLevel: string,
    customerContext: string,
    verificationPrompt: string,
    userQuery: string
  ): string;
}
