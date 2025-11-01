/**
 * Semantic Chunker Utilities
 */

import { PATTERNS, IDEAL_CHUNK_SIZE } from './types';
import type { SemanticChunk } from './types';

export function stripHtmlFast(html: string): string {
  return html.replace(PATTERNS.htmlTags, ' ').replace(PATTERNS.whitespace, ' ').trim();
}

export function calculateMetadataFast(content: string): SemanticChunk['metadata'] {
  return {
    has_complete_sentences: /[.!?]$/.test(content.trim()),
    word_count: content.split(/\s+/).filter(Boolean).length,
    char_count: content.length,
    contains_list: PATTERNS.listItem.test(content),
    contains_code: content.includes('```') || content.includes('<code'),
    contains_table: content.includes('<table') || content.includes('|')
  };
}

export function calculateCompleteness(content: string, type: string): number {
  let score = 0.5;
  if (/[.!?]$/.test(content.trim())) score += 0.2;
  const ratio = content.length / IDEAL_CHUNK_SIZE;
  if (ratio >= 0.3 && ratio <= 1.5) {
    score += 0.2 * (1 - Math.abs(1 - ratio));
  }
  if (type !== 'mixed') score += 0.1;
  return Math.min(score, 1.0);
}

export function findLastSentenceEnd(text: string): number {
  const lastPeriod = text.lastIndexOf('.');
  const lastQuestion = text.lastIndexOf('?');
  const lastExclamation = text.lastIndexOf('!');
  const lastEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
  return lastEnd > 0 ? lastEnd + 1 : text.length;
}

export function mapTagToType(tag: string): string {
  if (tag.startsWith('h')) return 'heading';
  if (tag === 'p') return 'paragraph';
  if (tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'table') return 'table';
  if (tag === 'code' || tag === 'pre') return 'code';
  return 'mixed';
}
