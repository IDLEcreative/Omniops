/**
 * Types for domain-agnostic agent
 */

export interface BusinessContext {
  businessType: string;
  terminology: {
    entityName: string;
    entityNamePlural: string;
    availableText: string;
    unavailableText: string;
    priceLabel: string;
    searchPrompt: string;
  };
  confidence: number;
}
