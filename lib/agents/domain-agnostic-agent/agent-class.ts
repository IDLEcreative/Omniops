/**
 * Domain-Agnostic Customer Service Agent
 * Adapts to any business type using detected classification
 */

import { createServiceRoleClientSync } from '@/lib/supabase/server';
import type { BusinessContext } from './types';
import { getAdaptiveSystemPrompt, getAdaptiveActionPrompt } from './system-prompts';
import { formatEntitiesForAI } from './entity-formatter';

export class DomainAgnosticAgent {
  private supabase: any;
  private businessContext: BusinessContext | null = null;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createServiceRoleClientSync();
  }

  /**
   * Initialize agent with business context for a domain
   */
  async initializeForDomain(domainId: string): Promise<void> {
    // Get business classification
    const { data: classification } = await this.supabase
      .from('business_classifications')
      .select('business_type, entity_terminology, confidence')
      .eq('domain_id', domainId)
      .single();

    if (classification && classification !== null) {
      this.businessContext = {
        businessType: (classification as any).business_type,
        terminology: (classification as any).entity_terminology,
        confidence: (classification as any).confidence
      };
    } else {
      // Default context if not classified
      this.businessContext = {
        businessType: 'general',
        terminology: {
          entityName: 'item',
          entityNamePlural: 'items',
          availableText: 'available',
          unavailableText: 'unavailable',
          priceLabel: 'price',
          searchPrompt: 'Search our offerings'
        },
        confidence: 0.5
      };
    }
  }

  /**
   * Get system prompt adapted to business type
   */
  getAdaptiveSystemPrompt(hasCustomerData: boolean = false): string {
    if (!this.businessContext) {
      throw new Error('Must initialize with domain first');
    }

    return getAdaptiveSystemPrompt(this.businessContext, hasCustomerData);
  }

  /**
   * Get action prompt adapted to query and business type
   */
  getAdaptiveActionPrompt(query: string): string {
    if (!this.businessContext) {
      throw new Error('Must initialize with domain first');
    }

    return getAdaptiveActionPrompt(this.businessContext, query);
  }

  /**
   * Format entities for AI response based on business type
   */
  formatEntitiesForAI(entities: any[]): string {
    if (!this.businessContext) {
      throw new Error('Must initialize with domain first');
    }

    return formatEntitiesForAI(this.businessContext, entities);
  }

  /**
   * Build complete context for the agent
   */
  buildAdaptiveContext(
    customerContext: string,
    userQuery: string,
    searchResults: any[]
  ): string {
    if (!this.businessContext) {
      throw new Error('Must initialize with domain first');
    }

    const { terminology } = this.businessContext;

    const context = `## System Instructions
${this.getAdaptiveSystemPrompt(!!customerContext)}

## Customer Context
${customerContext || 'No customer data available'}

## User Query
${userQuery}

## Available ${terminology.entityNamePlural}
${this.formatEntitiesForAI(searchResults)}

## Your Task
${this.getAdaptiveActionPrompt(userQuery)}

Remember to:
- Use the term "${terminology.entityNamePlural}" consistently
- Say items are "${terminology.availableText}" not "in stock" (unless this is e-commerce)
- Use "${terminology.priceLabel}" not "price" (unless that's the correct term)
- Maintain a helpful, professional tone appropriate for a ${this.businessContext.businessType} business`;

    return context;
  }
}
