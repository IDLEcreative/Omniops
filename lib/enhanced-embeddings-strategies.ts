/**
 * Chunk processing strategies for Enhanced Embeddings
 * Handles prioritization, selection, grouping, and token limiting
 */

import type { ChunkResult } from './enhanced-embeddings-types';

/**
 * Prioritize chunks based on relevance and position
 */
export function prioritizeChunks(chunks: any[], prioritizeFirst: boolean): ChunkResult[] {
  return chunks.map(chunk => {
    let priority = chunk.similarity || 0;

    // Boost first chunks (usually contain overview/summary)
    if (prioritizeFirst && chunk.chunk_index === 0) {
      priority *= 1.3;
    }

    // Boost chunks containing specifications or descriptions
    const contentLower = (chunk.content || '').toLowerCase();
    if (contentLower.includes('specification') ||
        contentLower.includes('description:') ||
        contentLower.includes('features:') ||
        contentLower.includes('includes:')) {
      priority *= 1.2;
    }

    // Boost chunks with structured data (likely product info)
    if (contentLower.includes('sku:') ||
        contentLower.includes('price:') ||
        contentLower.includes('brand:') ||
        contentLower.includes('category:')) {
      priority *= 1.15;
    }

    // Slightly penalize very long chunks (might be boilerplate)
    if (chunk.content && chunk.content.length > 5000) {
      priority *= 0.9;
    }

    return {
      ...chunk,
      priority
    };
  }).sort((a, b) => b.priority - a.priority);
}

/**
 * Select optimal chunks ensuring minimum coverage
 */
export function selectOptimalChunks(chunks: ChunkResult[], minChunks: number): ChunkResult[] {
  // Always include high-relevance chunks (similarity > 0.75) - adjusted thresholds
  const highRelevance = chunks.filter(c => c.similarity > 0.75);

  // Fill with medium relevance if needed (similarity > 0.55)
  const mediumRelevance = chunks.filter(c =>
    c.similarity > 0.55 && c.similarity <= 0.75
  );

  // Include some lower relevance for context if still needed (similarity > 0.45)
  const lowerRelevance = chunks.filter(c =>
    c.similarity > 0.45 && c.similarity <= 0.55
  );

  // Combine to meet minimum chunks requirement
  const selected = [
    ...highRelevance,
    ...mediumRelevance.slice(0, Math.max(0, minChunks - highRelevance.length)),
    ...lowerRelevance.slice(0, Math.max(0, minChunks - highRelevance.length - mediumRelevance.length))
  ];

  // Ensure we don't exceed maximum token limits
  return trimToTokenLimit(selected);
}

/**
 * Group chunks by their source page for better context understanding
 */
export function groupChunksByPage(chunks: ChunkResult[]): Map<string, any> {
  const grouped = new Map();

  for (const chunk of chunks) {
    const pageId = chunk.page_id || chunk.url;
    if (!grouped.has(pageId)) {
      grouped.set(pageId, {
        url: chunk.url,
        title: chunk.title,
        chunks: [],
        maxSimilarity: chunk.similarity,
        metadata: chunk.metadata
      });
    }

    const page = grouped.get(pageId);
    page.chunks.push(chunk);
    page.maxSimilarity = Math.max(page.maxSimilarity, chunk.similarity);
  }

  // Sort chunks within each page by position
  grouped.forEach((page) => {
    page.chunks.sort((a: any, b: any) =>
      (a.chunk_index || 0) - (b.chunk_index || 0)
    );
  });

  return grouped;
}

/**
 * Ensure we don't exceed token limits for the AI model
 */
export function trimToTokenLimit(chunks: ChunkResult[]): ChunkResult[] {
  const MAX_TOKENS = 12000; // Leave room for response
  let totalTokens = 0;
  const selected = [];

  for (const chunk of chunks) {
    const estimatedTokens = Math.ceil((chunk.content?.length || 0) / 4);
    if (totalTokens + estimatedTokens < MAX_TOKENS) {
      selected.push(chunk);
      totalTokens += estimatedTokens;
    } else {
      console.log(`[Enhanced Embeddings] Trimmed at ${selected.length} chunks due to token limit`);
      break;
    }
  }

  return selected;
}

/**
 * Process and prioritize chunks based on various factors
 */
export function processChunks(
  embeddings: any[],
  minChunks: number,
  prioritizeFirst: boolean,
  groupByPage: boolean
): {
  chunks: ChunkResult[];
  groupedContext: Map<string, any>;
  totalRetrieved: number;
  averageSimilarity: number;
} {
  // Apply smart prioritization
  const prioritized = prioritizeChunks(embeddings, prioritizeFirst);

  // Ensure we have at least minChunks
  const selected = selectOptimalChunks(prioritized, minChunks);

  // Group by page if requested
  const grouped = groupByPage ? groupChunksByPage(selected) : new Map();

  // Calculate average similarity for quality assessment
  const avgSimilarity = selected.reduce((sum, c) => sum + c.similarity, 0) / selected.length;

  console.log(`[Enhanced Embeddings] Retrieved ${selected.length} chunks with avg similarity ${avgSimilarity.toFixed(3)}`);

  return {
    chunks: selected,
    groupedContext: grouped,
    totalRetrieved: selected.length,
    averageSimilarity: avgSimilarity
  };
}
