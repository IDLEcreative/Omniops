/**
 * Extraction Prompts
 * Business-type-specific prompt generation for entity extraction
 */

import { BusinessType, BusinessClassification } from '../business-classifier';

/**
 * Build extraction prompt based on business type
 * Generates GPT-4 prompt with business-specific fields
 */
export function buildExtractionPrompt(
  page: any,
  classification: BusinessClassification
): string {
  const schema = classification.suggestedSchema;
  const terminology = classification.terminology;

  let promptTemplate = `
Extract structured ${terminology.entityName} information from this webpage.
Return JSON with these fields:

Core fields (always include):
- name: ${terminology.entityName} name
- description: Brief description
- ${schema.identifierField}: Unique identifier (if found)
- ${schema.priceField}: Numeric price/cost (if applicable)
- ${schema.availabilityField}: Availability status
- primary_category: Main category
- tags: Array of relevant tags

`;

  // Add business-specific fields
  switch (classification.primaryType) {
    case BusinessType.REAL_ESTATE:
      promptTemplate += `
Real estate specific:
- bedrooms: Number of bedrooms
- bathrooms: Number of bathrooms
- square_feet: Size in sqft
- lot_size: Lot dimensions
- year_built: Year constructed
- property_type: House/Condo/Apartment
- address: Full address
- amenities: Array of features
`;
      break;

    case BusinessType.HEALTHCARE:
      promptTemplate += `
Healthcare specific:
- provider_name: Doctor/Provider name
- specialty: Medical specialty
- insurance_accepted: Array of accepted insurance
- appointment_duration: Typical appointment length
- languages: Languages spoken
- credentials: Degrees/Certifications
`;
      break;

    case BusinessType.EDUCATION:
      promptTemplate += `
Education specific:
- course_code: Course identifier
- instructor: Teacher/Professor name
- credit_hours: Number of credits
- schedule: Days and times
- prerequisites: Required prior courses
- enrollment_limit: Max students
- format: Online/In-person/Hybrid
`;
      break;

    case BusinessType.RESTAURANT:
      promptTemplate += `
Restaurant specific:
- cuisine_type: Type of cuisine
- meal_type: Breakfast/Lunch/Dinner
- dietary_options: Vegan/Vegetarian/Gluten-free
- ingredients: Key ingredients
- portion_size: Serving size
- spice_level: Mild/Medium/Hot
`;
      break;

    default:
      promptTemplate += `
Additional fields (extract if relevant):
- specifications: Object with any technical details
- features: Array of key features
- dimensions: Size/measurements if applicable
`;
  }

  promptTemplate += `

Page URL: ${page.url}
Page Title: ${page.title}
Page Content: ${page.content?.substring(0, 4000)}

Return ONLY valid JSON matching the structure above.`;

  return promptTemplate;
}
