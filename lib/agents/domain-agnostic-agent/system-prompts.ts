/**
 * System prompt generation for domain-agnostic agent
 */

import type { BusinessContext } from './types';

/**
 * Get system prompt adapted to business type
 */
export function getAdaptiveSystemPrompt(
  businessContext: BusinessContext,
  hasCustomerData: boolean = false
): string {
  const { businessType, terminology } = businessContext;

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

  prompt += `\nConfidence Level: ${(businessContext.confidence * 100).toFixed(0)}% certain about business type.`;

  return prompt;
}

/**
 * Get action prompt adapted to query and business type
 */
export function getAdaptiveActionPrompt(
  businessContext: BusinessContext,
  query: string
): string {
  const { terminology } = businessContext;
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
