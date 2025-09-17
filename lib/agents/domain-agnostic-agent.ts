/**
 * Domain-Agnostic Customer Service Agent
 * Adapts to any business type using detected classification
 */

import { createClient } from '@supabase/supabase-js';

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

export class DomainAgnosticAgent {
  private supabase: ReturnType<typeof createClient>;
  private businessContext: BusinessContext | null = null;
  
  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
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
    
    if (classification) {
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
    
    const { businessType, terminology } = this.businessContext;
    
    // Base prompt that works for any business
    let prompt = `You are a helpful Customer Service Agent for a ${businessType} business.
    
CRITICAL: Never recommend or link to external competitors or third-party sites. Only reference our own website/domain.

${terminology.entityName} Query Philosophy:
- When customers ask about ${terminology.entityNamePlural}, ALWAYS show what's ${terminology.availableText} first
- NEVER ask "which type do you need?" before showing options
- If customer is vague, present ALL relevant ${terminology.entityNamePlural} immediately
- Customers can't choose from options they don't know exist - show them what we have
- Only ask for clarification AFTER showing ${terminology.entityNamePlural}, if truly necessary

Response Guidelines:
- Use natural, conversational language
- Be helpful and informative
- Show enthusiasm about our ${terminology.entityNamePlural}
- Use the term "${terminology.entityNamePlural}" not "products" or generic terms\n\n`;
    
    // Add business-specific instructions
    switch (businessType) {
      case 'ecommerce':
        prompt += `E-commerce Specific:
- Mention shipping and delivery options
- Include return policy when relevant
- Highlight any current promotions
- Provide SKUs for easy ordering\n\n`;
        break;
        
      case 'real_estate':
        prompt += `Real Estate Specific:
- Provide property details (bedrooms, bathrooms, square footage)
- Mention neighborhood and school district information
- Offer to schedule viewings
- Include MLS numbers for reference\n\n`;
        break;
        
      case 'healthcare':
        prompt += `Healthcare Specific:
- Mention accepted insurance plans
- Provide office hours and appointment availability
- Include provider credentials and specialties
- Be sensitive to health concerns\n\n`;
        break;
        
      case 'education':
        prompt += `Education Specific:
- Include course prerequisites and credit hours
- Mention enrollment deadlines
- Provide instructor information
- Highlight learning outcomes\n\n`;
        break;
        
      case 'restaurant':
        prompt += `Restaurant Specific:
- Mention dietary options (vegan, gluten-free, etc.)
- Include hours of operation
- Offer reservation options
- Highlight daily specials\n\n`;
        break;
        
      case 'legal':
        prompt += `Legal Services Specific:
- Mention practice areas clearly
- Offer consultation scheduling
- Maintain professional tone
- Avoid giving specific legal advice\n\n`;
        break;
        
      case 'automotive':
        prompt += `Automotive Specific:
- Include vehicle specifications (make, model, year, mileage)
- Mention financing options
- Offer test drive scheduling
- Provide VIN numbers when available\n\n`;
        break;
        
      default:
        prompt += `General Business:
- Focus on our services and offerings
- Provide contact information when relevant
- Be professional and helpful\n\n`;
    }
    
    // Add confidence-based instructions
    if (hasCustomerData) {
      prompt += `Customer Data Available: You have access to customer information. Use it to personalize responses.\n`;
    }
    
    prompt += `\nConfidence Level: ${(this.businessContext.confidence * 100).toFixed(0)}% certain about business type.`;
    
    return prompt;
  }
  
  /**
   * Get action prompt adapted to query and business type
   */
  getAdaptiveActionPrompt(query: string): string {
    if (!this.businessContext) {
      throw new Error('Must initialize with domain first');
    }
    
    const { terminology } = this.businessContext;
    const queryLower = query.toLowerCase();
    
    // Detect query intent
    if (queryLower.includes('available') || queryLower.includes('in stock') || 
        queryLower.includes('have') || queryLower.includes('show')) {
      return `Show ${terminology.availableText} ${terminology.entityNamePlural} that match: "${query}"`;
    }
    
    if (queryLower.includes('price') || queryLower.includes('cost') || 
        queryLower.includes('how much')) {
      return `Provide ${terminology.priceLabel} information for: "${query}"`;
    }
    
    if (queryLower.includes('hours') || queryLower.includes('open') || 
        queryLower.includes('schedule')) {
      return `Provide business hours and availability for: "${query}"`;
    }
    
    if (queryLower.includes('contact') || queryLower.includes('phone') || 
        queryLower.includes('email')) {
      return `Provide contact information`;
    }
    
    // Default action
    return `Help the customer with their inquiry about: "${query}"`;
  }
  
  /**
   * Format entities for AI response based on business type
   */
  formatEntitiesForAI(entities: any[]): string {
    if (!this.businessContext) {
      throw new Error('Must initialize with domain first');
    }
    
    const { businessType, terminology } = this.businessContext;
    
    if (!entities || entities.length === 0) {
      return `No ${terminology.entityNamePlural} found.`;
    }
    
    let formatted = `Found ${entities.length} ${terminology.entityNamePlural}:\n\n`;
    
    entities.forEach((entity, index) => {
      formatted += `${index + 1}. **${entity.name}**\n`;
      
      // Add fields based on business type
      switch (businessType) {
        case 'real_estate':
          if (entity.attributes?.bedrooms) {
            formatted += `   - ${entity.attributes.bedrooms} bedrooms, ${entity.attributes.bathrooms || '?'} bathrooms\n`;
          }
          if (entity.attributes?.square_feet) {
            formatted += `   - ${entity.attributes.square_feet} sq ft\n`;
          }
          if (entity.price) {
            formatted += `   - ${terminology.priceLabel}: $${entity.price.toLocaleString()}\n`;
          }
          if (entity.attributes?.address) {
            formatted += `   - Location: ${entity.attributes.address}\n`;
          }
          break;
          
        case 'healthcare':
          if (entity.attributes?.provider_name) {
            formatted += `   - Provider: ${entity.attributes.provider_name}\n`;
          }
          if (entity.attributes?.specialty) {
            formatted += `   - Specialty: ${entity.attributes.specialty}\n`;
          }
          if (entity.attributes?.insurance_accepted) {
            formatted += `   - Insurance: ${entity.attributes.insurance_accepted.join(', ')}\n`;
          }
          break;
          
        case 'education':
          if (entity.attributes?.course_code) {
            formatted += `   - Course Code: ${entity.attributes.course_code}\n`;
          }
          if (entity.attributes?.instructor) {
            formatted += `   - Instructor: ${entity.attributes.instructor}\n`;
          }
          if (entity.attributes?.credit_hours) {
            formatted += `   - Credits: ${entity.attributes.credit_hours}\n`;
          }
          if (entity.price) {
            formatted += `   - ${terminology.priceLabel}: $${entity.price}\n`;
          }
          break;
          
        default:
          // Generic formatting
          if (entity.primary_identifier) {
            formatted += `   - ID: ${entity.primary_identifier}\n`;
          }
          if (entity.price) {
            formatted += `   - ${terminology.priceLabel}: $${entity.price}\n`;
          }
          if (entity.primary_category) {
            formatted += `   - Category: ${entity.primary_category}\n`;
          }
      }
      
      formatted += `   - Status: ${entity.is_available ? terminology.availableText : terminology.unavailableText}\n`;
      
      if (entity.description) {
        formatted += `   - ${entity.description.substring(0, 100)}...\n`;
      }
      
      formatted += '\n';
    });
    
    return formatted;
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
    
    let context = `## System Instructions
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