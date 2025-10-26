/**
 * Parsing functions for metadata extraction
 */

import type { ContentType, EnhancedEmbeddingMetadata, QAPair, PriceRange, Ratings } from './metadata-extractor-types';

/**
 * Classify content type based on patterns and signals
 */
export function classifyContent(chunk: string, url: string, title: string): ContentType {
  const lowerChunk = chunk.toLowerCase();
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  // URL-based classification
  if (lowerUrl.includes('/product') || lowerUrl.includes('/item') || lowerUrl.includes('/shop')) {
    return 'product';
  }
  if (lowerUrl.includes('/faq') || lowerUrl.includes('/questions')) {
    return 'faq';
  }
  if (lowerUrl.includes('/docs') || lowerUrl.includes('/guide') || lowerUrl.includes('/manual')) {
    return 'documentation';
  }
  if (lowerUrl.includes('/blog') || lowerUrl.includes('/news') || lowerUrl.includes('/article')) {
    return 'blog';
  }
  if (lowerUrl.includes('/support') || lowerUrl.includes('/help') || lowerUrl.includes('/contact')) {
    return 'support';
  }

  // Content-based classification
  const productSignals = [
    /\$[\d,]+(\.\d{2})?/g,  // Price patterns
    /price|cost|buy|purchase|order|cart|shipping/i,
    /in stock|out of stock|available|availability/i,
    /sku|model|part number|item/i
  ];

  const faqSignals = [
    /\?[\s\n]*$/gm,  // Questions
    /^q:|^a:|question:|answer:/im,
    /how to|what is|why does|when should/i,
    /frequently asked|common questions/i
  ];

  const docSignals = [
    /installation|configuration|setup|tutorial/i,
    /step \d|procedure|instructions/i,
    /requirement|prerequisite|specification/i
  ];

  // Count signals
  const productScore = productSignals.filter(pattern => pattern.test(lowerChunk)).length;
  const faqScore = faqSignals.filter(pattern => pattern.test(lowerChunk)).length;
  const docScore = docSignals.filter(pattern => pattern.test(lowerChunk)).length;

  // Return highest scoring type
  if (productScore >= 2) return 'product';
  if (faqScore >= 2) return 'faq';
  if (docScore >= 2) return 'documentation';

  // Check title for additional hints
  if (lowerTitle.includes('product') || lowerTitle.includes('shop')) return 'product';
  if (lowerTitle.includes('faq') || lowerTitle.includes('question')) return 'faq';
  if (lowerTitle.includes('guide') || lowerTitle.includes('documentation')) return 'documentation';
  if (lowerTitle.includes('blog') || lowerTitle.includes('article')) return 'blog';

  return 'general';
}

/**
 * Extract named entities (products, brands, models, SKUs)
 */
export function extractEntities(text: string): EnhancedEmbeddingMetadata['entities'] {
  const entities: EnhancedEmbeddingMetadata['entities'] = {};

  // SKU patterns (e.g., DC66-10P, DC66-10P-24-V2, ABC-123, RLY-DC66-10P-V2, SKU12345)
  const skuPattern = /\b(?:SKU[\s]?[\d]+|(?:[A-Z]{2,}[-])?[A-Z]{2,}[\d]+(?:[-\/][A-Z0-9]+)*(?:-V\d+)?)\b/gi;
  const skus = text.match(skuPattern);
  if (skus) {
    entities.skus = [...new Set(skus.map(s => s.toUpperCase()))];
  }

  // Model numbers (e.g., Model 2000, XR-500)
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

  // Common brand detection (expand this list based on domain)
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

  // Product names (capitalize proper nouns that appear multiple times)
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

  // Limit to reasonable number of Q&A pairs
  return pairs.slice(0, 10);
}

/**
 * Extract e-commerce specific data
 */
export function extractEcommerceData(
  chunk: string,
  fullContent: string,
  htmlContent?: string
): Partial<EnhancedEmbeddingMetadata> {
  const result: Partial<EnhancedEmbeddingMetadata> = {};

  // Extract prices
  const pricePattern = /(?:[\$£€]\s?)([\d,]+(?:\.\d{2})?)/g;
  const prices: number[] = [];
  let priceMatch;
  while ((priceMatch = pricePattern.exec(chunk)) !== null) {
    if (priceMatch[1]) {
      const price = parseFloat(priceMatch[1].replace(',', ''));
      if (!isNaN(price)) prices.push(price);
    }
  }

  if (prices.length > 0) {
    result.price_range = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      currency: chunk.includes('£') ? 'GBP' : chunk.includes('€') ? 'EUR' : 'USD'
    };
  }

  // Extract availability
  if (/in stock|available now|ready to ship/i.test(chunk)) {
    result.availability = 'in_stock';
  } else if (/out of stock|sold out|unavailable/i.test(chunk)) {
    result.availability = 'out_of_stock';
  } else if (/pre-?order|coming soon/i.test(chunk)) {
    result.availability = 'preorder';
  } else if (/discontinued|no longer available/i.test(chunk)) {
    result.availability = 'discontinued';
  }

  // Extract ratings (simple pattern)
  const ratingPattern = /([\d.]+)\s*(?:out of\s*5|\s*stars?)/i;
  const ratingMatch = chunk.match(ratingPattern);
  if (ratingMatch && ratingMatch[1]) {
    const value = parseFloat(ratingMatch[1]);
    if (!isNaN(value) && value <= 5) {
      // Look for review count
      const countPattern = /(\d+)\s*(?:reviews?|ratings?)/i;
      const countMatch = chunk.match(countPattern);
      result.ratings = {
        value,
        count: countMatch && countMatch[1] ? parseInt(countMatch[1]) : 0
      };
    }
  }

  return result;
}

/**
 * Extract date from content
 */
export function extractDate(content: string, htmlContent?: string): string | undefined {
  // Common date patterns
  const datePatterns = [
    /(\d{4}-\d{2}-\d{2})/,  // ISO format
    /(\d{1,2}\/\d{1,2}\/\d{4})/,  // US format
    /(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/i,
    /\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/i
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      try {
        const date = new Date(match[0]);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch {}
    }
  }

  return undefined;
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

  // Extract phone numbers (various formats)
  const phonePatterns = [
    /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, // US format
    /\+?[0-9]{1,4}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, // International
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g // Simple format
  ];

  for (const pattern of phonePatterns) {
    const phones = text.match(pattern);
    if (phones && phones.length > 0) {
      // Clean up the phone number
      const cleaned = phones[0].replace(/[^\d+]/g, '');
      if (cleaned.length >= 10) {
        result.phone = phones[0];
        break;
      }
    }
  }

  // Extract address (simple pattern - can be enhanced)
  const addressPattern = /\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|boulevard|blvd)/gi;
  const addresses = text.match(addressPattern);
  if (addresses && addresses.length > 0) {
    result.address = addresses[0];
  }

  return Object.keys(result).length > 0 ? result : undefined;
}
