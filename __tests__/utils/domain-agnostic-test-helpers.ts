/**
 * Domain-Agnostic Agent Test Helpers
 * Shared utilities for testing multi-tenant business type support
 */

import { DomainAgnosticAgent } from '@/lib/agents/domain-agnostic-agent';

export interface MockSupabaseClient {
  from: jest.Mock;
}

export interface EntityTerminology {
  entityName: string;
  entityNamePlural: string;
  availableText: string;
  unavailableText: string;
  priceLabel: string;
  searchPrompt: string;
}

export interface BusinessTypeConfig {
  business_type: string;
  entity_terminology: EntityTerminology;
  confidence: number;
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient(): MockSupabaseClient {
  return {
    from: jest.fn(),
  };
}

/**
 * Configure mock Supabase to return specific business type configuration
 */
export function mockBusinessTypeConfig(
  mockSupabase: MockSupabaseClient,
  config: BusinessTypeConfig
): void {
  mockSupabase.from.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: config
        })
      })
    })
  });
}

/**
 * Initialize agent with business type configuration
 */
export async function initializeAgentWithBusinessType(
  agent: DomainAgnosticAgent,
  mockSupabase: MockSupabaseClient,
  businessType: string,
  terminology: EntityTerminology,
  confidence: number = 0.9
): Promise<void> {
  mockBusinessTypeConfig(mockSupabase, {
    business_type: businessType,
    entity_terminology: terminology,
    confidence
  });

  await agent.initializeForDomain(`${businessType}-domain`);
}

/**
 * Standard terminology presets for common business types
 */
export const STANDARD_TERMINOLOGY = {
  ecommerce: {
    entityName: 'product',
    entityNamePlural: 'products',
    availableText: 'in stock',
    unavailableText: 'out of stock',
    priceLabel: 'price',
    searchPrompt: 'Search products'
  },
  education: {
    entityName: 'course',
    entityNamePlural: 'courses',
    availableText: 'open for enrollment',
    unavailableText: 'closed',
    priceLabel: 'tuition',
    searchPrompt: 'Search courses'
  },
  legal: {
    entityName: 'service',
    entityNamePlural: 'services',
    availableText: 'available',
    unavailableText: 'unavailable',
    priceLabel: 'consultation fee',
    searchPrompt: 'Browse legal services'
  },
  automotive: {
    entityName: 'vehicle',
    entityNamePlural: 'vehicles',
    availableText: 'available',
    unavailableText: 'sold',
    priceLabel: 'price',
    searchPrompt: 'Browse inventory'
  },
  general: {
    entityName: 'item',
    entityNamePlural: 'items',
    availableText: 'available',
    unavailableText: 'unavailable',
    priceLabel: 'price',
    searchPrompt: 'Search'
  }
};

/**
 * Create sample entity data for testing
 */
export function createSampleEntity(
  name: string,
  price: number,
  isAvailable: boolean,
  attributes?: Record<string, any>
): any {
  return {
    name,
    price,
    is_available: isAvailable,
    attributes
  };
}
