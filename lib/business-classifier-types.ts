/**
 * Business Classifier Types
 * Type definitions for business classification system
 */

export interface BusinessClassification {
  primaryType: BusinessType;
  confidence: number;
  indicators: string[];
  suggestedSchema: EntitySchema;
  extractionStrategy: ExtractionStrategy;
  terminology: BusinessTerminology;
}

export enum BusinessType {
  ECOMMERCE = 'ecommerce',
  REAL_ESTATE = 'real_estate',
  HEALTHCARE = 'healthcare',
  LEGAL = 'legal',
  EDUCATION = 'education',
  RESTAURANT = 'restaurant',
  AUTOMOTIVE = 'automotive',
  FINANCIAL = 'financial',
  HOSPITALITY = 'hospitality',
  PROFESSIONAL_SERVICES = 'professional_services',
  UNKNOWN = 'unknown'
}

export interface EntitySchema {
  primaryEntity: string;        // 'product', 'property', 'service', etc.
  identifierField: string;      // 'sku', 'mls_number', 'service_id', etc.
  availabilityField: string;    // 'in_stock', 'available', 'accepting_patients'
  priceField: string;           // 'price', 'rent', 'fee', 'tuition'
  customFields: Record<string, string>;
}

export interface ExtractionStrategy {
  priorityFields: string[];
  patterns: Record<string, RegExp>;
  specialProcessing: string[];
}

export interface BusinessTerminology {
  entityName: string;          // What to call items: products, properties, services
  entityNamePlural: string;
  availableText: string;       // "in stock", "available", "open"
  unavailableText: string;     // "out of stock", "sold", "closed"
  priceLabel: string;          // "price", "rent", "fee"
  searchPrompt: string;        // "Search products", "Find properties"
}
