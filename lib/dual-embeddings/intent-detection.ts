/**
 * Intent Detection
 * Query intent analysis and enrichment for dual embeddings
 */

import type { QueryIntent } from './types';

export function detectQueryIntent(query: string): QueryIntent {
  const lower = query.toLowerCase();

  const skuPattern = /\b[A-Z0-9]{2,}[-\/][A-Z0-9]+\b/i;
  const standaloneSkuPattern = /\b[A-Z]{1,3}\d{6,}\b/;
  const hasSKU = skuPattern.test(query) || standaloneSkuPattern.test(query);

  const hasPrice = /\b(price|cost|cheap|expensive|under|below|above|over|\$\d+|cheapest)\b/i.test(lower);
  const hasAvailability = /\b(in stock|available|availability|out of stock)\b/i.test(lower);
  const hasBrand = /\b(samsung|whirlpool|lg|ge|bosch|kenmore|maytag|frigidaire)\b/i.test(lower);
  const hasComparison = /\b(cheapest|most expensive|best|worst|compare)\b/i.test(lower);

  let type: 'product' | 'shopping' | 'price' | 'availability' | 'general' = 'general';

  if (hasSKU) type = 'product';
  else if (hasPrice && hasAvailability) type = 'shopping';
  else if (hasPrice) type = 'price';
  else if (hasAvailability) type = 'availability';

  return { type, hasSKU, hasPrice, hasAvailability, hasBrand, hasComparison, confidence: calculateIntentConfidence(query, type) };
}

export function enrichQueryByIntent(query: string, intent: QueryIntent): string {
  if (intent.hasSKU) return `SKU Part Number Product ${query}`;
  if (intent.hasPrice && intent.hasAvailability) return `Price Availability Stock Shopping ${query}`;
  if (intent.hasPrice) return `Price Cost ${query}`;
  if (intent.hasAvailability) return `Availability Stock Inventory ${query}`;
  if (intent.hasBrand) return `Brand Product ${query}`;
  return query;
}

export function createMetadataQuery(query: string, intent: QueryIntent): string {
  const parts: string[] = [];
  const terms = query.split(/\s+/).filter(t => t.length > 2);

  if (intent.hasSKU) {
    const skuMatch = query.match(/\b[A-Z0-9]{2,}[-\/][A-Z0-9]+\b/i) || query.match(/\b[A-Z]{1,3}\d{6,}\b/);
    if (skuMatch) {
      parts.push(`SKU: ${skuMatch[0]}`);
      parts.push(`Part Number: ${skuMatch[0]}`);
    }
  }

  if (intent.hasPrice) {
    const priceMatch = query.match(/\$?(\d+(?:\.\d+)?)/);
    if (priceMatch) parts.push(`Price: ${priceMatch[0]}`);
    if (query.includes('cheap')) parts.push('Price: Low');
    if (query.includes('expensive')) parts.push('Price: High');
  }

  if (intent.hasAvailability) {
    if (query.includes('in stock')) parts.push('Availability: In Stock', 'Stock: Available');
    else if (query.includes('out of stock')) parts.push('Availability: Out of Stock', 'Stock: Unavailable');
  }

  if (intent.hasBrand) {
    const brands = ['samsung', 'whirlpool', 'lg', 'ge', 'bosch'];
    const foundBrand = brands.find(b => query.toLowerCase().includes(b));
    if (foundBrand) parts.push(`Brand: ${foundBrand.charAt(0).toUpperCase()}${foundBrand.slice(1)}`);
  }

  const keywords = terms.filter(t => !['the', 'and', 'for', 'with', 'from'].includes(t.toLowerCase()));
  if (keywords.length > 0) parts.push(`Keywords: ${keywords.join(' ')}`);

  return parts.join(' | ');
}

export function calculateOptimalWeights(intent: QueryIntent): { text: number; metadata: number } {
  if (intent.type === 'product' && intent.hasSKU) return { text: 0.3, metadata: 0.7 };
  if (intent.type === 'shopping' || intent.type === 'price' || intent.type === 'availability') return { text: 0.4, metadata: 0.6 };
  if (intent.hasBrand) return { text: 0.5, metadata: 0.5 };
  return { text: 0.6, metadata: 0.4 };
}

function calculateIntentConfidence(query: string, type: string): number {
  if (type === 'product' && (/\b[A-Z0-9]{2,}[-\/][A-Z0-9]+\b/i.test(query) || /\b[A-Z]{1,3}\d{6,}\b/.test(query))) return 0.95;
  if (type === 'price' && /\$\d+/.test(query)) return 0.9;
  if (type === 'availability' && /\b(in stock|available)\b/i.test(query)) return 0.85;
  return 0.5;
}
