/**
 * Improved Search Utility Functions
 * Extracted from improved-search.ts to maintain <300 LOC file length limit
 */

import { IMPROVED_CONFIG } from './improved-search-config';

/**
 * Intelligently combine product chunks prioritizing important information
 */
export function combineProductChunks(chunks: any[]): string {
  const sections = {
    sku: '',
    description: '',
    specifications: '',
    price: '',
    features: '',
    other: ''
  };

  // Categorize chunks
  for (const chunk of chunks) {
    const text = chunk.chunk_text || '';
    const textLower = text.toLowerCase();

    // Prioritize complete product information
    if (textLower.includes('sku:') && textLower.includes('description')) {
      sections.description = text + '\n' + sections.description;
    } else if (textLower.includes('sku:') || textLower.includes('item number')) {
      sections.sku += text + '\n';
    } else if (textLower.includes('specification') ||
               textLower.includes('capacity') ||
               textLower.includes('pressure') ||
               textLower.includes('standard')) {
      sections.specifications += text + '\n';
    } else if (textLower.includes('£') || textLower.includes('price')) {
      sections.price += text + '\n';
    } else if (textLower.includes('feature') || textLower.includes('include')) {
      sections.features += text + '\n';
    } else {
      sections.other += text.substring(0, 200) + '\n';
    }
  }

  // Combine in priority order
  let combined = '';
  if (sections.sku) combined += sections.sku;
  if (sections.description) combined += '\n' + sections.description;
  if (sections.specifications) combined += '\n' + sections.specifications;
  if (sections.price) combined += '\n' + sections.price;
  if (sections.features) combined += '\n' + sections.features;
  if (sections.other && combined.length < 3000) {
    combined += '\n' + sections.other;
  }

  return combined.trim();
}

/**
 * Apply smart truncation that preserves important content
 */
export function applySmartTruncation(
  results: any[],
  baseLength: number
): any[] {
  return results.map(result => {
    const url = result.url.toLowerCase();
    let maxLength = baseLength;

    // Determine content type from URL
    if (url.includes('/product/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.product;
    } else if (url.includes('/support/') || url.includes('/help/') || url.includes('/guide/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.support;
    } else if (url.includes('/policy/') || url.includes('/terms/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.policy;
    } else if (url.includes('/blog/') || url.includes('/news/')) {
      maxLength = IMPROVED_CONFIG.truncationLengths.blog;
    }

    // Smart truncation: try to break at sentence boundaries
    if (result.content.length > maxLength) {
      let truncated = result.content.substring(0, maxLength);

      // Try to find last complete sentence
      const lastPeriod = truncated.lastIndexOf('.');
      const lastExclamation = truncated.lastIndexOf('!');
      const lastQuestion = truncated.lastIndexOf('?');

      const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      if (lastSentenceEnd > maxLength * 0.8) {
        truncated = truncated.substring(0, lastSentenceEnd + 1);
      }

      result.content = truncated;
    }

    return result;
  });
}

/**
 * Re-rank results based on query type priorities
 */
export function rerankResults(
  results: any[],
  queryType: 'product' | 'support' | 'policy' | 'general'
): any[] {
  return results.map(result => {
    let boost = 1.0;
    const url = result.url.toLowerCase();
    const content = result.content.toLowerCase();

    if (queryType === 'product') {
      // Boost product pages
      if (url.includes('/product/')) boost *= 1.3;
      if (content.includes('sku:')) boost *= 1.2;
      if (content.includes('price')) boost *= 1.1;
      if (result.enhanced) boost *= 1.2; // Boost enhanced results
    } else if (queryType === 'support') {
      // Boost support content
      if (url.includes('/support/') || url.includes('/help/')) boost *= 1.3;
      if (content.includes('step') || content.includes('how to')) boost *= 1.2;
    } else if (queryType === 'policy') {
      // Boost policy pages
      if (url.includes('/policy/') || url.includes('/terms/')) boost *= 1.3;
      if (content.includes('policy') || content.includes('terms')) boost *= 1.2;
    }

    // Apply boost to similarity
    result.adjustedSimilarity = Math.min(result.similarity * boost, 1.0);
    return result;
  }).sort((a, b) => b.adjustedSimilarity - a.adjustedSimilarity);
}

/**
 * Get search quality metrics for monitoring
 */
export function getSearchQualityMetrics(results: any[]): {
  totalResults: number;
  enhancedResults: number;
  avgSimilarity: number;
  avgContentLength: number;
  hasHighConfidence: boolean;
  coverageScore: number;
} {
  const enhancedCount = results.filter(r => r.enhanced).length;
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / Math.max(results.length, 1);
  const avgContentLength = results.reduce((sum, r) => sum + r.content.length, 0) / Math.max(results.length, 1);
  const hasHighConfidence = results.some(r => r.similarity > 0.85);

  // Coverage score: combination of result count and quality
  const coverageScore = Math.min(
    (results.length / 10) * 0.3 +  // Quantity factor
    avgSimilarity * 0.4 +           // Quality factor
    (enhancedCount / Math.max(results.length, 1)) * 0.3, // Enhancement factor
    1.0
  );

  return {
    totalResults: results.length,
    enhancedResults: enhancedCount,
    avgSimilarity,
    avgContentLength,
    hasHighConfidence,
    coverageScore
  };
}
