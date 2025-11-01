/**
 * Entity formatting for different business types
 */

import type { BusinessContext } from './types';

/**
 * Format entities for AI response based on business type
 */
export function formatEntitiesForAI(
  businessContext: BusinessContext,
  entities: any[]
): string {
  const { businessType, terminology } = businessContext;

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
