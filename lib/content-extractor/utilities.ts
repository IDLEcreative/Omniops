/**
 * Content utility functions
 */

import { createHash } from 'crypto';
import { ExtractedContent } from './types';

/**
 * Clean content
 */
export function cleanContent(content: string): string {
  return content
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/\s+$/gm, '') // Remove trailing spaces
    .replace(/^\s+/gm, '') // Remove leading spaces
    .replace(/\[(.+?)\]\(\)/g, '$1') // Remove empty links
    .replace(/!\[(.+?)\]\(\)/g, '') // Remove broken images
    .trim();
}

/**
 * Generate content hash for deduplication
 */
export function generateContentHash(content: string): string {
  // Normalize content for hashing
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();

  return createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for efficiency
}

/**
 * Check if content is meaningful (not error pages, etc.)
 */
export function isValidContent(content: ExtractedContent): boolean {
  // Check minimum word count
  if (content.wordCount < 50) {
    return false;
  }

  // Check for common error page indicators
  const errorIndicators = [
    '404 not found',
    '403 forbidden',
    '500 internal server error',
    'access denied',
    'page not found',
    'error occurred',
  ];

  const lowerContent = content.textContent.toLowerCase();
  for (const indicator of errorIndicators) {
    if (lowerContent.includes(indicator) && content.wordCount < 200) {
      return false;
    }
  }

  return true;
}
