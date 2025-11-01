/**
 * Streaming Processor
 * Handles large documents with memory-efficient stream processing
 */

import { calculateMetadataFast, findLastSentenceEnd } from './utils';
import type { SemanticChunk } from './types';

const STREAM_SIZE = 10000; // Process 10KB at a time

/**
 * Stream processing for large documents to avoid memory spikes
 * Processes content in chunks to prevent loading entire document into memory
 */
export async function streamChunkLargeContent(
  content: string,
  htmlContent?: string
): Promise<SemanticChunk[]> {
  const chunks: SemanticChunk[] = [];
  let position = 0;
  let chunkIndex = 0;
  let previousOverlap = '';

  while (position < content.length) {
    const segment = content.slice(position, position + STREAM_SIZE);
    const lastSentenceEnd = findLastSentenceEnd(segment);
    const processSegment = segment.slice(0, lastSentenceEnd);

    if (processSegment.trim()) {
      const chunk: SemanticChunk = {
        content: previousOverlap + processSegment,
        type: 'mixed',
        parent_heading: '',
        heading_hierarchy: [],
        semantic_completeness: 0.7,
        boundary_type: 'natural',
        overlap_with_previous: previousOverlap,
        overlap_with_next: '',
        chunk_index: chunkIndex++,
        total_chunks: Math.ceil(content.length / STREAM_SIZE),
        metadata: calculateMetadataFast(processSegment)
      };

      chunks.push(chunk);
      previousOverlap = processSegment.slice(-Math.min(100, processSegment.length / 4));
    }

    position += lastSentenceEnd;
  }

  return chunks;
}
