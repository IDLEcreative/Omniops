/**
 * Content Classification Functions
 */

import type { ContentType } from '../metadata-extractor-types';

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
