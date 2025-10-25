/**
 * Context Building and Formatting Utilities
 * Handles chunk processing, deduplication, and prompt formatting
 */

import { ContextChunk, QueryAnalysis } from './chat-context-enhancer-types';

/**
 * Deduplicate chunks by URL, keeping the highest similarity version
 */
export function deduplicateChunks(chunks: ContextChunk[]): ContextChunk[] {
  const uniqueMap = new Map<string, ContextChunk>();

  for (const chunk of chunks) {
    const existing = uniqueMap.get(chunk.url);
    if (!existing || chunk.similarity > existing.similarity) {
      uniqueMap.set(chunk.url, chunk);
    }
  }

  return Array.from(uniqueMap.values());
}

/**
 * Generate a summary of the context for the AI
 */
export function generateContextSummary(chunks: ContextChunk[]): string {
  const sources = chunks.map(c => c.source).filter(Boolean);
  const uniqueSources = [...new Set(sources)];

  const highConfidenceCount = chunks.filter(c => c.similarity > 0.8).length;
  const productCount = chunks.filter(c =>
    c.content.toLowerCase().includes('sku:') ||
    c.content.toLowerCase().includes('price:')
  ).length;

  const summaryParts = [
    `Found ${chunks.length} relevant information sources`,
    highConfidenceCount > 0 ? `${highConfidenceCount} with high confidence` : null,
    productCount > 0 ? `${productCount} product-related` : null,
    uniqueSources.length > 1 ? `from ${uniqueSources.join(' and ')} search` : null
  ].filter(Boolean);

  return summaryParts.join(', ');
}

/**
 * Filter chunks based on query relevance
 */
export function filterRelevantChunks(chunks: ContextChunk[], userQuery?: string): ContextChunk[] {
  if (!userQuery) {
    return chunks;
  }

  const queryLower = userQuery.toLowerCase();

  const stopWords = ['the', 'and', 'for', 'you', 'sell', 'have', 'show', 'what', 'which', 'any', 'some'];
  const queryWords = queryLower
    .split(/\s+/)
    .filter(word => word.length >= 3 && !stopWords.includes(word));

  if (queryWords.length === 0) {
    return chunks;
  }

  const relevantChunks = chunks.filter(chunk => {
    const contentLower = (chunk.title + ' ' + chunk.content).toLowerCase();

    const matchCount = queryWords.filter(word => {
      return contentLower.includes(word) ||
             queryWords.some(qw => {
               const similarity = Math.min(word.length, qw.length) >= 4 &&
                                 contentLower.includes(qw.substring(0, 4));
               return similarity;
             });
    }).length;

    return matchCount > 0 || chunk.similarity > 0.85;
  });

  if (relevantChunks.length > 0 && relevantChunks.length < chunks.length * 0.9) {
    return relevantChunks;
  }

  return chunks;
}

/**
 * Format chunks for inclusion in chat prompt
 */
export function formatChunksForPrompt(
  chunks: ContextChunk[],
  includeConfidenceGuide: boolean = true,
  userQuery?: string
): string {
  if (chunks.length === 0) {
    return 'No relevant information found.';
  }

  const filteredChunks = filterRelevantChunks(chunks, userQuery);

  const highConfidence = filteredChunks.filter(c => c.similarity > 0.75);
  const mediumConfidence = filteredChunks.filter(c => c.similarity > 0.55 && c.similarity <= 0.75);
  const lowConfidence = filteredChunks.filter(c => c.similarity <= 0.55);

  let formatted = '';

  if (includeConfidenceGuide) {
    formatted += '## CONFIDENCE GUIDE FOR RESPONSES:\n';
    formatted += '- HIGH confidence (>75%): Present these products/info directly and confidently\n';
    formatted += '- MEDIUM confidence (55-75%): Present with "These might be suitable" or "Based on what you described"\n';
    formatted += '- LOW confidence (<55%): Still present with "Here are some options that might work"\n';
    formatted += '⚠️ IMPORTANT: Even for vague queries, if products are found, PRESENT THEM!\n\n';
  }

  if (highConfidence.length > 0) {
    formatted += '## HIGH CONFIDENCE - Present these directly:\n\n';
    formatted += highConfidence.map((c, i) =>
      `### Product ${i + 1}: ${c.title || 'Product Information'} [${(c.similarity * 100).toFixed(0)}% match]\n${c.content}\nURL: ${c.url}\n`
    ).join('\n---\n\n');
  }

  if (mediumConfidence.length > 0) {
    formatted += '\n\n## MEDIUM CONFIDENCE - Present as suggestions:\n\n';
    formatted += mediumConfidence.map((c, i) =>
      `### Option ${highConfidence.length + i + 1}: ${c.title || 'Related Product'} [${(c.similarity * 100).toFixed(0)}% match]\n${c.content.substring(0, 500)}...\nURL: ${c.url}\n`
    ).join('\n---\n\n');
  }

  if (lowConfidence.length > 0 && filteredChunks.length < 10) {
    formatted += '\n\n## LOW CONFIDENCE - Use only as context:\n\n';
    formatted += lowConfidence.map(c =>
      `- ${c.title}: ${c.content.substring(0, 200)}... [${(c.similarity * 100).toFixed(0)}%]\n`
    ).join('');
  }

  formatted += '\n\n## SUMMARY:\n';
  formatted += `- Found ${highConfidence.length} highly relevant products\n`;
  formatted += `- Found ${mediumConfidence.length} possibly relevant products\n`;
  formatted += `- Total context items: ${filteredChunks.length}\n`;

  if (filteredChunks.length > 0) {
    formatted += '\n## RESPONSE INSTRUCTIONS:\n';
    formatted += '1. If user query is vague (like "its for X"), show the TOP 3-5 products above\n';
    formatted += '2. Present products FIRST, then mention category for more options\n';
    formatted += '3. Never say "I don\'t see specific products" if products are listed above\n';
    formatted += '4. For continuation queries, use the reformulated query context\n';
  }

  return formatted;
}

/**
 * Analyze query to determine optimal context strategy
 */
export function analyzeQueryIntent(query: string): QueryAnalysis {
  const queryLower = query.toLowerCase();

  const productPatterns = [
    /\b(sku|part|product|item|model)\s*[:#]?\s*[A-Z0-9]+/i,
    /\b(price|cost|how much|expensive)\b/i,
    /\b(in stock|available|availability)\b/i,
    /\b(buy|purchase|order)\b/i
  ];
  const needsProductContext = productPatterns.some(p => p.test(queryLower));

  const technicalPatterns = [
    /\b(specification|spec|dimension|weight|capacity|size)\b/i,
    /\b(compatible|fit|work with|suitable)\b/i,
    /\b(install|setup|configure|how to)\b/i,
    /\b(material|construction|feature)\b/i
  ];
  const needsTechnicalContext = technicalPatterns.some(p => p.test(queryLower));

  const needsGeneralContext = !needsProductContext && !needsTechnicalContext;

  let suggestedChunks = 15;
  if (needsTechnicalContext) suggestedChunks = 20;
  if (queryLower.includes('compare') || queryLower.includes('difference')) suggestedChunks = 25;

  return {
    needsProductContext,
    needsTechnicalContext,
    needsGeneralContext,
    suggestedChunks
  };
}
