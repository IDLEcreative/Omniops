/**
 * Search Algorithm Utilities
 *
 * Core algorithms for semantic search including:
 * - Embedding generation
 * - Cosine similarity calculation
 * - Result scoring and merging
 * - Text highlighting
 *
 * @module lib/search/search-algorithms
 */

import type { SearchResult } from './conversation-search';

interface ScoredResult extends SearchResult {
  ftsScore?: number;
  semanticScore?: number;
  combinedScore: number;
}

/**
 * Generate embedding for query text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  // TODO: Integrate with OpenAI embeddings API
  // For now, return mock embedding
  return new Array(1536).fill(0).map(() => Math.random());
}

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dotProduct += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Score and merge results from both search methods
 */
export function scoreAndMergeResults(
  ftsResults: ScoredResult[],
  semanticResults: ScoredResult[],
  config: { ftsWeight: number; semanticWeight: number }
): ScoredResult[] {
  const mergedMap = new Map<string, ScoredResult>();

  // Normalize FTS scores
  const maxFtsScore = Math.max(...ftsResults.map(r => r.ftsScore || 0), 0.01);

  ftsResults.forEach(result => {
    const normalizedScore = (result.ftsScore || 0) / maxFtsScore;
    mergedMap.set(result.messageId, {
      ...result,
      ftsScore: normalizedScore,
      combinedScore: normalizedScore * config.ftsWeight
    });
  });

  // Normalize and merge semantic scores
  const maxSemanticScore = Math.max(
    ...semanticResults.map(r => r.semanticScore || 0),
    0.01
  );

  semanticResults.forEach(result => {
    const normalizedScore = (result.semanticScore || 0) / maxSemanticScore;
    const existing = mergedMap.get(result.messageId);

    if (existing) {
      // Message found in both searches - combine scores
      existing.semanticScore = normalizedScore;
      existing.combinedScore =
        (existing.ftsScore || 0) * config.ftsWeight +
        normalizedScore * config.semanticWeight;

      // Use the better highlight
      if (result.highlight.includes('<mark>')) {
        existing.highlight = result.highlight;
      }
    } else {
      // Only in semantic results
      mergedMap.set(result.messageId, {
        ...result,
        semanticScore: normalizedScore,
        combinedScore: normalizedScore * config.semanticWeight
      });
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Deduplicate results by conversation and adjacent messages
 */
export function deduplicateResults(results: ScoredResult[]): ScoredResult[] {
  const deduplicated: ScoredResult[] = [];

  // Group by conversation
  const byConversation = new Map<string, ScoredResult[]>();

  results.forEach(result => {
    const convResults = byConversation.get(result.conversationId) || [];
    convResults.push(result);
    byConversation.set(result.conversationId, convResults);
  });

  // Keep best result per conversation
  byConversation.forEach(convResults => {
    // Sort by score within conversation
    convResults.sort((a, b) => b.combinedScore - a.combinedScore);

    // Take top result and maybe one more if significantly different
    const topResult = convResults[0];
    if (topResult) {
      deduplicated.push(topResult);
    }

    const secondResult = convResults[1];
    if (convResults.length > 1 && secondResult && secondResult.combinedScore > 0.5 && topResult) {
      // Check if messages are not adjacent
      const time1 = new Date(topResult.createdAt).getTime();
      const time2 = new Date(secondResult.createdAt).getTime();
      const timeDiff = Math.abs(time1 - time2) / 1000; // seconds

      if (timeDiff > 60) {
        // Messages are more than 1 minute apart
        deduplicated.push(secondResult);
      }
    }
  });

  return deduplicated;
}

/**
 * Highlight the most relevant section of content
 */
export function highlightRelevantSection(content: string, query: string): string {
  const words = query.toLowerCase().split(/\s+/);
  const contentLower = content.toLowerCase();

  // Find the position of the first matching word
  let firstMatch = -1;
  for (const word of words) {
    const pos = contentLower.indexOf(word);
    if (pos !== -1 && (firstMatch === -1 || pos < firstMatch)) {
      firstMatch = pos;
    }
  }

  // Extract a window around the first match
  const start = Math.max(0, firstMatch - 50);
  const end = Math.min(content.length, firstMatch + 150);

  let excerpt = content.substring(start, end);
  if (start > 0) excerpt = '...' + excerpt;
  if (end < content.length) excerpt = excerpt + '...';

  // Highlight matching words
  words.forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'gi');
    excerpt = excerpt.replace(regex, '<mark>$1</mark>');
  });

  return excerpt;
}
