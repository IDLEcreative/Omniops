/**
 * Entity Extraction Functions
 * Extract structured entities from content (people, orgs, locations, etc.)
 */

/**
 * Extract entities from content
 */
export function extractEntities(content: string): {
  people: string[];
  organizations: string[];
  locations: string[];
  products: string[];
  dates: string[];
} {
  return {
    people: extractPeople(content),
    organizations: extractOrganizations(content),
    locations: extractLocations(content),
    products: extractProducts(content),
    dates: extractDates(content)
  };
}

/**
 * Extract people names using pattern matching
 */
function extractPeople(content: string): string[] {
  const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
  const matches = content.match(namePattern) || [];
  return [...new Set(matches)];
}

/**
 * Extract organization names
 */
function extractOrganizations(content: string): string[] {
  const orgPattern = /\b(?:[A-Z][a-z]+ )*(?:Inc|Corp|LLC|Ltd|Company|Organization|University|College|Institute)\b/g;
  const matches = content.match(orgPattern) || [];
  return [...new Set(matches)];
}

/**
 * Extract location names
 */
function extractLocations(content: string): string[] {
  const locationPattern = /\b[A-Z][a-z]+(?:, [A-Z][a-z]+)*\b/g;
  const matches = content.match(locationPattern) || [];
  return [...new Set(matches)].filter(loc => loc.length > 3);
}

/**
 * Extract product names
 */
function extractProducts(content: string): string[] {
  const productPatterns = [
    /\b[A-Z][a-zA-Z]+ \d+(?:\.\d+)*\b/, // Product v1.0
    /\b[A-Z][a-zA-Z]*(?:-[A-Z][a-zA-Z]*)*\b/, // Product-Name
    /\b(?:API|SDK|Service|Platform|Tool|App|Software)\b/gi
  ];

  const products = new Set<string>();
  productPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => products.add(match));
  });

  return Array.from(products);
}

/**
 * Extract dates
 */
function extractDates(content: string): string[] {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g, // MM/DD/YYYY
    /\b\d{4}-\d{2}-\d{2}\b/g, // YYYY-MM-DD
    /\b(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}\b/gi
  ];

  const dates = new Set<string>();
  datePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    matches.forEach(match => dates.add(match));
  });

  return Array.from(dates);
}
