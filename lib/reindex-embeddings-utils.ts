/**
 * Utility functions for the Embeddings Reindex System
 */

import { ReindexProgress } from './reindex-embeddings-types';

/**
 * Clean text of navigation and CSS artifacts
 */
export function cleanText(text: string): string {
  return text
    // Remove style tags and content
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Remove script tags and content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Remove inline CSS
    .replace(/style\s*=\s*["'][^"']*["']/gi, '')
    // Remove common navigation patterns
    .replace(/\b(home|about|contact us|privacy policy|terms|cookie policy|newsletter|subscribe)\b/gi, match => {
      const context = text.substring(
        Math.max(0, text.indexOf(match) - 50),
        Math.min(text.length, text.indexOf(match) + 50)
      );
      // Only remove if it looks like navigation
      if (context.includes('menu') || context.includes('footer') || context.includes('header')) {
        return '';
      }
      return match;
    })
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, '')
    // Remove special characters and extra whitespace
    .replace(/[^\w\s.,!?-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Chunk text with proper size enforcement and cleaning
 */
export function chunkText(text: string, maxSize: number): string[] {
  if (!text || text.length === 0) return [];

  // Clean the text first
  const cleanedText = cleanText(text);
  if (cleanedText.length < 100) return [];

  const chunks: string[] = [];
  const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed || trimmed.length < 20) continue;

    if (currentChunk && (currentChunk.length + trimmed.length + 1) > maxSize) {
      // Save current chunk
      chunks.push(currentChunk.substring(0, maxSize).trim());
      currentChunk = trimmed.substring(0, maxSize);
    } else if (trimmed.length > maxSize) {
      // Split oversized sentence
      if (currentChunk) {
        chunks.push(currentChunk.substring(0, maxSize).trim());
      }
      let remaining = trimmed;
      while (remaining.length > 0) {
        chunks.push(remaining.substring(0, maxSize).trim());
        remaining = remaining.substring(maxSize).trim();
      }
      currentChunk = '';
    } else {
      currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
    }
  }

  if (currentChunk.trim().length > 100) {
    chunks.push(currentChunk.substring(0, maxSize).trim());
  }

  // Final validation
  return chunks
    .filter(chunk => chunk.length > 100 && chunk.length <= maxSize)
    .map(chunk => chunk.substring(0, maxSize));
}

/**
 * Update progress and notify callback
 */
export function updateProgress(
  phase: ReindexProgress['phase'],
  current: number,
  total: number,
  message: string,
  errors: string[],
  onProgress?: (progress: ReindexProgress) => void
): ReindexProgress {
  const progress: ReindexProgress = {
    phase,
    current,
    total,
    percentage: total > 0 ? Math.round((current / total) * 100) : 0,
    message,
    errors: errors.length > 0 ? errors : undefined
  };

  if (onProgress) {
    onProgress(progress);
  }

  return progress;
}

/**
 * Calculate statistics from chunk sizes
 */
export function calculateStatistics(chunkSizes: number[]): {
  avgChunkSize: number;
  maxChunkSize: number;
} {
  const avgChunkSize = chunkSizes.length > 0
    ? Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length)
    : 0;
  const maxChunkSize = chunkSizes.length > 0
    ? Math.max(...chunkSizes)
    : 0;

  return { avgChunkSize, maxChunkSize };
}

/**
 * Validate chunk quality
 */
export function validateChunks(
  samples: Array<{ chunk_text: string; metadata: any }>,
  targetChunkSize: number
): {
  oversized: number;
  contaminated: number;
  validationPassed: boolean;
} {
  // Check chunk sizes
  const oversized = samples.filter(s =>
    s.chunk_text && s.chunk_text.length > targetChunkSize
  );

  // Check for navigation contamination
  const contaminated = samples.filter(s => {
    const text = (s.chunk_text || '').toLowerCase();
    return text.includes('cookie policy') ||
           text.includes('newsletter subscribe') ||
           (text.includes('home') && text.includes('about') && text.includes('contact'));
  });

  const validationPassed =
    oversized.length === 0 &&
    contaminated.length < samples.length * 0.05; // Less than 5% contamination

  return {
    oversized: oversized.length,
    contaminated: contaminated.length,
    validationPassed
  };
}
