/**
 * Text Chunking Utilities
 * @module lib/scraper/utils/chunking
 */

import crypto from 'crypto';

// Cache for chunk deduplication
const chunkHashCache = new Map();

/**
 * Fallback SemanticChunker class (simplified version)
 */
export class SemanticChunker {
  static smartChunk(text, options = {}) {
    const maxChunkSize = options.maxChunkSize || 1500;
    const overlap = options.overlap || 200;
    const chunks = [];

    // Simple sentence-aware chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        // Add overlap from the end of the previous chunk
        currentChunk = currentChunk.slice(-overlap) + sentence;
      } else {
        currentChunk += sentence;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks.length > 0 ? chunks : [text];
  }
}

/**
 * Simple chunking fallback function
 */
export function simpleChunking(text, maxChunkSize) {
  const sentences = text.split(/[.!?]+/);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Helper function to generate SHA-256 hash for content
 */
export function generateChunkHash(text) {
  // Normalize text for consistent hashing
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();

  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}

/**
 * Helper function to check if chunk is duplicate
 */
export function isDuplicateChunk(chunkText, pageUrl, jobId) {
  const chunkHash = generateChunkHash(chunkText);

  // Check if we've seen this exact chunk before
  if (chunkHashCache.has(chunkHash)) {
    const existingUrl = chunkHashCache.get(chunkHash);
    // If it's from a different page, it's likely a common element
    if (existingUrl !== pageUrl) {
      console.log(`[Worker ${jobId}] Duplicate chunk detected (seen on ${existingUrl})`);
      return true;
    }
  }

  // Mark this chunk as seen
  chunkHashCache.set(chunkHash, pageUrl);
  return false;
}

/**
 * Helper function to split text into chunks with global deduplication
 */
export async function splitIntoChunks(text, maxChunkSize = 1000, pageUrl = '', htmlContent = null, jobId = '') {
  let allChunks = [];

  // Try semantic chunking first if we have enough content
  if (text.length > 500 && htmlContent) {
    try {
      console.log(`[Worker ${jobId}] Using semantic chunking for ${pageUrl}`);
      const semanticChunks = SemanticChunker.smartChunk(text, { maxChunkSize: maxChunkSize });

      // SemanticChunker.smartChunk returns an array of strings
      allChunks = semanticChunks;

      console.log(`[Worker ${jobId}] Created ${allChunks.length} semantic chunks (avg size: ${Math.round(text.length / allChunks.length)} chars)`);
    } catch (error) {
      console.error(`[Worker ${jobId}] Semantic chunking failed, falling back to simple chunking:`, error);
      // Fall back to simple chunking
      allChunks = simpleChunking(text, maxChunkSize);
    }
  } else {
    // Use simple chunking for short content or when no HTML available
    allChunks = simpleChunking(text, maxChunkSize);
  }

  // Filter out boilerplate chunks
  const nonBoilerplateChunks = allChunks.filter(chunk => !isDuplicateChunk(chunk, pageUrl, jobId));

  return nonBoilerplateChunks;
}

/**
 * Helper function to get cache statistics
 */
export function getCacheStats() {
  return {
    chunkHashes: chunkHashCache.size,
    estimatedMemoryMB: (chunkHashCache.size * 100) / 1024 / 1024
  };
}
