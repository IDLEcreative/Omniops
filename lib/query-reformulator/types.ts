/**
 * Query Reformulator - Type Definitions
 */

export interface Message {
  role: string;
  content: string;
}

export interface ReformulatedQuery {
  original: string;
  reformulated: string;
  confidence: number;
  strategy: 'direct' | 'contextual' | 'continuation' | 'clarification';
  context?: string[];
}

export interface Entities {
  products: string[];
  categories: string[];
  specifications: string[];
  useCases: string[];
}
