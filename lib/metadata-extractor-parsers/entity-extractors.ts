/**
 * Entity Extraction Functions
 */

import type { EnhancedEmbeddingMetadata, QAPair } from '../metadata-extractor-types';

/**
 * Extract named entities (products, brands, models, SKUs)
 */
export function extractEntities(text: string): EnhancedEmbeddingMetadata['entities'] {
  const entities: EnhancedEmbeddingMetadata['entities'] = {};

  // SKU patterns
  const skuPattern = /\b(?:SKU[\s]?[\d]+|(?:[A-Z]{2,}[-])?[A-Z]{2,}[\d]+(?:[-\/][A-Z0-9]+)*(?:-V\d+)?)\b/gi;
  const skus = text.match(skuPattern);
  if (skus) {
    entities.skus = [...new Set(skus.map(s => s.toUpperCase()))];
  }

  // Model numbers
  const modelPattern = /\b(?:model\s+)?([A-Z]{1,}[\-]?[\d]{2,}[\w\-]*)\b/gi;
  const models = [];
  let match;
  while ((match = modelPattern.exec(text)) !== null) {
    if (match[1]) {
      models.push(match[1].toUpperCase());
    }
  }
  if (models.length > 0) {
    entities.models = [...new Set(models)];
  }

  // Common brand detection
  const brandPatterns = [
    'Samsung', 'Apple', 'Sony', 'Microsoft', 'Google', 'Amazon',
    'Bosch', 'Makita', 'DeWalt', 'Milwaukee', 'Ryobi',
    'Ford', 'Toyota', 'Honda', 'BMW', 'Mercedes'
  ];
  const foundBrands = brandPatterns.filter(brand =>
    new RegExp(`\\b${brand}\\b`, 'i').test(text)
  );
  if (foundBrands.length > 0) {
    entities.brands = foundBrands;
  }

  // Product names
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (properNouns) {
    const nounCounts = new Map<string, number>();
    properNouns.forEach(noun => {
      nounCounts.set(noun, (nounCounts.get(noun) || 0) + 1);
    });
    const products = Array.from(nounCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([noun]) => noun);
    if (products.length > 0) {
      entities.products = products.slice(0, 5);
    }
  }

  return entities;
}

/**
 * Extract Q&A pairs from text
 */
export function extractQAPairs(text: string): QAPair[] {
  const pairs: QAPair[] = [];

  // Pattern 1: Q: ... A: ... format
  const qaPattern1 = /Q:\s*(.+?)\s*A:\s*(.+?)(?=Q:|$)/gis;
  let match;
  while ((match = qaPattern1.exec(text)) !== null) {
    if (match[1] && match[2]) {
      pairs.push({
        question: match[1].trim().replace(/\n+/g, ' '),
        answer: match[2].trim().replace(/\n+/g, ' ')
      });
    }
  }

  // Pattern 2: Question? Answer format (FAQ style)
  if (pairs.length === 0) {
    const qaPattern2 = /([^.!?\n]+\?)\s*([^?]+?)(?=\n[^.!?\n]+\?|$)/gis;
    while ((match = qaPattern2.exec(text)) !== null) {
      if (match[1] && match[2]) {
        pairs.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
      }
    }
  }

  // Pattern 3: Numbered FAQ format
  if (pairs.length === 0) {
    const qaPattern3 = /\d+\.\s*([^.!?\n]+\?)\s*([^?]+?)(?=\d+\.|$)/gis;
    while ((match = qaPattern3.exec(text)) !== null) {
      if (match[1] && match[2]) {
        pairs.push({
          question: match[1].trim(),
          answer: match[2].trim()
        });
      }
    }
  }

  return pairs.slice(0, 10);
}

/**
 * Extract contact information from text
 */
export function extractContactInfo(text: string): {
  email?: string;
  phone?: string;
  address?: string
} | undefined {
  const result: { email?: string; phone?: string; address?: string } = {};

  // Extract email addresses
  const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}/gi;
  const emails = text.match(emailPattern);
  if (emails && emails.length > 0) {
    result.email = emails[0].toLowerCase();
  }

  // Extract phone numbers
  const phonePatterns = [
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    /\+?[0-9]{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g
  ];

  for (const pattern of phonePatterns) {
    const phones = text.match(pattern);
    if (phones && phones.length > 0) {
      const cleaned = phones[0].replace(/[^\d+]/g, '');
      if (cleaned.length >= 10) {
        result.phone = phones[0];
        break;
      }
    }
  }

  // Extract address
  const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)/gi;
  const addresses = text.match(addressPattern);
  if (addresses && addresses.length > 0) {
    result.address = addresses[0];
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
