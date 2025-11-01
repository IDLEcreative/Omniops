/**
 * Entity Storage Utilities
 * Functions for storing and processing extracted entities
 */

import { BusinessClassification } from '../business-classifier';

/**
 * Parse availability based on business type
 * Converts various availability formats to boolean
 */
export function parseAvailability(
  value: any,
  classification: BusinessClassification
): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return true; // Default to available

  const valueStr = String(value).toLowerCase();
  const unavailableTerms = [
    'sold', 'unavailable', 'booked', 'closed',
    'out of stock', 'not available', 'coming soon'
  ];

  return !unavailableTerms.some(term => valueStr.includes(term));
}

/**
 * Extract custom attributes based on business type
 * Filters out core fields and returns business-specific attributes
 */
export function extractAttributes(data: any, schema: any): any {
  const attributes: any = {};

  // Get all fields that aren't core fields
  const coreFields = [
    'name', 'description', 'primary_category', 'tags',
    schema.identifierField, schema.priceField, schema.availabilityField
  ];

  for (const [key, value] of Object.entries(data)) {
    if (!coreFields.includes(key) && value !== null && value !== undefined) {
      attributes[key] = value;
    }
  }

  return attributes;
}

/**
 * Calculate extraction confidence score
 * Scores based on presence of core fields and additional data
 */
export function calculateConfidence(data: any): number {
  let score = 0;
  let fields = 0;

  // Check core fields
  if (data.name) { score += 2; fields += 2; }
  if (data.description) { score += 1; fields += 1; }
  if (data.price || data.fee || data.rate) { score += 1; fields += 1; }

  // Check for any additional data
  const hasAttributes = Object.keys(data).length > 5;
  if (hasAttributes) { score += 1; fields += 1; }

  return fields > 0 ? score / fields : 0;
}

/**
 * Build entity object for storage in catalog
 * Maps extracted data to flexible entity catalog schema
 */
export function buildEntityForStorage(
  page: any,
  extracted: any,
  classification: BusinessClassification
): any {
  const schema = classification.suggestedSchema;
  const terminology = classification.terminology;

  return {
    page_id: page.id,
    domain_id: page.domain_id,
    entity_type: terminology.entityName,
    name: extracted.name || 'Unnamed ' + terminology.entityName,
    description: extracted.description,
    primary_identifier: extracted[schema.identifierField],
    price: extracted[schema.priceField],
    price_unit: extracted.price_unit,
    is_available: parseAvailability(
      extracted[schema.availabilityField],
      classification
    ),
    availability_status: extracted[schema.availabilityField],
    primary_category: extracted.primary_category,
    tags: extracted.tags || [],

    // Store all other fields in attributes
    attributes: extractAttributes(extracted, schema),

    // Metadata
    extraction_method: 'gpt4_adaptive',
    confidence_score: calculateConfidence(extracted),
    raw_data: extracted
  };
}
